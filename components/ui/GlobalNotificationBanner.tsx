import React, { useState, useEffect } from 'react';
import { Notification } from '../../types.ts';
import { BellIcon, XMarkIcon } from '../../constants.tsx';

const DISMISSED_NOTIFICATIONS_KEY = 'dismissedGlobalNotifications';

interface GlobalNotificationBannerProps {
    notifications: Notification[];
    onVisibilityChange: (isVisible: boolean) => void;
}

const GlobalNotificationBanner: React.FC<GlobalNotificationBannerProps> = ({ notifications, onVisibilityChange }) => {
    const [visibleNotification, setVisibleNotification] = useState<Notification | null>(null);

    useEffect(() => {
        const now = new Date();
        const globalNotifications = notifications.filter(n => 
            n.recipient_id === 'global_banner' && 
            (!n.expires_at || new Date(n.expires_at) > now)
        );

        if (globalNotifications.length === 0) {
            setVisibleNotification(null);
            onVisibilityChange(false);
            return;
        }

        try {
            const dismissedIds: string[] = JSON.parse(localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY) || '[]');
            const firstVisible = globalNotifications.find(n => !dismissedIds.includes(n.id));
            setVisibleNotification(firstVisible || null);
            onVisibilityChange(!!firstVisible);
        } catch (e) {
            console.error("Failed to parse dismissed notifications from localStorage", e);
            setVisibleNotification(globalNotifications[0]);
            onVisibilityChange(true);
        }
    }, [notifications, onVisibilityChange]);

    const handleDismiss = () => {
        if (!visibleNotification) return;
        try {
            const dismissedIds: string[] = JSON.parse(localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY) || '[]');
            const newDismissedIds = [...dismissedIds, visibleNotification.id];
            localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(newDismissedIds));
        } catch (e) {
            console.error("Failed to save dismissed notification to localStorage", e);
        }
        setVisibleNotification(null);
        onVisibilityChange(false);
    };

    if (!visibleNotification) {
        return null;
    }

    return (
        <div className="fixed top-16 left-0 right-0 z-50 bg-brand-green dark:bg-brand-dark-green text-white p-3 text-center text-sm animate-modalShow flex items-center justify-center shadow-lg">
            <BellIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="flex-grow">{visibleNotification.message}</span>
            <button onClick={handleDismiss} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Dismiss notification">
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default GlobalNotificationBanner;