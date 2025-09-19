import React, { useState } from 'react';
import Card from './Card.tsx';
import Button from './Button.tsx';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import { ChatBubbleBottomCenterTextIcon } from '../../constants.tsx';

const FeedbackSettings: React.FC = () => {
    const { addFeedback, currentUser } = useAppContext();
    const { showToast } = useToast();
    const [content, setContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            showToast("Feedback cannot be empty.", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            await addFeedback(content, isAnonymous, 'Settings Page');
            showToast("Thank you! Your feedback has been submitted.", "success");
            setContent('');
            setIsAnonymous(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) return null;

    return (
        <Card title="System Feedback" titleIcon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6" />}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                    We value your input! Please let us know how we can improve the INTOURCAMS system.
                </p>
                <div>
                    <label htmlFor="feedback-content" className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">
                        Your Feedback
                    </label>
                    <textarea
                        id="feedback-content"
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green"
                        placeholder="Describe your experience, suggestions, or any issues you've encountered..."
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="flex items-center">
                    <input
                        id="anonymous-checkbox"
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                        disabled={isSubmitting}
                    />
                    <label htmlFor="anonymous-checkbox" className="ml-2 block text-sm text-brand-text-light dark:text-brand-text">
                        Submit Anonymously
                    </label>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                        Submit Feedback
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default FeedbackSettings;
