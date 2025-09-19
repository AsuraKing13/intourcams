

import React, { useEffect, useState } from 'react';
import { PromotionItem, AddPromotionData } from '../../types.ts';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import PromotionSlide from './PromotionSlide.tsx';

interface PromotionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewData: AddPromotionData;
    imageFile: File | null;
}

const PromotionPreviewModal: React.FC<PromotionPreviewModalProps> = ({ isOpen, onClose, previewData, imageFile }) => {
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

    useEffect(() => {
        if (!isOpen) return;

        let objectUrl: string | undefined;
        if (imageFile) {
            objectUrl = URL.createObjectURL(imageFile);
            setImagePreviewUrl(objectUrl);
        } else {
            setImagePreviewUrl(previewData.image_url);
        }
        
        // Cleanup
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                setImagePreviewUrl('');
            }
        };
    }, [isOpen, imageFile, previewData.image_url]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Promotion Preview" size="2xl">
            <div className="w-full h-80 rounded-lg overflow-hidden relative shadow-lg">
                {imagePreviewUrl ? (
                    <PromotionSlide 
                        item={previewData}
                        imageSrc={imagePreviewUrl}
                        onCtaClick={() => {}} // No-op for preview
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-200-light dark:bg-neutral-800-dark">
                        <p className="text-brand-text-secondary">Loading preview...</p>
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={onClose}>Close Preview</Button>
            </div>
        </Modal>
    );
};

export default PromotionPreviewModal;
