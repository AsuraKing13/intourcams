import React, { useState } from 'react';
import VisitorAnalyticsView from './VisitorAnalyticsView.tsx';
import EventAnalyticsView from './EventAnalyticsView.tsx';
import ROIStatisticsView from './ROIStatisticsView.tsx';
import ClusterAnalyticsView from './ClusterAnalyticsView.tsx'; // Import the new view
import { useAppContext } from '../AppContext.tsx';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

type AnalyticsTab = 'visitor' | 'event' | 'cluster' | 'roi'; // Add 'cluster' tab

const TourismStatisticsView: React.FC = () => {
    const { isPremiumUser } = useAppContext();
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('visitor');

    const handleTabClick = (tabName: AnalyticsTab) => {
        // Prevent clicking locked tabs
        if ((tabName === 'roi' || tabName === 'cluster') && !isPremiumUser) {
            return;
        }
        setActiveTab(tabName);
    };

    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'visitor':
                return <VisitorAnalyticsView />;
            case 'event':
                return <EventAnalyticsView />;
            case 'cluster':
                if (isPremiumUser) {
                    return <ClusterAnalyticsView />;
                }
                // Fallthrough to locked view if not premium
            case 'roi':
                if (isPremiumUser) {
                    return <ROIStatisticsView />;
                }
                return (
                    <Card title="Premium Feature">
                        <div className="text-center py-12">
                            <LockClosedIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
                            <h3 className="mt-2 text-lg font-semibold text-brand-text-light dark:text-brand-text">Access Advanced Analytics</h3>
                            <p className="mt-1 text-brand-text-secondary-light dark:text-brand-text-secondary">
                                Upgrade to a Premium account to unlock detailed Cluster and ROI analytics.
                            </p>
                            <Button className="mt-4" variant="primary">Upgrade to Premium</Button>
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    const getTabClass = (tabName: AnalyticsTab) => {
        const baseClasses = 'px-4 py-2 font-semibold rounded-t-lg transition-colors focus:outline-none flex items-center gap-2';
        if (activeTab === tabName) {
            return `${baseClasses} bg-card-bg-light dark:bg-card-bg text-brand-green-text dark:text-brand-dark-green-text`;
        }
        if ((tabName === 'roi' || tabName === 'cluster') && !isPremiumUser) {
            return `${baseClasses} text-neutral-400 dark:text-neutral-500 cursor-not-allowed`;
        }
        return `${baseClasses} text-brand-text-secondary-light dark:text-brand-text-secondary hover:bg-neutral-200-light dark:hover:bg-neutral-800-dark`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Tourism Statistics</h2>
                <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">
                    A consolidated view of Sarawak's tourism performance metrics.
                </p>
            </div>

            <div className="border-b border-neutral-300-light dark:border-neutral-700-dark">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    <button onClick={() => handleTabClick('visitor')} className={getTabClass('visitor')}>
                        Visitor Analytics
                    </button>
                    <button onClick={() => handleTabClick('event')} className={getTabClass('event')}>
                        Event Analytics
                    </button>
                    <button onClick={() => handleTabClick('cluster')} className={getTabClass('cluster')} disabled={!isPremiumUser && activeTab !== 'cluster'}>
                        Trends Analytics
                        {!isPremiumUser && <LockClosedIcon className="w-4 h-4 text-yellow-500" />}
                    </button>
                    <button onClick={() => handleTabClick('roi')} className={getTabClass('roi')} disabled={!isPremiumUser && activeTab !== 'roi'}>
                        ROI Statistics
                        {!isPremiumUser && <LockClosedIcon className="w-4 h-4 text-yellow-500" />}
                    </button>
                </nav>
            </div>

            <div className="animate-modalShow">
                {renderActiveTabContent()}
            </div>
        </div>
    );
};

export default TourismStatisticsView;