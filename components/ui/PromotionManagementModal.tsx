import React, { useState, useEffect, useCallback } from 'react';
import { PromotionItem, ViewName, AddPromotionData } from '../../types.ts';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import { PROMOTION_CTA_VIEWS, PencilIcon, PlusIcon, TrashIcon, ArrowUturnLeftIcon } from '../../constants.tsx';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import Input from './Input.tsx';
import Select from './Select.tsx';
import FileUpload from './FileUpload.tsx';
import Spinner from './Spinner.tsx';
import PromotionPreviewModal from './PromotionPreviewModal.tsx';

const getFormattedError = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
        const supabaseError = err as { message: string; details?: string; hint?: string; code?: string };
        return `Error: ${supabaseError.message}${supabaseError.details ? ` Details: ${supabaseError.details}` : ''}`;
    }
    try {
        return `An unexpected error occurred: ${JSON.stringify(err)}`;
    } catch {
        return 'An unknown and un-serializable error occurred.';
    }
};

// --- Form Component (embedded inside the management modal) ---
interface PromotionFormProps {
    initialData?: PromotionItem | null;
    onSave: (data: AddPromotionData, imageFile: File | null) => Promise<void>;
    onCancel: () => void;
    onPreview: (data: AddPromotionData, imageFile: File | null) => void;
    isSaving: boolean;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ initialData, onSave, onCancel, onPreview, isSaving }) => {
    const [formData, setFormData] = useState<AddPromotionData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        image_url: initialData?.image_url || '',
        cta_text: initialData?.cta_text || 'Learn More',
        cta_link: initialData?.cta_link || '',
        requires_auth: initialData?.requires_auth || false,
        is_active: initialData?.is_active ?? true,
        sort_order: initialData?.sort_order || 0,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [linkType, setLinkType] = useState<'internal' | 'custom'>('internal');
    const { showToast } = useToast();

    useEffect(() => {
        if (initialData?.cta_link && !PROMOTION_CTA_VIEWS.includes(initialData.cta_link as ViewName)) {
            setLinkType('custom');
        } else {
            setLinkType('internal');
        }
    }, [initialData]);

    const handleLinkTypeChange = (newType: 'internal' | 'custom') => {
        setLinkType(newType);
        // Reset cta_link when switching types to prevent invalid data
        setFormData(prev => ({...prev, cta_link: '' }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
            setFormData(prev => ({...prev, [name]: parseInt(value, 10) || 0 }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, imageFile);
    };

    const handlePreviewClick = () => {
        if (!formData.title || !formData.description) {
            showToast("Please provide a title and description to preview.", "info");
            return;
        }
        if (!imageFile && !formData.image_url) {
            showToast("Please provide an image to preview.", "info");
            return;
        }
        onPreview(formData, imageFile);
    };

    const ctaLinkOptions = [
        { value: '', label: 'No Link' },
        ...PROMOTION_CTA_VIEWS.map(view => ({ value: view, label: view }))
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title *" name="title" value={formData.title} onChange={handleChange} required disabled={isSaving} />
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required disabled={isSaving} rows={3} className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-blue dark:focus:ring-brand-yellow focus:border-brand-blue dark:focus:border-brand-yellow" />
            </div>
             <div>
                <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Image *</label>
                {formData.image_url && !imageFile && <img src={formData.image_url} alt="Current" className="w-full h-32 object-cover rounded-md mb-2" />}
                <FileUpload onFileSelect={setImageFile} disabled={isSaving} acceptedTypes="image/jpeg,image/png,image/webp" />
            </div>
            
            <Input label="CTA Button Text *" name="cta_text" value={formData.cta_text} onChange={handleChange} required disabled={isSaving} />

            <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary">CTA Link Type</label>
                <div className="flex gap-x-4 p-2 rounded-md bg-neutral-100-light dark:bg-neutral-800-dark">
                    <label className="flex items-center cursor-pointer">
                        <input type="radio" name="linkType" value="internal" checked={linkType === 'internal'} onChange={() => handleLinkTypeChange('internal')} className="form-radio h-4 w-4 text-brand-blue focus:ring-brand-blue" />
                        <span className="ml-2 text-sm text-brand-text-light dark:text-brand-text">Internal App Page</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input type="radio" name="linkType" value="custom" checked={linkType === 'custom'} onChange={() => handleLinkTypeChange('custom')} className="form-radio h-4 w-4 text-brand-blue focus:ring-brand-blue" />
                        <span className="ml-2 text-sm text-brand-text-light dark:text-brand-text">External Custom URL</span>
                    </label>
                </div>
            </div>

            <div className="animate-modalShow">
                {linkType === 'internal' ? (
                    <Select label="CTA Link Destination" name="cta_link" options={ctaLinkOptions} value={formData.cta_link || ''} onChange={handleChange} disabled={isSaving} wrapperClassName="mt-0" />
                ) : (
                    <Input label="Custom URL Destination" name="cta_link" value={formData.cta_link || ''} onChange={handleChange} disabled={isSaving} placeholder="https://example.com" wrapperClassName="mt-0"/>
                )}
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Sort Order" name="sort_order" type="number" value={String(formData.sort_order)} onChange={handleChange} disabled={isSaving} />
            </div>
            <div className="flex items-center space-x-6">
                 <div className="flex items-center">
                    <input type="checkbox" id="requires_auth" name="requires_auth" checked={formData.requires_auth} onChange={handleChange} disabled={isSaving} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" />
                    <label htmlFor="requires_auth" className="ml-2 block text-sm text-brand-text-light dark:text-brand-text">Requires Login</label>
                </div>
                 <div className="flex items-center">
                    <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} disabled={isSaving} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-brand-text-light dark:text-brand-text">Is Active</label>
                </div>
            </div>
            <div className="flex justify-end items-center flex-wrap gap-3 pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                <Button type="button" variant="outline" onClick={handlePreviewClick} disabled={isSaving}>Preview</Button>
                <div className="flex-grow"></div>
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSaving}>{initialData ? 'Save Changes' : 'Add Promotion'}</Button>
            </div>
        </form>
    );
};


// --- Main Management Modal Component ---
interface PromotionManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PromotionManagementModal: React.FC<PromotionManagementModalProps> = ({ isOpen, onClose }) => {
    const { fetchAllPromotions, addPromotion, updatePromotion, deletePromotion, uploadPromotionImage } = useAppContext();
    const { showToast } = useToast();
    
    const [promotions, setPromotions] = useState<PromotionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingItem, setEditingItem] = useState<PromotionItem | null>(null);
    
    const [itemToDelete, setItemToDelete] = useState<PromotionItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{
        data: AddPromotionData,
        imageFile: File | null
    } | null>(null);


    const loadPromotions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllPromotions();
            setPromotions(data);
        } catch (error) {
            showToast('Failed to load promotions.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [fetchAllPromotions, showToast]);

    useEffect(() => {
        if (isOpen) {
            loadPromotions();
            setView('list'); // Reset to list view every time it opens
        }
    }, [isOpen, loadPromotions]);

    const handleAddNew = () => {
        setEditingItem(null);
        setView('form');
    };

    const handleEdit = (item: PromotionItem) => {
        setEditingItem(item);
        setView('form');
    };

    const handleCancelForm = () => {
        setEditingItem(null);
        setView('list');
    };
    
    const handleSave = async (data: AddPromotionData, imageFile: File | null) => {
        if (!editingItem && !imageFile) {
            showToast("An image is required for new promotions.", "error");
            return;
        }

        setIsSaving(true);
        try {
            let finalImageUrl = editingItem?.image_url || '';
            if (imageFile) {
                finalImageUrl = await uploadPromotionImage(imageFile, editingItem?.image_url);
            }
    
            const payload = { ...data, image_url: finalImageUrl };
    
            if (editingItem) {
                await updatePromotion(editingItem.id, payload);
            } else {
                await addPromotion(payload);
            }
            
            await loadPromotions();
            setView('list');
            setEditingItem(null);
        } catch (error) {
            console.error("Failed to save promotion:", getFormattedError(error));
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await deletePromotion(itemToDelete.id, itemToDelete.image_url);
            setItemToDelete(null);
            await loadPromotions();
        } catch (error) {
            // Toast is handled in context
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePreview = (data: AddPromotionData, imageFile: File | null) => {
        setPreviewData({ data, imageFile });
        setIsPreviewModalOpen(true);
    };

    const modalTitle = view === 'form' 
        ? (editingItem ? 'Edit Promotion' : 'Add New Promotion') 
        : 'Manage Promotions';
        
    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size={view === 'form' ? 'xl' : '2xl'}>
                {view === 'list' ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Button variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} onClick={handleAddNew}>Add New</Button>
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40"><Spinner/></div>
                        ) : (
                             <div className="overflow-x-auto custom-scrollbar max-h-[60vh]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-neutral-100-light dark:bg-neutral-700-dark text-brand-text-secondary-light dark:text-brand-text-secondary">
                                        <tr>
                                            <th className="px-4 py-2">Title</th>
                                            <th className="px-4 py-2">Status</th>
                                            <th className="px-4 py-2">Order</th>
                                            <th className="px-4 py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-brand-text-light dark:text-brand-text">
                                        {promotions.map(item => (
                                            <tr key={item.id} className="border-b border-neutral-200-light dark:border-neutral-700-dark">
                                                <td className="px-4 py-2 font-medium">{item.title}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-200'}`}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">{item.sort_order}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><PencilIcon className="w-4 h-4"/></Button>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10" onClick={() => setItemToDelete(item)}><TrashIcon className="w-4 h-4"/></Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {promotions.length === 0 && <p className="text-center py-8 text-brand-text-secondary">No promotions found.</p>}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <Button variant="ghost" size="sm" onClick={handleCancelForm} className="mb-4" leftIcon={<ArrowUturnLeftIcon className="w-4 h-4"/>}>
                            Back to list
                        </Button>
                        <PromotionForm
                            initialData={editingItem}
                            onSave={handleSave}
                            onCancel={handleCancelForm}
                            isSaving={isSaving}
                            onPreview={handlePreview}
                        />
                    </div>
                )}
            </Modal>
            
            {previewData && (
                <PromotionPreviewModal
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                    previewData={previewData.data}
                    imageFile={previewData.imageFile}
                />
            )}
            
            {itemToDelete && (
                <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirm Deletion" size="sm">
                    <p>Are you sure you want to delete the promotion "{itemToDelete.title}"?</p>
                    <div className="flex justify-end space-x-3 pt-6">
                        <Button variant="secondary" onClick={() => setItemToDelete(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="primary" className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" onClick={handleDelete} isLoading={isDeleting}>Delete</Button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default PromotionManagementModal;