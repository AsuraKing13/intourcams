import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Cluster, ViewName, Theme, AddClusterData, ClusterProduct, AddClusterProductData, User } from '../../types.ts';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import { ThemeContext } from '../ThemeContext.tsx';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Select from '../ui/Select.tsx';
import Input from '../ui/Input.tsx';
import FileUpload from '../ui/FileUpload.tsx';
import Spinner from '../ui/Spinner.tsx';
import Modal from '../ui/Modal.tsx';
import { ArrowUturnLeftIcon, PencilIcon, SparklesIcon, ArrowPathIcon, PlusIcon, TrashIcon } from '../../constants.tsx';
import { generateClusterDescription } from '../../services/gemini.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MapPicker from '../ui/MapPicker.tsx';
import TransferClusterModal from '../ui/TransferClusterModal.tsx';

// Helper component for the view mode
const InfoRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <p className="text-sm font-semibold text-brand-text-secondary-light dark:text-brand-text-secondary">{label}</p>
        <div className="mt-1 text-brand-text-light dark:text-brand-text">{children}</div>
    </div>
);

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

interface ManageMyClustersViewProps {
    setCurrentView: (view: ViewName) => void;
}

// --- Product Form Modal (Embedded Component) ---
interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    clusterId: string;
    productToEdit: ClusterProduct | null;
    onSaveSuccess: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, clusterId, productToEdit, onSaveSuccess }) => {
    const { addProduct, updateProduct, uploadProductImage } = useAppContext();
    const { showToast } = useToast();
    const [formData, setFormData] = useState<Partial<AddClusterProductData>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setFormData(productToEdit);
        } else {
            setFormData({
                name: '', description: '', price_range: '', image_url: '', cluster_id: clusterId,
            });
        }
        setImageFile(null);
    }, [productToEdit, isOpen, clusterId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            showToast("Product name is required.", "error");
            return;
        }
        if (!productToEdit && !imageFile) {
            showToast("An image is required for new products.", "error");
            return;
        }

        setIsSaving(true);
        try {
            let finalImageUrl = formData.image_url;
            if (imageFile) {
                finalImageUrl = await uploadProductImage(imageFile, productToEdit?.image_url);
            }

            const payload = {
                cluster_id: clusterId,
                name: formData.name!,
                description: formData.description || null,
                price_range: formData.price_range || null,
                image_url: finalImageUrl,
            };

            if (productToEdit) {
                await updateProduct(productToEdit.id, payload);
            } else {
                await addProduct(payload);
            }
            onSaveSuccess();
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={productToEdit ? 'Edit Product' : 'Add New Product'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Product/Service Name *" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSaving} />
                <Input label="Price Range" name="price_range" value={formData.price_range || ''} onChange={handleChange} placeholder="e.g., RM 15 - RM 50, or Free" disabled={isSaving} />
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Description</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Image *</label>
                    {formData.image_url && !imageFile && <img src={formData.image_url} alt="Current" className="w-full h-32 object-cover rounded-md mb-2" />}
                    <FileUpload onFileSelect={setImageFile} disabled={isSaving} acceptedTypes="image/jpeg,image/png,image/webp" />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isSaving}>{productToEdit ? 'Save Changes' : 'Add Product'}</Button>
                </div>
            </form>
        </Modal>
    );
};


const ManageMyClustersView: React.FC<ManageMyClustersViewProps> = ({ setCurrentView }) => {
    const { currentUser, users, clusters, updateCluster, uploadClusterImage, getDailyClusterAnalytics, fetchProductsForCluster, deleteProduct } = useAppContext();
    const { showToast } = useToast();
    const { theme } = useContext(ThemeContext);

    const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [editFormData, setEditFormData] = useState<Partial<AddClusterData>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [useCustomAddress, setUseCustomAddress] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<{ date: string, views: number, clicks: number }[]>([]);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    
    const [products, setProducts] = useState<ClusterProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<ClusterProduct | null>(null);
    const [productToDelete, setProductToDelete] = useState<ClusterProduct | null>(null);
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const isAdminOrEditor = useMemo(() => currentUser?.role === 'Admin' || currentUser?.role === 'Editor', [currentUser]);

    const userClusters = useMemo(() => {
        if (!currentUser) return [];
        if (isAdminOrEditor) return clusters;
        return clusters.filter(c => c.owner_id === currentUser.id);
    }, [clusters, currentUser, isAdminOrEditor]);

    const clusterOptions = useMemo(() => {
        return userClusters.map(c => ({ value: c.id, label: c.name }));
    }, [userClusters]);

    const selectedCluster = useMemo(() => {
        return clusters.find(c => c.id === selectedClusterId);
    }, [clusters, selectedClusterId]);

    const clusterOwner = useMemo(() => {
        if (!selectedCluster?.owner_id) return null;
        return users.find(user => user.id === selectedCluster.owner_id);
    }, [selectedCluster, users]);

    useEffect(() => {
        if (!selectedClusterId && userClusters.length > 0) {
            setSelectedClusterId(userClusters[0].id);
        }
    }, [userClusters, selectedClusterId]);

    const loadProducts = useCallback(async () => {
        if (!selectedClusterId) return;
        setIsLoadingProducts(true);
        try {
            const fetchedProducts = await fetchProductsForCluster(selectedClusterId);
            setProducts(fetchedProducts);
        } finally {
            setIsLoadingProducts(false);
        }
    }, [selectedClusterId, fetchProductsForCluster]);

    useEffect(() => {
        if (selectedClusterId) {
            loadProducts();
            setIsAnalyticsLoading(true);
            getDailyClusterAnalytics(selectedClusterId, 30).then(data => {
                setAnalyticsData(data);
                setIsAnalyticsLoading(false);
            });
        }
    }, [selectedClusterId, getDailyClusterAnalytics, loadProducts]);

    const handleEditClick = () => {
        if (!selectedCluster) return;
        setEditFormData({ ...selectedCluster, category: [...selectedCluster.category] });
        if (selectedCluster.location !== selectedCluster.display_address) {
            setUseCustomAddress(true);
        } else {
            setUseCustomAddress(false);
        }
        setMode('edit');
    };

    const handleCancelEdit = () => {
        setMode('view');
        setImageFile(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setEditFormData(prev => {
            const currentCategories = Array.isArray(prev.category) ? prev.category : [];
            const newCategories = checked ? [...currentCategories, value] : currentCategories.filter(c => c !== value);
            return { ...prev, category: newCategories };
        });
    };

    const handleLocationChange = useCallback((location: { lat: number, lng: number, address: string }) => {
        setEditFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            display_address: location.address,
            ...(!useCustomAddress && { location: location.address })
        }));
    }, [useCustomAddress]);

    const handleGenerateDescription = async () => {
        if (!editFormData.name) {
            showToast("Please provide a Cluster Name first.", "info");
            return;
        }
        setIsGenerating(true);
        try {
            const description = await generateClusterDescription(editFormData.name, Array.isArray(editFormData.category) ? editFormData.category : [], '');
            setEditFormData(prev => ({ ...prev, description }));
            showToast("Description generated!", "success");
        } catch (error) {
            showToast(`Failed to generate description: ${getFormattedError(error)}`, "error");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = async () => {
        if (!selectedCluster) return;
        const finalLocation = useCustomAddress ? editFormData.location : editFormData.display_address;
        if (!editFormData.name || !finalLocation || !editFormData.description) {
            showToast("Name, Location, and Description are required.", "error");
            return;
        }
        setIsSaving(true);
        try {
            let imageUrl = selectedCluster.image;
            if (imageFile) {
                imageUrl = await uploadClusterImage(imageFile, selectedCluster.image);
            }
            await updateCluster(selectedCluster.id, {
                ...editFormData,
                image: imageUrl,
                location: finalLocation,
            });
            setMode('view');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddProductClick = () => {
        setProductToEdit(null);
        setIsProductModalOpen(true);
    };

    const handleEditProductClick = (product: ClusterProduct) => {
        setProductToEdit(product);
        setIsProductModalOpen(true);
    };
    
    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeletingProduct(true);
        await deleteProduct(productToDelete.id, productToDelete.image_url);
        setProductToDelete(null);
        await loadProducts();
        setIsDeletingProduct(false);
    };
    
    const chartColors = useMemo(() => ({
        axisStroke: theme === 'dark' ? '#A0A0A0' : '#566573',
        gridStroke: theme === 'dark' ? '#333333' : '#DEE2E6',
        tooltipBg: theme === 'dark' ? '#252525' : '#FFFFFF',
        tooltipBorder: theme === 'dark' ? '#333333' : '#DEE2E6',
        lineViews: theme === 'dark' ? '#4DBA87' : '#2ECC71',
        lineClicks: theme === 'dark' ? '#F9FAFB' : '#000000',
    }), [theme]);
    const chartTextStyle = { fill: chartColors.axisStroke, fontSize: 12 };

    if (userClusters.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-brand-text-light dark:text-brand-text">No Clusters to Manage</h2>
                <p className="mt-2 text-brand-text-secondary-light dark:text-brand-text-secondary">
                    {isAdminOrEditor ? "There are no clusters in the system." : "You have not added any tourism clusters yet."}
                </p>
                {!isAdminOrEditor && (
                    <Button className="mt-4" onClick={() => setCurrentView(ViewName.TourismCluster)}>Add Your First Cluster</Button>
                )}
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Manage My Clusters</h2>
                    <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">View analytics and edit details for your tourism clusters.</p>
                </div>
                {mode === 'view' && (
                    <Button variant="secondary" onClick={() => setCurrentView(ViewName.TourismCluster)}>
                        Back to All Clusters
                    </Button>
                )}
            </div>

            {isAdminOrEditor && (
                <Card>
                    <Select label="Select a Cluster to Manage" options={clusterOptions} value={selectedClusterId || ''} onChange={(e) => setSelectedClusterId(e.target.value)} />
                </Card>
            )}

            {!selectedCluster ? (
                <div className="text-center py-10"><Spinner /></div>
            ) : (
                <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card title="Cluster Details" className="lg:col-span-1" actions={
                        mode === 'view' ? (
                            <Button variant="primary" size="sm" onClick={handleEditClick} leftIcon={<PencilIcon className="w-4 h-4" />}>Edit</Button>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit} leftIcon={<ArrowUturnLeftIcon className="w-4 h-4" />}>Cancel</Button>
                        )
                    }>
                        {mode === 'view' ? (
                            <div className="space-y-4">
                                <img src={selectedCluster.image} alt={selectedCluster.name} className="w-full h-40 object-cover rounded-lg" />
                                <InfoRow label="Cluster Name">{selectedCluster.name}</InfoRow>
                                {isAdminOrEditor && clusterOwner && (
                                     <InfoRow label="Current Owner">{clusterOwner.name} ({clusterOwner.email})</InfoRow>
                                )}
                                <InfoRow label="Location">{selectedCluster.display_address || selectedCluster.location}</InfoRow>
                                <InfoRow label="Description"><p className="whitespace-pre-wrap">{selectedCluster.description}</p></InfoRow>
                                <InfoRow label="Categories">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCluster.category.map(c => <span key={c} className="px-2 py-1 text-xs rounded-full bg-neutral-200-light dark:bg-neutral-700-dark">{c}</span>)}
                                    </div>
                                </InfoRow>
                                <InfoRow label="Operating Hours">{selectedCluster.timing}</InfoRow>
                                {isAdminOrEditor && (
                                    <div className="pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                                        <Button variant="outline" onClick={() => setIsTransferModalOpen(true)}>
                                            Transfer Ownership
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Input label="Cluster Name *" name="name" value={editFormData.name || ''} onChange={handleChange} />
                                <div>
                                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Location *</label>
                                    <MapPicker
                                        initialPosition={editFormData.latitude && editFormData.longitude ? { lat: editFormData.latitude, lng: editFormData.longitude } : null}
                                        onLocationChange={handleLocationChange}
                                        mapContainerClassName="h-64"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input type="checkbox" id="myClusterUseCustomAddress" checked={useCustomAddress} onChange={(e) => setUseCustomAddress(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                                    <label htmlFor="myClusterUseCustomAddress" className="ml-2 text-sm">Use a custom display address</label>
                                </div>
                                {useCustomAddress ? (
                                    <Input label="Custom Display Address *" name="location" value={editFormData.location || ''} onChange={handleChange} required />
                                ) : (
                                    <p className="p-2.5 rounded-lg bg-neutral-100-light dark:bg-neutral-700-dark text-sm">{editFormData.display_address || "Click map to set location."}</p>
                                )}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium">Description *</label>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} isLoading={isGenerating} leftIcon={<SparklesIcon className="w-4 h-4" />} aria-label="Generate description with AI">AI Generate</Button>
                                    </div>
                                    <textarea name="description" value={editFormData.description || ''} onChange={handleChange} rows={4} className="w-full rounded-lg p-2.5 bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Categories *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["Association", "Homestay", "Culture", "Adventure", "Nature", "Foods", "Festivals"].map(cat => (
                                            <label key={cat} className="flex items-center space-x-2">
                                                <input type="checkbox" value={cat} checked={Array.isArray(editFormData.category) && editFormData.category.includes(cat)} onChange={handleCategoryChange} className="h-4 w-4 rounded" />
                                                <span>{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Input label="Operating Hours" name="timing" value={editFormData.timing || ''} onChange={handleChange} />
                                <div>
                                    <label className="block text-sm font-medium mb-1">Image</label>
                                    <FileUpload onFileSelect={setImageFile} />
                                </div>
                                <div className="flex justify-end pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                                    <Button variant="primary" onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Performance Analytics (Last 30 Days)">
                            <div style={{ width: '100%', height: 300 }}>
                                {isAnalyticsLoading ? <Spinner /> : (
                                    <ResponsiveContainer>
                                        <LineChart data={analyticsData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                                            <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} style={chartTextStyle} />
                                            <YAxis style={chartTextStyle} />
                                            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}` }} />
                                            <Legend wrapperStyle={{ color: chartColors.axisStroke }} />
                                            <Line type="monotone" dataKey="views" name="Card Views" stroke={chartColors.lineViews} strokeWidth={2} />
                                            <Line type="monotone" dataKey="clicks" name="Detail Clicks" stroke={chartColors.lineClicks} strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>
                         <Card title="Products & Services" actions={
                             <Button variant="primary" size="sm" onClick={handleAddProductClick} leftIcon={<PlusIcon className="w-4 h-4"/>}>Add Product</Button>
                         }>
                             {isLoadingProducts ? (<Spinner/>) : products.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {products.map(product => (
                                        <div key={product.id} className="flex items-center gap-4 p-2 rounded-md bg-neutral-100-light dark:bg-neutral-800-dark">
                                            <img src={product.image_url || ''} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                            <div className="flex-grow">
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-sm font-bold text-brand-green dark:text-brand-dark-green-text">{product.price_range}</p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditProductClick(product)} aria-label={`Edit ${product.name}`}><PencilIcon className="w-4 h-4"/></Button>
                                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setProductToDelete(product)} aria-label={`Delete ${product.name}`}><TrashIcon className="w-4 h-4"/></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : (<p className="text-sm text-center py-4 text-brand-text-secondary-light dark:text-brand-text-secondary">No products added yet.</p>)}
                         </Card>
                    </div>
                </div>
                {isProductModalOpen && (
                    <ProductFormModal 
                        isOpen={isProductModalOpen}
                        onClose={() => setIsProductModalOpen(false)}
                        clusterId={selectedCluster.id}
                        productToEdit={productToEdit}
                        onSaveSuccess={loadProducts}
                    />
                )}
                 {productToDelete && (
                    <Modal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} title="Confirm Delete Product" size="sm">
                        <p>Are you sure you want to delete the product "{productToDelete.name}"? This cannot be undone.</p>
                        <div className="flex justify-end space-x-3 pt-6">
                            <Button variant="secondary" onClick={() => setProductToDelete(null)} disabled={isDeletingProduct}>Cancel</Button>
                            <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteProduct} isLoading={isDeletingProduct}>Delete</Button>
                        </div>
                    </Modal>
                )}
                 {isTransferModalOpen && (
                    <TransferClusterModal
                        isOpen={isTransferModalOpen}
                        onClose={() => setIsTransferModalOpen(false)}
                        cluster={selectedCluster}
                        onTransferSuccess={() => {
                            showToast("Ownership transferred successfully!", "success");
                            setIsTransferModalOpen(false);
                        }}
                    />
                )}
                </>
            )}
        </div>
    );
};

export default ManageMyClustersView;
