import React, { useState, useMemo } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Select from '../ui/Select.tsx';
import { useAppContext } from '../AppContext.tsx';
import { Feedback, FeedbackStatus } from '../../types.ts';
import Spinner from '../ui/Spinner.tsx';
import { CheckCircleIcon, EyeIcon, TrashIcon } from '../../constants.tsx';
import { useToast } from '../ToastContext.tsx';

const FEEDBACK_STATUSES: FeedbackStatus[] = ['new', 'seen', 'archived'];
const STATUS_OPTIONS = [{ value: 'all', label: 'All Statuses' }, ...FEEDBACK_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))];

const getStatusBadgeClasses = (status: FeedbackStatus) => {
    switch (status) {
        case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'seen': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'archived': return 'bg-neutral-200 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-200';
        default: return '';
    }
};

const FeedbackCard: React.FC<{
    feedback: Feedback;
    onStatusChange: (id: string, status: FeedbackStatus) => void;
    isUpdating: boolean;
}> = ({ feedback, onStatusChange, isUpdating }) => {
    const { users } = useAppContext();
    const author = useMemo(() => feedback.user_id ? users.find(u => u.id === feedback.user_id) : null, [users, feedback.user_id]);

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="flex-grow">
                    <p className="text-brand-text-light dark:text-brand-text whitespace-pre-wrap">{feedback.content}</p>
                </div>
                <div className="flex-shrink-0 w-full sm:w-56 space-y-3">
                    <div className="p-2 bg-neutral-100-light dark:bg-neutral-800-dark rounded-md">
                        <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">Submitted By</p>
                        <p className="font-semibold">{author ? `${author.name} (${author.email})` : 'Anonymous'}</p>
                    </div>
                    <div className="p-2 bg-neutral-100-light dark:bg-neutral-800-dark rounded-md">
                        <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">Date</p>
                        <p className="font-semibold">{new Date(feedback.created_at).toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-neutral-100-light dark:bg-neutral-800-dark rounded-md">
                        <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">Status</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusBadgeClasses(feedback.status)}`}>
                            {feedback.status ? feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1) : 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark flex justify-end items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => onStatusChange(feedback.id, 'new')} disabled={isUpdating || feedback.status === 'new'}>Mark as New</Button>
                <Button variant="secondary" size="sm" onClick={() => onStatusChange(feedback.id, 'seen')} disabled={isUpdating || feedback.status === 'seen'} leftIcon={<EyeIcon className="w-4 h-4" />}>Mark as Seen</Button>
                <Button variant="secondary" size="sm" onClick={() => onStatusChange(feedback.id, 'archived')} disabled={isUpdating || feedback.status === 'archived'} leftIcon={<CheckCircleIcon className="w-4 h-4" />}>Archive</Button>
            </div>
        </Card>
    );
};

const FeedbackManagementView: React.FC = () => {
    const { feedback: allFeedback, isLoadingFeedback, updateFeedbackStatus } = useAppContext();
    const { showToast } = useToast();
    const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const filteredFeedback = useMemo(() => {
        if (statusFilter === 'all') {
            return allFeedback;
        }
        return allFeedback.filter(f => f.status === statusFilter);
    }, [allFeedback, statusFilter]);

    const handleStatusChange = async (id: string, status: FeedbackStatus) => {
        setUpdatingId(id);
        try {
            await updateFeedbackStatus(id, status);
        } catch(e) {
            // Error is handled in context
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">System Feedback Management</h2>
                <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Review and manage feedback submitted by users.</p>
            </div>

            <Card>
                <div className="flex items-center gap-4">
                    <label htmlFor="status-filter" className="text-sm font-medium">Filter by status:</label>
                    <Select id="status-filter" options={STATUS_OPTIONS} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} />
                </div>
            </Card>

            {isLoadingFeedback ? (
                <div className="text-center py-10"><Spinner className="w-8 h-8 mx-auto" /><p className="mt-2">Loading feedback...</p></div>
            ) : filteredFeedback.length > 0 ? (
                <div className="space-y-4">
                    {filteredFeedback.map(item => (
                        <FeedbackCard 
                            key={item.id} 
                            feedback={item} 
                            onStatusChange={handleStatusChange}
                            isUpdating={updatingId === item.id}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="text-center py-12">
                        <p className="mt-1 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                            No feedback entries match the current filter.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default FeedbackManagementView;