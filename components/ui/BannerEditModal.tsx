
import React, { useState, useEffect } from 'react';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import FileUpload from './FileUpload.tsx';
import { useToast } from '../ToastContext.tsx';
import { useAppContext } from '../AppContext.tsx';

interface BannerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentImage: string;
    defaultImage: string;
}

const BannerEditModal: React.FC<BannerEditModalProps> = ({ isOpen, onClose, currentImage, defaultImage }) => {
    const { uploadBannerImage, updateBannerImageUrl, deleteBannerImage, bannerOverlayOpacity, updateBannerOverlayOpacity } = useAppContext();
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(currentImage);
    const [opacity, setOpacity] = useState(bannerOverlayOpacity);
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state with context when modal opens or current image changes
    useEffect(() => {
        if (isOpen) {
            setPreviewUrl(currentImage);
            setOpacity(bannerOverlayOpacity);
            setImageFile(null);
        }
    }, [currentImage, bannerOverlayOpacity, isOpen]);

    // Create a temporary local URL for the selected image file for previewing
    useEffect(() => {
        if (imageFile) {
            const objectUrl = URL.createObjectURL(imageFile);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [imageFile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const imageChanged = !!imageFile;
            const opacityChanged = opacity !== bannerOverlayOpacity;

            if (imageChanged) {
                const oldImageUrl = currentImage !== defaultImage ? currentImage : undefined;
                const newUrl = await uploadBannerImage(imageFile, oldImageUrl);
                await updateBannerImageUrl(newUrl);
            }

            if (opacityChanged) {
                await updateBannerOverlayOpacity(opacity);
            }
            
            onClose();
        } catch (error) {
            // Toasts are handled in context
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveCustomImage = async () => {
        setIsSaving(true);
        try {
            if (currentImage !== defaultImage) {
                await deleteBannerImage(currentImage);
            }
            await updateBannerImageUrl(''); // Reset to default
            onClose();
        } catch (error) {
             // Error toast handled in context
        } finally {
            setIsSaving(false);
        }
    };
    
    const hasChanges = !!imageFile || opacity !== bannerOverlayOpacity;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Welcome Banner">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-brand-text-light dark:text-brand-text">Banner Preview</h3>
                    <div className="relative mt-2 w-full h-48 rounded-lg overflow-hidden bg-neutral-200-light dark:bg-neutral-800-dark">
                        <img src={previewUrl} alt="Banner preview" className="w-full h-full object-cover" />
                        <div 
                            className="absolute inset-0 transition-colors"
                            style={{ backgroundColor: `rgba(0, 0, 0, ${opacity})` }}
                        ></div>
                    </div>
                </div>

                <div>
                    <label htmlFor="darkness-slider" className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">
                        Banner Darkness ({(opacity * 100).toFixed(0)}%)
                    </label>
                    <input
                        id="darkness-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
                        disabled={isSaving}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">
                        Upload New Image
                    </label>
                    <FileUpload onFileSelect={setImageFile} acceptedTypes="image/jpeg,image/png,image/webp" disabled={isSaving} />
                    <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">
                        Recommended aspect ratio is around 2:1 or wider (e.g., 1920x1080) for best results.
                    </p>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-neutral-200-light dark:border-neutral-700-dark">
                    <Button
                        variant="outline"
                        onClick={handleRemoveCustomImage}
                        disabled={currentImage === defaultImage || isSaving}
                        className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        isLoading={isSaving && currentImage !== defaultImage}
                    >
                        Revert to Default Image
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave} disabled={!hasChanges || isSaving} isLoading={isSaving}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BannerEditModal;
