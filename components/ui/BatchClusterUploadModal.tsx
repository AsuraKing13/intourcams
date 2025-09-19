import React, { useState, useCallback } from 'react';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import FileUpload from './FileUpload.tsx';
import { useToast } from '../ToastContext.tsx';
import { useAppContext } from '../AppContext.tsx';
import { DownloadIcon, XCircleIcon } from '../../constants.tsx';
import { AddClusterData } from '../../types.ts';


interface BatchClusterUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CSV_TEMPLATE_STRING = `name,location,description,category,timing,image,latitude,longitude,display_address
"Example Cluster","Kuching Waterfront","A lovely, scenic place to visit.","Culture;Nature","9am - 10pm","https://example.com/image.jpg",1.557,110.344,"Kuching Waterfront, Kuching, Sarawak, Malaysia"
"Another Spot","Main Bazaar","A great spot for food lovers.","Foods","24 hours",,,1.558,110.346,"Main Bazaar, Kuching, Sarawak, Malaysia"`;

const EXPECTED_HEADERS: (keyof AddClusterData | string)[] = ['name', 'location', 'description', 'category', 'timing', 'image', 'latitude', 'longitude', 'display_address'];

const BatchClusterUploadModal: React.FC<BatchClusterUploadModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<AddClusterData[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addClustersBatch } = useAppContext();
    const { showToast } = useToast();

    const resetState = useCallback(() => {
        setFile(null);
        setParsedData([]);
        setErrors([]);
        setIsProcessing(false);
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileSelect = (selectedFile: File | null) => {
        if (!selectedFile) {
            resetState();
            return;
        }
        setFile(selectedFile);
        parseCsv(selectedFile);
    };

    const parseCsv = (csvFile: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) {
                setErrors(["File is empty or could not be read."]);
                return;
            }

            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                setErrors(["CSV must contain a header row and at least one data row."]);
                return;
            }

            const headerLine = lines[0].split(',').map(h => h.trim());
            const dataLines = lines.slice(1);
            const newParsedData: AddClusterData[] = [];
            const newErrors: string[] = [];

            if (!headerLine.includes('name')) {
                 newErrors.push("CSV is missing the required 'name' header.");
            }

            dataLines.forEach((line, index) => {
                const values: string[] = [];
                let currentVal = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"' && line[i-1] !== '\\') { // Handle quotes that aren't escaped
                        if (inQuotes && line[i+1] === '"') { // Handle escaped double quotes ""
                            currentVal += '"';
                            i++;
                        } else {
                           inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentVal.trim());
                        currentVal = '';
                    } else {
                        currentVal += char;
                    }
                }
                values.push(currentVal.trim());

                if (values.length !== headerLine.length) {
                    newErrors.push(`Row ${index + 2}: Column count mismatch. Expected ${headerLine.length}, but found ${values.length}.`);
                    return; // Skip this malformed row
                }

                const rowData: any = {};
                headerLine.forEach((header, i) => {
                    if (EXPECTED_HEADERS.includes(header as any)) {
                         rowData[header] = values[i] ? values[i] : '';
                    }
                });

                if (!rowData.name) {
                    newErrors.push(`Row ${index + 2}: 'name' is missing.`);
                    return;
                }

                const clusterEntry: AddClusterData = {
                    name: rowData.name,
                    location: rowData.location || '',
                    description: rowData.description || '',
                    category: rowData.category ? rowData.category.split(';').map((c: string) => c.trim()).filter(Boolean) : [],
                    timing: rowData.timing || '',
                    image: rowData.image || '',
                    latitude: rowData.latitude ? parseFloat(rowData.latitude) : null,
                    longitude: rowData.longitude ? parseFloat(rowData.longitude) : null,
                    display_address: rowData.display_address || null,
                };
                newParsedData.push(clusterEntry);
            });

            setParsedData(newParsedData);
            setErrors(newErrors);
        };
        reader.onerror = () => {
             setErrors(["Failed to read the file."]);
        };
        reader.readAsText(csvFile);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE_STRING], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'clusters_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleUpload = async () => {
        if (parsedData.length === 0) {
            showToast("No valid data to upload.", "info");
            return;
        }
        setIsProcessing(true);
        try {
            await addClustersBatch(parsedData);
            handleClose(); // Close on success
        } catch(error) {
            // Error toast is handled by the context
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Batch Upload Clusters" size="xl">
            <div className="space-y-4">
                <div className="p-4 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg text-sm space-y-2">
                    <p>Upload a CSV file to add multiple tourism clusters at once. The file must follow a specific format.</p>
                    <ul className="list-disc list-inside text-xs pl-2">
                        <li>The first row must be a header row. Only `name` is required.</li>
                        <li>For the `category` column, separate multiple categories with a semicolon (e.g., "Culture;Nature").</li>
                        <li>Fields with commas (like descriptions) must be enclosed in double quotes.</li>
                    </ul>
                </div>

                <Button variant="secondary" onClick={handleDownloadTemplate} leftIcon={<DownloadIcon className="w-5 h-5" />}>
                    Download CSV Template
                </Button>

                <FileUpload onFileSelect={handleFileSelect} acceptedTypes=".csv" />

                {file && (
                    <div className="space-y-2">
                        <h4 className="font-semibold">File Analysis Results</h4>
                        {parsedData.length > 0 && (
                            <p className="text-green-600 dark:text-green-400">
                                Found {parsedData.length} valid cluster entries to upload.
                            </p>
                        )}
                        {errors.length > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-md max-h-40 overflow-y-auto custom-scrollbar">
                                <h5 className="font-semibold text-red-700 dark:text-red-300 flex items-center">
                                    <XCircleIcon className="w-5 h-5 mr-2" />
                                    {errors.length} Parsing Errors Found
                                </h5>
                                <ul className="list-disc list-inside pl-2 text-red-600 dark:text-red-400 text-sm mt-1">
                                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                    <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                        isLoading={isProcessing}
                        disabled={isProcessing || parsedData.length === 0}
                    >
                        Upload {parsedData.length > 0 ? `${parsedData.length} Clusters` : ''}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default BatchClusterUploadModal;