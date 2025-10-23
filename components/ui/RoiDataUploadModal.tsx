import React, { useState, useCallback } from 'react';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import FileUpload from './FileUpload.tsx';
import { useToast } from '../ToastContext.tsx';
import { useAppContext } from '../AppContext.tsx';
import { DownloadIcon, XCircleIcon } from '../../constants.tsx';

// The data shape for insertion, doesn't need id or created_at
type RoiDataInsert = {
    year: number;
    revenue: number;
    income: number;
};

interface RoiDataUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CSV_TEMPLATE_STRING = `year,revenue,income
2024,1500000,300000
2023,1250000,250000`;

const EXPECTED_HEADERS: (keyof RoiDataInsert)[] = ['year', 'revenue', 'income'];

const RoiDataUploadModal: React.FC<RoiDataUploadModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<RoiDataInsert[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { uploadRoiAnalyticsBatch } = useAppContext();
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
            const dataRows = lines.slice(1);

            const newErrors: string[] = [];
            const newParsedData: RoiDataInsert[] = [];
            
            const missingHeaders = EXPECTED_HEADERS.filter(h => !headerLine.includes(h));
            if (missingHeaders.length > 0) {
                newErrors.push(`CSV is missing required headers: ${missingHeaders.join(', ')}.`);
            }

            dataRows.forEach((line, index) => {
                const values = line.split(',');
                if (values.length !== headerLine.length) {
                    newErrors.push(`Row ${index + 2}: Column count mismatch. Expected ${headerLine.length}, but found ${values.length}.`);
                    return;
                }

                const rowData: any = {};
                headerLine.forEach((header, i) => {
                    if (EXPECTED_HEADERS.includes(header as any)) {
                         rowData[header] = values[i] || '';
                    }
                });

                const year = parseInt(rowData.year, 10);
                const revenue = parseFloat(rowData.revenue);
                const income = parseFloat(rowData.income);

                if (isNaN(year) || isNaN(revenue) || isNaN(income)) {
                    newErrors.push(`Row ${index + 2}: 'year', 'revenue', and 'income' must be valid numbers.`);
                    return;
                }
                
                if (year < 1900 || year > 2100) {
                    newErrors.push(`Row ${index + 2}: 'year' seems invalid.`);
                    return;
                }

                newParsedData.push({ year, revenue, income });
            });

            setParsedData(newParsedData);
            setErrors(newErrors);
        };
        reader.onerror = () => setErrors(["Failed to read the file."]);
        reader.readAsText(csvFile);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE_STRING], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'roi_analytics_template.csv');
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
            await uploadRoiAnalyticsBatch(parsedData);
            handleClose();
        } catch(error) {
            // Error toast is handled by the context
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload ROI Analytics Data" size="xl">
            <div className="space-y-4">
                <div className="p-4 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg text-sm space-y-2">
                    <p>Upload a CSV file to add or update ROI analytics. Data will be upserted based on the 'year' column.</p>
                </div>

                <Button variant="secondary" onClick={handleDownloadTemplate} leftIcon={<DownloadIcon className="w-5 h-5" />}>
                    Download CSV Template
                </Button>

                <FileUpload onFileSelect={handleFileSelect} acceptedTypes=".csv" />

                {file && (
                    <div className="space-y-2">
                        <h4 className="font-semibold">File Analysis Results</h4>
                        {parsedData.length > 0 && errors.length === 0 && (
                            <p className="text-green-600 dark:text-green-400">
                                Successfully parsed {parsedData.length} valid data entries to upload.
                            </p>
                        )}
                        {errors.length > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-md max-h-40 overflow-y-auto custom-scrollbar">
                                <h5 className="font-semibold text-red-700 dark:text-red-300 flex items-center">
                                    <XCircleIcon className="w-5 h-5 mr-2" />
                                    {errors.length} Parsing Errors Found
                                </h5>
                                <ul className="list-disc list-inside pl-2 text-red-600 dark:text-red-400 text-sm mt-1">
                                    {errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                                    {errors.length > 10 && <li>...and {errors.length - 10} more.</li>}
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
                        disabled={isProcessing || parsedData.length === 0 || errors.length > 0}
                    >
                        Upload {parsedData.length > 0 ? `${parsedData.length} Records` : ''}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RoiDataUploadModal;