import React, { useState, useMemo, useEffect } from 'react';
import { Cluster, ClusterReview, ClusterProduct } from '../../types.ts';
import Modal from './Modal.tsx';
import Button from './Button.tsx';
import Spinner from '../ui/Spinner.tsx';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import { 
    StarIcon as SolidStarIcon, 
    MapPinIcon, 
    ClockIcon, 
    PencilIcon, 
    TrashIcon,
    EyeIcon, 
    CursorArrowRaysIcon 
} from '../../constants.tsx';

// --- Star Rating Component (re-created here for co-location) ---
const StarRating: React.FC<{ rating: number; reviewCount?: number; size?: 'sm' | 'md' | 'lg' }> = ({ rating, reviewCount, size = 'md' }) => {
    const starSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
                <SolidStarIcon key={index} className={`${starSize} ${index < Math.round(rating) ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
            ))}
            {reviewCount !== undefined && (
                 <span className="ml-2 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                    {rating.toFixed(1)} ({reviewCount})
                </span>
            )}
        </div>
    );
};


interface ClusterDetailModalProps {
    cluster: Cluster | null;
    onClose: () => void;
    showAdminControls?: boolean;
    onEdit?: (cluster: Cluster) => void;
    onDelete?: (cluster: Cluster) => void;
}

const ClusterDetailModal: React.FC<ClusterDetailModalProps> = ({ cluster, onClose, showAdminControls = false, onEdit, onDelete }) => {
    const { currentUser, fetchReviewsForCluster, addReviewForCluster, fetchProductsForCluster } = useAppContext();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState<ClusterReview[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [products, setProducts] = useState<ClusterProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    
    const canManage = useMemo(() => {
        if (!currentUser || !cluster) return false;
        return currentUser.role === 'Admin' || currentUser.role === 'Editor' || currentUser.id === cluster.owner_id;
    }, [currentUser, cluster]);

    const hasUserReviewed = useMemo(() => {
        return reviews.some(r => r.user_id === currentUser?.id);
    }, [reviews, currentUser]);

    useEffect(() => {
        if (cluster) {
            setIsLoadingReviews(true);
            fetchReviewsForCluster(cluster.id)
                .then(setReviews)
                .finally(() => setIsLoadingReviews(false));
            
            setIsLoadingProducts(true);
            fetchProductsForCluster(cluster.id)
                .then(setProducts)
                .finally(() => setIsLoadingProducts(false));
        }
    }, [cluster, fetchReviewsForCluster, fetchProductsForCluster]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cluster || userRating === 0) {
            showToast("Please select a star rating before submitting.", "info");
            return;
        }
        setIsSubmittingReview(true);
        try {
            const newReview = await addReviewForCluster(cluster.id, userRating, userComment);
            if (newReview) {
                setReviews(prev => [newReview, ...prev]);
                setUserRating(0);
                setUserComment('');
            }
        } finally {
            setIsSubmittingReview(false);
        }
    };
    
    if (!cluster) return null;

    const googleMapsUrl = (cluster.latitude && cluster.longitude)
        ? `https://www.google.com/maps/search/?api=1&query=${cluster.latitude},${cluster.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cluster.display_address || cluster.location)}`;

    return (
        <Modal isOpen={!!cluster} onClose={onClose} title={cluster.name} size="2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Details */}
                <div className="space-y-4">
                    <div className="h-48 rounded-lg overflow-hidden bg-neutral-200-light dark:bg-neutral-800-dark">
                        <img src={cluster.image} alt={cluster.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-brand-text-light dark:text-brand-text whitespace-pre-wrap">{cluster.description}</p>
                    <div className="text-sm space-y-2 pt-2 border-t border-neutral-200-light dark:border-neutral-700-dark">
                        <div className="flex items-start">
                             <MapPinIcon className="w-5 h-5 mr-3 text-brand-text-secondary-light dark:text-brand-text-secondary flex-shrink-0 mt-0.5" />
                             <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-green dark:hover:text-brand-dark-green-text hover:underline"
                                title={`Open in Google Maps: ${cluster.display_address || cluster.location}`}
                            >
                                {cluster.display_address || cluster.location}
                            </a>
                        </div>
                         <div className="flex items-start">
                             <ClockIcon className="w-5 h-5 mr-3 text-brand-text-secondary-light dark:text-brand-text-secondary flex-shrink-0 mt-0.5" />
                            <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">{cluster.timing}</p>
                        </div>
                    </div>
                     <div className="pt-2 border-t border-neutral-200-light dark:border-neutral-700-dark">
                        <h4 className="font-semibold mb-2">Categories</h4>
                        <div className="flex flex-wrap gap-2">
                            {cluster.category.map(cat => (
                                <span key={cat} className="px-3 py-1 text-xs font-semibold rounded-full bg-neutral-200-light dark:bg-neutral-700-dark text-brand-text-light dark:text-brand-text">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-200-light dark:border-neutral-700-dark">
                        <h4 className="font-semibold mb-2">Products & Services</h4>
                        {isLoadingProducts ? ( <div className="text-center"><Spinner/></div> ) :
                         products.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {products.map(product => (
                                    <div key={product.id} className="flex items-start gap-4 p-2 rounded-md bg-neutral-100-light dark:bg-neutral-800-dark">
                                        <img src={product.image_url || ''} alt={product.name} className="w-20 h-20 object-cover rounded-md flex-shrink-0 bg-neutral-200-light dark:bg-neutral-700-dark" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-brand-text-light dark:text-brand-text">{product.name}</p>
                                            <p className="text-sm font-bold text-brand-green dark:text-brand-dark-green-text">{product.price_range}</p>
                                            <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">{product.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ) : (<p className="text-sm text-center py-4 text-brand-text-secondary-light dark:text-brand-text-secondary">No products or services listed for this cluster.</p>)}
                    </div>

                    {showAdminControls && canManage && (
                        <div className="pt-3 border-t border-neutral-200-light dark:border-neutral-700-dark space-y-3">
                             <h4 className="font-semibold">Performance</h4>
                             <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 text-brand-text-secondary-light dark:text-brand-text-secondary">
                                    <EyeIcon className="w-5 h-5"/>
                                    <span>{cluster.view_count.toLocaleString()} Card Views</span>
                                </div>
                                 <div className="flex items-center gap-2 text-brand-text-secondary-light dark:text-brand-text-secondary">
                                    <CursorArrowRaysIcon className="w-5 h-5"/>
                                    <span>{cluster.click_count.toLocaleString()} Detail Clicks</span>
                                </div>
                             </div>
                             <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={() => onDelete?.(cluster)} className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white" leftIcon={<TrashIcon className="w-4 h-4"/>} aria-label={`Delete ${cluster.name}`}>Delete</Button>
                                <Button variant="primary" size="sm" onClick={() => onEdit?.(cluster)} leftIcon={<PencilIcon className="w-4 h-4"/>} aria-label={`Edit ${cluster.name}`}>Edit</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Reviews */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-neutral-200-light dark:border-neutral-700-dark pb-2">Reviews</h3>
                    
                    {/* Review Form */}
                    {currentUser && !canManage && !hasUserReviewed && (
                        <form onSubmit={handleReviewSubmit} className="p-3 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg space-y-3">
                             <h4 className="font-semibold text-brand-text-light dark:text-brand-text">Leave a Review</h4>
                             <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} type="button" onClick={() => setUserRating(star)} className="focus:outline-none" aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}>
                                        <SolidStarIcon className={`w-6 h-6 transition-colors ${star <= userRating ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600 hover:text-yellow-300'}`} />
                                    </button>
                                ))}
                            </div>
                             <textarea value={userComment} onChange={(e) => setUserComment(e.target.value)} placeholder="Share your experience..." rows={3} className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green" />
                             <div className="text-right">
                                <Button type="submit" size="sm" isLoading={isSubmittingReview}>Submit Review</Button>
                             </div>
                        </form>
                    )}
                    
                    {/* Reviews List */}
                    {isLoadingReviews ? (
                        <div className="text-center py-8"><Spinner /></div>
                    ) : reviews.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                            {reviews.map(review => (
                                <div key={review.id} className="border-b border-neutral-200-light dark:border-neutral-700-dark pb-3">
                                    <div className="flex justify-between items-center">
                                        <h5 className="font-semibold text-brand-text-light dark:text-brand-text">{review.user_name}</h5>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">{new Date(review.created_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-brand-text-secondary-light dark:text-brand-text-secondary py-8">No reviews yet. Be the first to share your experience!</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ClusterDetailModal;
