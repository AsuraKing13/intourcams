import React, { useState, useCallback } from 'react';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import FileUpload from './FileUpload.tsx';
import { useToast } from '../ToastContext.tsx';
import { useAppContext } from '../AppContext.tsx';
import { DownloadIcon, XCircleIcon } from '../../constants.tsx';
import { VisitorAnalyticsData } from '../../types.ts';


interface VisitorDataUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CSV_TEMPLATE_STRING = `year,month,country,visitor_type,count
2024,1,Singapore,International,5000
2024,1,"Pen. M'sia",Domestic,10000`;

const EXPECTED_HEADERS: (keyof VisitorAnalyticsData)[] = ['year', 'month', 'country', 'visitor_type', 'count'];

const VisitorDataUploadModal: React.FC<VisitorDataUploadModalProps> = ({ isOpen, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<VisitorAnalyticsData[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { uploadVisitorAnalyticsBatch } = useAppContext();
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

            // --- Robust state-machine based CSV parser ---
            const newErrors: string[] = [];
            const newParsedData: VisitorAnalyticsData[] = [];
            const allRows: string[][] = [];
            let currentRow: string[] = [];
            let currentField = '';
            let inQuotes = false;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                if (inQuotes) {
                    if (char === '"') {
                        if (i + 1 < text.length && text[i+1] === '"') { // Escaped quote
                            currentField += '"';
                            i++; // Skip next quote
                        } else {
                            inQuotes = false;
                        }
                    } else {
                        currentField += char;
                    }
                } else {
                    if (char === ',') {
                        currentRow.push(currentField);
                        currentField = '';
                    } else if (char === '\n' || char === '\r') {
                        // Handle line endings (CRLF, LF)
                        if (char === '\r' && i + 1 < text.length && text[i+1] === '\n') {
                            i++; // Skip LF in CRLF
                        }
                        currentRow.push(currentField);
                        allRows.push(currentRow);
                        currentRow = [];
                        currentField = '';
                    } else if (char === '"' && currentField.length === 0) { // Quote must be at start of field
                        inQuotes = true;
                    } else {
                        currentField += char;
                    }
                }
            }
            // Add the last field and row if the file doesn't end with a newline
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField);
                allRows.push(currentRow);
            }
            // Filter out any completely empty rows that might be parsed from trailing newlines
            const rows = allRows.filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''));
            
            if (rows.length < 2) {
                setErrors(["CSV must contain a header row and at least one data row."]);
                return;
            }

            const headerLine = rows[0].map(h => h.trim());
            const dataRows = rows.slice(1);

            // Validate headers
            const missingHeaders = EXPECTED_HEADERS.filter(h => !headerLine.includes(h));
            if (missingHeaders.length > 0) {
                newErrors.push(`CSV is missing required headers: ${missingHeaders.join(', ')}.`);
            }

            dataRows.forEach((values, index) => {
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

                // Validate data types and values
                const year = parseInt(rowData.year, 10);
                const month = parseInt(rowData.month, 10);
                const count = parseInt(rowData.count, 10);
                const visitorType = rowData.visitor_type;
                const country = rowData.country;

                if (isNaN(year) || isNaN(month) || isNaN(count)) {
                    newErrors.push(`Row ${index + 2}: 'year', 'month', and 'count' must be valid numbers.`);
                    return;
                }
                if (visitorType !== 'International' && visitorType !== 'Domestic') {
                    newErrors.push(`Row ${index + 2}: 'visitor_type' must be either "International" or "Domestic".`);
                    return;
                }
                if (!country) {
                    newErrors.push(`Row ${index + 2}: 'country' is required.`);
                    return;
                }

                newParsedData.push({ year, month, country, visitor_type: visitorType, count });
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
        link.setAttribute('download', 'visitor_analytics_template.csv');
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
            await uploadVisitorAnalyticsBatch(parsedData);
            handleClose();
        } catch(error) {
            // Error toast is handled by the context
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload Visitor Analytics Data" size="xl">
            <div className="space-y-4">
                <div className="p-4 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg text-sm space-y-2">
                    <p>Upload a CSV file to add or update visitor analytics. The data will be upserted based on a unique combination of year, month, country, and visitor type.</p>
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

export default VisitorDataUploadModal;