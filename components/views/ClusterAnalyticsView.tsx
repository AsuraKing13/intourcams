import React, { useContext, useMemo, useState, useCallback } from 'react';
import Card from '../ui/Card.tsx';
import { useAppContext } from '../AppContext.tsx';
import { ThemeContext } from '../ThemeContext.tsx';
import { CursorArrowRaysIcon, EyeIcon, InfoIcon as InformationCircleIcon, SearchIcon, SparklesIcon } from '../../constants.tsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';
import Spinner from '../ui/Spinner.tsx';
import Select from '../ui/Select.tsx';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-3 bg-neutral-200-light dark:bg-neutral-700-dark rounded-lg mr-4 text-brand-green dark:text-brand-dark-green-text">
                {icon}
            </div>
            <div>
                <p className="text-brand-text-secondary-light dark:text-brand-text-secondary text-sm">{title}</p>
                <p className="text-2xl font-bold text-brand-green-text dark:text-brand-dark-green-text truncate" title={value}>{value}</p>
            </div>
        </div>
    </Card>
);

const BarChartCard: React.FC<{ title: string; data: any[]; dataKey: string; nameKey: string; unit?: string; }> = ({ title, data, dataKey, nameKey, unit }) => {
    const { theme } = useContext(ThemeContext);
    const chartColors = useMemo(() => ({
        axisStroke: theme === 'dark' ? '#A0A0A0' : '#566573',
        barFill: theme === 'dark' ? '#D1D5DB' : '#004925',
        tooltipBg: theme === 'dark' ? '#252525' : '#FFFFFF',
        tooltipBorder: theme === 'dark' ? '#333333' : '#DEE2E6',
    }), [theme]);
    const chartTextStyle = { fill: chartColors.axisStroke, fontSize: 12 };

    return (
        <Card title={title}>
            {data.length > 0 ? (
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <XAxis type="number" stroke={chartColors.axisStroke} tick={chartTextStyle} />
                            <YAxis dataKey={nameKey} type="category" stroke={chartColors.axisStroke} width={100} tick={chartTextStyle} />
                            <Tooltip
                                contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '0.5rem' }}
                                cursor={{ fill: theme === 'dark' ? '#333333' : '#E9ECEF' }}
                                formatter={(value) => `${Number(value).toLocaleString()}${unit || ''}`}
                            />
                            <Bar dataKey={dataKey} fill={chartColors.barFill} barSize={20}>
                                <LabelList dataKey={dataKey} position="right" style={chartTextStyle} formatter={(value: number) => `${value.toLocaleString()}${unit || ''}`} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="text-center text-sm text-brand-text-secondary-light dark:text-brand-text-secondary py-8">No data available for this period. For CTR, this may be because no clusters had more than 10 views.</p>
            )}
        </Card>
    );
};

const PlaceholderCard: React.FC<{ title: string; message: string; icon: React.FC<any> }> = ({ title, message, icon: Icon }) => (
    <Card title={title}>
        <div className="text-center py-8">
            <Icon className="mx-auto h-10 w-10 text-neutral-400 dark:text-neutral-500" />
            <p className="mt-4 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">{message}</p>
        </div>
    </Card>
);

const ClusterAnalyticsView: React.FC = () => {
    const { clusters, clusterAnalytics, isLoadingClusters, isLoadingClusterAnalytics } = useAppContext();
    const [performancePeriod, setPerformancePeriod] = useState(30);
    const [engagementPeriod, setEngagementPeriod] = useState(30);

    const periodOptions = [
        { value: 7, label: 'Last 7 Days' },
        { value: 30, label: 'Last 30 Days' },
        { value: 90, label: 'Last 90 Days' },
        { value: 0, label: 'All Time' },
    ];

    const overallStats = useMemo(() => {
        const totalViews = clusters.reduce((acc, c) => acc + c.view_count, 0);
        const totalClicks = clusters.reduce((acc, c) => acc + c.click_count, 0);
        const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        return { totalViews, totalClicks, ctr };
    }, [clusters]);
    
    const calculateStatsForPeriod = useCallback((period: number) => {
        const startDate = new Date();
        if (period > 0) {
            startDate.setDate(startDate.getDate() - period);
        }

        const analyticsInPeriod = period === 0 ? clusterAnalytics : clusterAnalytics.filter(a => new Date(a.created_at) >= startDate);

        const counts: { [id: string]: { views: number; clicks: number; name: string; categories: string[] } } = {};

        analyticsInPeriod.forEach(analytic => {
            if (!counts[analytic.cluster_id]) {
                const cluster = clusters.find(c => c.id === analytic.cluster_id);
                if (cluster) {
                    counts[analytic.cluster_id] = { views: 0, clicks: 0, name: cluster.name, categories: cluster.category };
                }
            }
            if (counts[analytic.cluster_id]) {
                if (analytic.type === 'view') counts[analytic.cluster_id].views++;
                if (analytic.type === 'click') counts[analytic.cluster_id].clicks++;
            }
        });

        const allClusterData = Object.entries(counts).map(([id, data]) => ({ id, ...data, ctr: data.views > 0 ? (data.clicks / data.views) * 100 : 0 }));

        const categoryCounts: { [cat: string]: { views: number; clicks: number } } = {};
        allClusterData.forEach(cluster => {
            cluster.categories.forEach(cat => {
                if (!categoryCounts[cat]) categoryCounts[cat] = { views: 0, clicks: 0 };
                categoryCounts[cat].views += cluster.views;
                categoryCounts[cat].clicks += cluster.clicks;
            });
        });

        return {
            topViewedClusters: [...allClusterData].sort((a, b) => b.views - a.views).slice(0, 5),
            topClickedClusters: [...allClusterData].sort((a, b) => b.clicks - a.clicks).slice(0, 5),
            topViewedCategories: Object.entries(categoryCounts).map(([name, data]) => ({ name, views: data.views })).sort((a, b) => b.views - a.views).slice(0, 5),
            topClickedCategories: Object.entries(categoryCounts).map(([name, data]) => ({ name, clicks: data.clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 5),
            highestCtrClusters: allClusterData.filter(c => c.views > 10).sort((a, b) => b.ctr - a.ctr).slice(0, 5),
        };
    }, [clusters, clusterAnalytics]);

    const performanceStats = useMemo(() => calculateStatsForPeriod(performancePeriod), [performancePeriod, calculateStatsForPeriod]);
    const engagementStats = useMemo(() => calculateStatsForPeriod(engagementPeriod), [engagementPeriod, calculateStatsForPeriod]);

    if (isLoadingClusters || isLoadingClusterAnalytics) {
        return <div className="flex justify-center items-center h-full"><Spinner className="w-12 h-12" /><span className="ml-4 text-xl">Loading Trends Analytics...</span></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Views (All Time)" value={overallStats.totalViews.toLocaleString()} icon={<EyeIcon className="w-6 h-6" />} />
                <StatCard title="Total Clicks (All Time)" value={overallStats.totalClicks.toLocaleString()} icon={<CursorArrowRaysIcon className="w-6 h-6" />} />
                <StatCard title="Overall CTR (All Time)" value={`${overallStats.ctr.toFixed(2)}%`} icon={<SparklesIcon className="w-6 h-6" />} />
            </div>
            
            <div className="space-y-4 pt-4 border-t border-neutral-300-light dark:border-neutral-700-dark">
                <h3 className="text-xl font-semibold text-brand-text-light dark:text-brand-text">Performance Analytics</h3>
                <Card>
                    <div className="flex items-center gap-4">
                        <label htmlFor="performance-period-filter" className="text-sm font-medium">Filter Performance Data:</label>
                        <Select id="performance-period-filter" options={periodOptions} value={String(performancePeriod)} onChange={e => setPerformancePeriod(Number(e.target.value))} />
                    </div>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarChartCard title="Top 5 Most Viewed Clusters" data={performanceStats.topViewedClusters.reverse()} dataKey="views" nameKey="name" />
                    <BarChartCard title="Top 5 Most Clicked Clusters" data={performanceStats.topClickedClusters.reverse()} dataKey="clicks" nameKey="name" />
                    <BarChartCard title="Top 5 Most Viewed Categories" data={performanceStats.topViewedCategories.reverse()} dataKey="views" nameKey="name" />
                    <BarChartCard title="Top 5 Most Clicked Categories" data={performanceStats.topClickedCategories.reverse()} dataKey="clicks" nameKey="name" />
                    <PlaceholderCard title="Top 5 Most Viewed Events" message="Event view tracking is not yet implemented. This feature requires a future backend update to log event interactions." icon={InformationCircleIcon} />
                    <PlaceholderCard title="Top 5 Most Clicked Events" message="Event click tracking is not yet implemented. This feature requires a future backend update to log event interactions." icon={InformationCircleIcon} />
                </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-neutral-300-light dark:border-neutral-700-dark">
                 <h3 className="text-xl font-semibold text-brand-text-light dark:text-brand-text">Engagement Analytics</h3>
                 <Card>
                    <div className="flex items-center gap-4">
                        <label htmlFor="engagement-period-filter" className="text-sm font-medium">Filter Engagement Data:</label>
                        <Select id="engagement-period-filter" options={periodOptions} value={String(engagementPeriod)} onChange={e => setEngagementPeriod(Number(e.target.value))} />
                    </div>
                </Card>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarChartCard title="Highest CTR Clusters" data={engagementStats.highestCtrClusters.reverse()} dataKey="ctr" nameKey="name" unit="%" />
                    <PlaceholderCard title="Highest CTR Event Categories" message="Event analytics are required to calculate this metric. This feature is planned for a future update." icon={InformationCircleIcon} />
                    <PlaceholderCard title="Search Trends" message="Search term logging is not yet implemented. This feature requires a backend update to capture and analyze user search queries." icon={SearchIcon} />
                </div>
            </div>
        </div>
    );
};

export default React.memo(ClusterAnalyticsView);