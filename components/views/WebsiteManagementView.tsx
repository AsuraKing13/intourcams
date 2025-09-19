import React, { useState, useEffect, useMemo } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import { WebsiteManagementIcon, BellIcon, TrashIcon } from '../../constants.tsx';
import Spinner from '../ui/Spinner.tsx';

const WebsiteManagementView: React.FC = () => {
    const { 
        isMaintenanceMode, 
        maintenanceMessage, 
        isLoadingMaintenanceMode, 
        setMaintenanceStatus,
        setSiteBanner,
        sendGlobalPanelNotification,
        notifications,
        deleteGlobalNotification
    } = useAppContext();
    const { showToast } = useToast();

    // Maintenance State
    const [maintMessage, setMaintMessage] = useState('');
    const [maintEnabled, setMaintEnabled] = useState(false);
    const [isSavingMaint, setIsSavingMaint] = useState(false);
    
    // Banner State
    const [bannerMessage, setBannerMessage] = useState('');
    const [bannerExpiry, setBannerExpiry] = useState('');
    const [isSettingBanner, setIsSettingBanner] = useState(false);
    
    // Notification State
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isSendingNotif, setIsSendingNotif] = useState(false);
    const [useBannerForNotif, setUseBannerForNotif] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    const activeSiteBanner = useMemo(() => {
        return notifications.find(n => 
            n.recipient_id === 'global_banner' && 
            (!n.expires_at || new Date(n.expires_at) > new Date())
        );
    }, [notifications]);

    useEffect(() => {
        setMaintMessage(maintenanceMessage);
        setMaintEnabled(isMaintenanceMode);
    }, [maintenanceMessage, isMaintenanceMode]);
    
    useEffect(() => {
        if (useBannerForNotif) {
            setNotificationMessage(bannerMessage);
        }
    }, [bannerMessage, useBannerForNotif]);

    const handleSaveMaintenanceSettings = async () => {
        setIsSavingMaint(true);
        try {
            await setMaintenanceStatus(maintEnabled, maintMessage);
        } finally {
            setIsSavingMaint(false);
        }
    };
    
    const handleSetBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bannerMessage.trim()) {
            showToast("The banner message cannot be empty.", "error");
            return;
        }
        setIsSettingBanner(true);
        try {
            const expiryDate = bannerExpiry ? new Date(bannerExpiry).toISOString() : null;
            await setSiteBanner(bannerMessage, expiryDate);
            setBannerMessage('');
            setBannerExpiry('');
        } finally {
            setIsSettingBanner(false);
        }
    };
    
    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageToSend = useBannerForNotif ? bannerMessage : notificationMessage;
        if (!messageToSend.trim()) {
            showToast("The notification message cannot be empty.", "error");
            return;
        }
        setIsSendingNotif(true);
        try {
            await sendGlobalPanelNotification(messageToSend);
            setNotificationMessage(''); // Clear after sending
        } finally {
            setIsSendingNotif(false);
        }
    };
    
    const handleTakeDownBanner = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteGlobalNotification(id);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Website Management</h2>
                <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">
                    Control site-wide settings and communicate with all users.
                </p>
            </div>

            <Card title="Maintenance Mode" titleIcon={<WebsiteManagementIcon className="w-5 h-5" />}>
                {isLoadingMaintenanceMode ? (
                    <div className="flex justify-center items-center h-24"><Spinner /></div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg">
                            <div>
                                <h3 className="font-semibold text-brand-text-light dark:text-brand-text">Activate Maintenance Mode</h3>
                                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                                    When active, only Admins and Editors can access the site.
                                </p>
                            </div>
                            <label htmlFor="maintenance-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="maintenance-toggle" 
                                    className="sr-only peer" 
                                    checked={maintEnabled}
                                    onChange={() => setMaintEnabled(!maintEnabled)}
                                />
                                <div className="w-11 h-6 bg-neutral-300-light peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-green/30 dark:peer-focus:ring-brand-dark-green/50 rounded-full peer dark:bg-neutral-700-dark peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand-green"></div>
                            </label>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Maintenance Message</label>
                            <textarea
                                value={maintMessage}
                                onChange={(e) => setMaintMessage(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green"
                                placeholder="e.g., The site is undergoing scheduled maintenance and will be back online shortly."
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleSaveMaintenanceSettings} isLoading={isSavingMaint}>Save Settings</Button>
                        </div>
                    </div>
                )}
            </Card>

             <Card title="Global Messages & Banners" titleIcon={<BellIcon className="w-5 h-5" />}>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Site-Wide Banner Section */}
                    <form onSubmit={handleSetBanner} className="space-y-4">
                        <h3 className="text-md font-semibold text-brand-text-light dark:text-brand-text">Site-Wide Banner</h3>
                        <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary -mt-3">
                           This message appears at the top of the site for all users.
                        </p>
                        {activeSiteBanner ? (
                            <div className="p-3 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg flex justify-between items-center gap-4">
                                <div className="flex-grow">
                                    <p className="text-sm text-brand-text-light dark:text-brand-text">"{activeSiteBanner.message}"</p>
                                    <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">Currently active</p>
                                </div>
                                <Button
                                    variant="outline" size="sm" onClick={() => handleTakeDownBanner(activeSiteBanner.id)}
                                    isLoading={deletingId === activeSiteBanner.id}
                                    className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                                    leftIcon={<TrashIcon className="w-4 h-4"/>}
                                >
                                    Take Down
                                </Button>
                            </div>
                        ) : (
                             <p className="text-sm text-center py-4 text-brand-text-secondary-light dark:text-brand-text-secondary">No active site-wide banner.</p>
                        )}
                         <textarea
                            value={bannerMessage}
                            onChange={(e) => setBannerMessage(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green"
                            placeholder="Enter new banner message here..."
                        />
                        <Input
                            label="Banner Expiry Time (Optional)"
                            type="datetime-local"
                            value={bannerExpiry}
                            onChange={(e) => setBannerExpiry(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" isLoading={isSettingBanner} disabled={!bannerMessage.trim()}>
                                {activeSiteBanner ? 'Replace Banner' : 'Set Banner'}
                            </Button>
                        </div>
                    </form>
                     
                    {/* Global Notification Section */}
                    <form onSubmit={handleSendNotification} className="space-y-4 pt-6 lg:pt-0 lg:border-l lg:pl-6 border-neutral-200-light dark:border-neutral-700-dark">
                         <h3 className="text-md font-semibold text-brand-text-light dark:text-brand-text">Notification to All Users</h3>
                         <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary -mt-3">
                           This message will be sent to every user's notification panel (🔔).
                        </p>
                         <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="use-banner-msg" 
                                checked={useBannerForNotif} 
                                onChange={(e) => setUseBannerForNotif(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                            />
                            <label htmlFor="use-banner-msg" className="ml-2 text-sm text-brand-text-light dark:text-brand-text">
                                Use banner message
                            </label>
                        </div>
                        <textarea
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Enter notification message..."
                            disabled={isSendingNotif || useBannerForNotif}
                        />
                         <div className="flex justify-end">
                            <Button type="submit" isLoading={isSendingNotif} disabled={!notificationMessage.trim()}>
                                Send Notification
                            </Button>
                        </div>
                    </form>
                 </div>
            </Card>
        </div>
    );
};

export default WebsiteManagementView;