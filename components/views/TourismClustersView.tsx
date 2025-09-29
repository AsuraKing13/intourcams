import React, { useState, useMemo, useEffect, useCallback, useRef, useContext } from 'react';
import { Cluster, ClusterReview, ViewName, Theme, ClusterProduct } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Modal from '../ui/Modal.tsx';
import Input from '../ui/Input.tsx';
import Select from '../ui/Select.tsx';
import FileUpload from '../ui/FileUpload.tsx';
import Spinner from '../ui/Spinner.tsx';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import { ThemeContext } from '../ThemeContext.tsx';
import { 
    PlusIcon, SearchIcon, StarIcon as SolidStarIcon, MapPinIcon, ClockIcon, PencilIcon, TrashIcon,
    SparklesIcon, EyeIcon, CursorArrowRaysIcon, CLUSTER_CATEGORIES
} from '../../constants.tsx';
import { generateClusterDescription } from '../../services/gemini.ts';
import BatchClusterUploadModal from '../ui/BatchClusterUploadModal.tsx';
import MapPicker from '../ui/MapPicker.tsx';
import ClusterDetailModal from '../ui/ClusterDetailModal.tsx';

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

// --- Star Rating Component ---
const StarRating: React.FC<{ rating: number; reviewCount: number; size?: 'sm' | 'md' | 'lg' }> = ({ rating, reviewCount, size = 'md' }) => {
    const starSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
                <SolidStarIcon key={index} className={`${starSize} ${index < Math.round(rating) ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
            ))}
            <span className="ml-2 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                {rating.toFixed(1)} ({reviewCount})
            </span>
        </div>
    );
};

// --- Cluster Card Component ---
const ClusterCard: React.FC<{
    cluster: Cluster;
    onSelect: (cluster: Cluster) => void;
    onViewed: (clusterId: string) => void;
    hasBeenViewed: boolean;
}> = ({ cluster, onSelect, onViewed, hasBeenViewed }) => {
    const { incrementClusterView } = useAppContext();
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (hasBeenViewed) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    incrementClusterView(cluster.id);
                    onViewed(cluster.id);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        const currentRef = cardRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
            observer.disconnect();
        };
    }, [cluster.id, incrementClusterView, onViewed, hasBeenViewed]);

    const googleMapsUrl = (cluster.latitude && cluster.longitude)
        ? `https://www.google.com/maps/search/?api=1&query=${cluster.latitude},${cluster.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cluster.display_address || cluster.location)}`;

    return (
        <button
            ref={cardRef as any}
            onClick={() => onSelect(cluster)}
            className="w-full text-left bg-card-bg-light dark:bg-card-bg rounded-lg shadow-md hover:shadow-xl border border-neutral-300-light dark:border-neutral-700-dark transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            aria-label={`View details for ${cluster.name}`}
        >
            <div className="h-40 bg-neutral-200-light dark:bg-neutral-800-dark">
                <img src={cluster.image} alt={cluster.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-brand-text-light dark:text-brand-text truncate" title={cluster.name}>
                    {cluster.name}
                </h3>
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary truncate flex items-center hover:text-brand-green dark:hover:text-brand-dark-green-text hover:underline"
                    onClick={(e) => e.stopPropagation()}
                    title={`Open in Google Maps: ${cluster.display_address || cluster.location}`}
                >
                    <MapPinIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span title={cluster.display_address || cluster.location}>{cluster.display_address || cluster.location}</span>
                </a>

                <div className="mt-2">
                    <StarRating rating={cluster.average_rating} reviewCount={cluster.review_count} size="sm" />
                </div>
            </div>
        </button>
    );
};


// --- Add/Edit Cluster Modal ---
interface AddEditClusterModalProps {
    isOpen: boolean;
    onClose: () => void;
    clusterToEdit?: Cluster | null;
}
const AddEditClusterModal: React.FC<AddEditClusterModalProps> = ({ isOpen, onClose, clusterToEdit }) => {
    const { addCluster, updateCluster, uploadClusterImage, currentUser } = useAppContext();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<Partial<Cluster>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [useCustomAddress, setUseCustomAddress] = useState(false);
    const [aiVibe, setAiVibe] = useState('');

    useEffect(() => {
        if (clusterToEdit) {
            setFormData(clusterToEdit);
            if (clusterToEdit.location && clusterToEdit.location !== clusterToEdit.display_address) {
                setUseCustomAddress(true);
            }
        } else {
            setFormData({
                name: '', location: '', description: '', category: [], timing: '', image: '',
                latitude: null, longitude: null, display_address: ''
            });
            setUseCustomAddress(false);
        }
        setImageFile(null);
        setAiVibe('');
    }, [clusterToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'category') return;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const currentCategories = Array.isArray(prev.category) ? prev.category : [];
            let newCategories;
            if (checked) {
                newCategories = [...currentCategories, value];
            } else {
                newCategories = currentCategories.filter(cat => cat !== value);
            }
            return { ...prev, category: newCategories };
        });
    };
    
    const handleLocationChange = useCallback((location: { lat: number, lng: number, address: string }) => {
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            display_address: location.address,
            ...(!useCustomAddress && { location: location.address })
        }));
    }, [useCustomAddress]);

    const handleGenerateDescription = async () => {
        if (!formData.name || !Array.isArray(formData.category) || formData.category.length === 0) {
            showToast("Please provide a Cluster Name and select at least one Category first.", "info");
            return;
        }
        setIsGenerating(true);
        try {
            const description = await generateClusterDescription(formData.name, formData.category, aiVibe);
            setFormData(prev => ({ ...prev, description }));
            showToast("Description generated!", "success");
        } catch (error) {
            showToast(`Failed to generate description: ${(error as Error).message}`, "error");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalLocation = useCustomAddress ? formData.location : formData.display_address;
        if (!formData.name || !finalLocation || !formData.description || !Array.isArray(formData.category) || formData.category.length === 0) {
            showToast("Please fill in all required fields: Name, Location, Description, and at least one Category.", "error");
            return;
        }
        if (!clusterToEdit && !imageFile) {
            showToast("An image is required for new clusters.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = formData.image || '';
            if (imageFile) {
                imageUrl = await uploadClusterImage(imageFile, clusterToEdit?.image);
            }
            
            const payload = {
                name: formData.name,
                location: finalLocation,
                description: formData.description,
                category: formData.category,
                timing: formData.timing || '',
                image: imageUrl,
                latitude: formData.latitude || null,
                longitude: formData.longitude || null,
                display_address: formData.display_address || null,
            };

            if (clusterToEdit) {
                await updateCluster(clusterToEdit.id, payload);
            } else {
                await addCluster(payload);
            }
            onClose();
        } catch (error) {
            // Error toast is handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const vibeCharLimit = 150;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={clusterToEdit ? 'Edit Cluster' : 'Add New Cluster'} size="xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Cluster Name *" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSubmitting} />
                
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Location *</label>
                    <MapPicker
                        initialPosition={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                        onLocationChange={handleLocationChange}
                        mapContainerClassName="h-64"
                    />
                </div>
                
                 <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="useCustomAddress"
                        checked={useCustomAddress}
                        onChange={(e) => setUseCustomAddress(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    />
                    <label htmlFor="useCustomAddress" className="ml-2 text-sm text-brand-text-light dark:text-brand-text">
                        Use a custom display address
                    </label>
                </div>
                
                {useCustomAddress ? (
                    <Input 
                        label="Custom Display Address *" 
                        name="location" 
                        value={formData.location || ''} 
                        onChange={handleChange} 
                        required 
                        disabled={isSubmitting || isGenerating}
                    />
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Map Address</label>
                        <p className="p-2.5 rounded-lg bg-neutral-100-light dark:bg-neutral-700-dark text-brand-text-secondary-light dark:text-brand-text-secondary text-sm">
                            {formData.display_address || "Click on the map to set a location."}
                        </p>
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Description *</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} required disabled={isSubmitting} rows={4} className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green" />
                </div>
                <div className="p-3 rounded-md bg-neutral-100-light dark:bg-neutral-800-dark space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="flex-grow w-full">
                           <Input label="Keywords/Vibe (Optional)" name="aiVibe" value={aiVibe} onChange={e => setAiVibe(e.target.value)} disabled={isSubmitting || isGenerating} maxLength={vibeCharLimit} placeholder="e.g., family-friendly, adventurous" wrapperClassName="!mb-0"/>
                            <p className="text-xs text-right text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">
                                {aiVibe.length} / {vibeCharLimit}
                            </p>
                        </div>
                        <Button type="button" variant="primary" size="md" onClick={handleGenerateDescription} isLoading={isGenerating} disabled={isSubmitting} leftIcon={<SparklesIcon className="w-4 h-4" />} className="w-full sm:w-auto sm:mt-6">
                            Generate with AI
                        </Button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-2">Categories * (Select one or more)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {CLUSTER_CATEGORIES.map(cat => (
                            <label key={cat.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-neutral-100-light dark:hover:bg-neutral-800-dark cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    name="category"
                                    value={cat.id}
                                    checked={Array.isArray(formData.category) && formData.category.includes(cat.id)}
                                    onChange={handleCategoryChange}
                                    disabled={isSubmitting}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                                />
                                <span className="text-sm text-brand-text-light dark:text-brand-text">{cat.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <Input label="Operating Hours/Timing" name="timing" value={formData.timing || ''} onChange={handleChange} disabled={isSubmitting} placeholder="e.g., 9am - 5pm daily" />
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Cluster Image *</label>
                    {formData.image && !imageFile && <img src={formData.image} alt="Current" className="w-full h-32 object-cover rounded-md mb-2" />}
                    <FileUpload onFileSelect={setImageFile} disabled={isSubmitting} acceptedTypes="image/jpeg,image/png,image/webp" />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>{clusterToEdit ? 'Save Changes' : 'Add Cluster'}</Button>
                </div>
            </form>
        </Modal>
    );
};

// --- Main View Component ---
const TourismClustersView: React.FC<{ setCurrentView: (view: ViewName) => void }> = ({ setCurrentView }) => {
    const { clusters, isLoadingClusters, currentUser, deleteCluster, incrementClusterClick } = useAppContext();
    const { showToast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
    const [modalMode, setModalMode] = useState<'details' | 'form' | 'closed'>('closed');
    const [clusterToEdit, setClusterToEdit] = useState<Cluster | null>(null);
    const [clusterToDelete, setClusterToDelete] = useState<Cluster | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
    const [viewedClusters, setViewedClusters] = useState<Set<string>>(new Set());

    const handleClusterViewed = useCallback((clusterId: string) => {
        setViewedClusters(prev => {
            if (prev.has(clusterId)) {
                return prev;
            }
            const newSet = new Set(prev);
            newSet.add(clusterId);
            return newSet;
        });
    }, []);

    useEffect(() => {
        const initialSearch = sessionStorage.getItem('initialClusterSearch');
        if (initialSearch) {
            setSearchTerm(initialSearch);
            sessionStorage.removeItem('initialClusterSearch');
        }
    }, []);

    const canAddCluster = useMemo(() => {
        if (!currentUser) return false;
        const role = currentUser.role;
        return role === 'Admin' || role === 'Editor' || role === 'Tourism Player';
    }, [currentUser]);

    const filteredClusters = useMemo(() => {
        return clusters.filter(cluster => {
            const matchesCategory = selectedCategory === 'All' || cluster.category.includes(selectedCategory);
            const matchesSearch = searchTerm === '' || cluster.name.toLowerCase().includes(searchTerm.toLowerCase()) || (cluster.display_address || cluster.location).toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [clusters, searchTerm, selectedCategory]);

    const handleSelectCluster = (cluster: Cluster) => {
        incrementClusterClick(cluster.id);
        setSelectedCluster(cluster);
        setModalMode('details');
    };

    const handleOpenAddModal = () => {
        setClusterToEdit(null);
        setModalMode('form');
    };

    const handleEdit = (cluster: Cluster) => {
        setClusterToEdit(cluster);
        setModalMode('form');
    };

    const handleDelete = (cluster: Cluster) => {
        setClusterToDelete(cluster);
        setModalMode('closed'); // Close details modal first
    };

    const confirmDelete = async () => {
        if (!clusterToDelete) return;
        setIsDeleting(true);
        const success = await deleteCluster(clusterToDelete.id);
        if (success) {
            showToast(`Cluster "${clusterToDelete.name}" deleted successfully.`, "success");
            setClusterToDelete(null);
        }
        setIsDeleting(false);
    };

    const handleCloseModal = () => {
        setModalMode('closed');
        setSelectedCluster(null);
        setClusterToEdit(null);
    };
    
    const handleCloseBatchModal = () => {
        setIsBatchUploadModalOpen(false);
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Tourism Clusters</h2>
                    <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Explore diverse tourism clusters across Sarawak.</p>
                </div>
                {canAddCluster && (
                    <div className="flex gap-2">
                         <Button variant="secondary" onClick={() => setIsBatchUploadModalOpen(true)}>Batch Upload</Button>
                         <Button variant="primary" onClick={handleOpenAddModal} leftIcon={<PlusIcon className="w-5 h-5"/>}>Add New Cluster</Button>
                    </div>
                )}
            </div>

            <Card>
                <div className="flex flex-col md:flex-row gap-4">
                    <Input placeholder="Search by name or location..." icon={<SearchIcon className="w-5 h-5"/>} className="flex-grow" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <div className="flex-none w-full md:w-auto">
                        <Select
                            options={[{ value: 'All', label: 'All Categories' }, ...CLUSTER_CATEGORIES.map(c => ({ value: c.id, label: c.name }))]}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>
            </Card>

            {isLoadingClusters ? (
                <div className="text-center py-10"><Spinner className="w-8 h-8 mx-auto" /><p className="mt-2">Loading Clusters...</p></div>
            ) : filteredClusters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClusters.map(cluster => (
                        <ClusterCard
                            key={cluster.id}
                            cluster={cluster}
                            onSelect={handleSelectCluster}
                            onViewed={handleClusterViewed}
                            hasBeenViewed={viewedClusters.has(cluster.id)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center py-12 text-brand-text-secondary-light dark:text-brand-text-secondary">No clusters found matching your criteria.</p>
            )}

            {modalMode === 'details' && (
                <ClusterDetailModal 
                    cluster={selectedCluster} 
                    onClose={handleCloseModal} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                    showAdminControls={true} 
                />
            )}

            {modalMode === 'form' && (
                <AddEditClusterModal isOpen={modalMode === 'form'} onClose={handleCloseModal} clusterToEdit={clusterToEdit} />
            )}

            {clusterToDelete && (
                <Modal isOpen={!!clusterToDelete} onClose={() => setClusterToDelete(null)} title="Confirm Deletion" size="sm">
                    <p>Are you sure you want to delete the cluster "{clusterToDelete.name}"? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3 pt-6">
                        <Button variant="secondary" onClick={() => setClusterToDelete(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="primary" className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" onClick={confirmDelete} isLoading={isDeleting}>Delete</Button>
                    </div>
                </Modal>
            )}
            
            {canAddCluster && <BatchClusterUploadModal isOpen={isBatchUploadModalOpen} onClose={handleCloseBatchModal} />}
        </div>
    );
};

export default React.memo(TourismClustersView);