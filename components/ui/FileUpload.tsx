


import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, PaperClipIcon, XMarkIcon } from '../../constants.tsx';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  maxSizeMb?: number;
  acceptedTypes?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  maxSizeMb = 5, 
  acceptedTypes = ".pdf,.doc,.docx,.jpg,.png", 
  disabled = false 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const maxSizeInBytes = maxSizeMb * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds ${maxSizeMb}MB.`);
      return false;
    }
    setError('');
    return true;
  };

  const handleFileSelection = useCallback((file: File | null) => {
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      setSelectedFile(null);
      onFileSelect(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFileSelect, maxSizeInBytes]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    setError('');
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {selectedFile ? (
        <div className="p-3 rounded-lg bg-neutral-100-light dark:bg-neutral-800-dark border-2 border-dashed border-neutral-300-light dark:border-neutral-700-dark flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <PaperClipIcon className="w-5 h-5 text-brand-green dark:text-brand-dark-green-text flex-shrink-0" />
            <div className="truncate">
              <p className="text-sm font-medium text-brand-text-light dark:text-brand-text truncate" title={selectedFile.name}>{selectedFile.name}</p>
              <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">{formatBytes(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 rounded-full text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark"
            disabled={disabled}
            aria-label="Remove selected file"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-4 border-2 border-dashed rounded-lg transition-colors
            ${disabled ? 'bg-neutral-100-light dark:bg-neutral-800-dark cursor-not-allowed' : 'bg-input-bg-light dark:bg-input-bg'}
            ${isDragging ? 'border-brand-green dark:border-brand-dark-green' : 'border-neutral-300-light dark:border-neutral-600-dark'}
          `}
        >
          <input
            type="file"
            id={`file-upload-input-${Math.random()}`}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileInputChange}
            accept={acceptedTypes}
            disabled={disabled}
          />
          <div className="text-center">
            <UploadCloudIcon className="mx-auto h-8 w-8 text-brand-text-secondary-light dark:text-brand-text-secondary" />
            <p className="mt-2 text-sm text-brand-text-light dark:text-brand-text">
              <span className="font-semibold text-brand-green dark:text-brand-dark-green-text">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">PDF, DOCX, PNG, JPG (max {maxSizeMb}MB)</p>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default FileUpload;