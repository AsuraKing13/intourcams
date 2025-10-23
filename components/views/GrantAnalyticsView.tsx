import React, { useContext, useMemo } from 'react';
import Card from '../ui/Card.tsx';
import { useAppContext } from '../AppContext.tsx';
import { ThemeContext } from '../ThemeContext.tsx';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import Spinner from '../ui/Spinner.tsx';
import { GrantApplicationsIcon, CheckCircleIcon, DocumentChartBarIcon, BuildingLibraryIcon } from '../../constants.tsx';
import { GrantApplicationStatus } from '../../types.ts';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <div className="flex items-center">
            <div className="p-3 bg-neutral-200-light dark:bg-neutral-700-dark rounded-lg mr-4 text-brand-green dark:text-brand-dark-green-text">
                {icon}
            </div>
            <div>
                <p className="text-brand-text-secondary-light dark:text-brand-text-secondary text-sm">{title}</p>
                <p className="text-2xl font-bold text-brand-green-text dark:text-brand-dark-green-text">{value}</p>
            </div>
        </div>
    </Card>
);

const GrantAnalyticsView: React.FC = () => {
    const { theme } = useContext(ThemeContext);
    const { grantApplications, isLoadingGrantApplications, grantCategories } = useAppContext();

    const chartColors = useMemo(() => {
        const isDark = theme === 'dark';
        return {
            pie: ['#004925', '#047857', '#4DBA87', '#9CA3AF', '#6B7280', '#D1D5DB', '#F3F4F6'],
            darkPie: ['#eed374', '#C8A03E', '#A0A0A0', '#6B7280', '#4B5563', '#374151', '#1F2937'],
            axisStroke: isDark ? '#A0A0A0' : '#566573',
            gridStroke: isDark ? '#333333' : '#DEE2E6',
            tooltipBg: isDark ? '#252525' : '#FFFFFF',
            barFill: isDark ? '#D1D5DB' : '#004925',
            lineTotal: isDark ? '#F9FAFB' : '#000000',
            legendColor: isDark ? '#A0A0A0' : '#566573',
        };
    }, [theme]);
    
    const chartTextStyle = { fill: chartColors.axisStroke, fontSize: 12 };

    const { 
        totalApplications, 
        totalApproved, 
        totalDisbursed, 
        approvalRate,
        monthlyTrendData,
        categoryDistributionData,
        statusDistributionData 
    } = useMemo(() => {
        if (grantApplications.length === 0) {
            return {
                totalApplications: 0,
                totalApproved: 0,
                totalDisbursed: 0,
                approvalRate: 0,
                monthlyTrendData: [],
                categoryDistributionData: [],
                statusDistributionData: []
            };
        }

        const totalApps = grantApplications.length;
        const approvedApps = grantApplications.filter(app => ['Complete', 'Final Report Required'].includes(app.status));
        const totalApprovedCount = approvedApps.length;
        const totalDisbursedAmount = grantApplications.reduce((sum, app) => sum + (app.initial_disbursement_amount || 0) + (app.final_disbursement_amount || 0), 0);
        const rate = totalApps > 0 ? (totalApprovedCount / totalApps) * 100 : 0;
        
        // Monthly Trends
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = monthNames.map(name => ({ month: name, 'Applications': 0 }));
        grantApplications.forEach(app => {
            const monthIndex = new Date(app.submission_timestamp).getMonth();
            monthlyData[monthIndex]['Applications']++;
        });

        // Category Distribution
        const categoryCounts = grantApplications.reduce((acc, app) => {
            const categoryName = grantCategories.find(c => c.id === app.grant_category_id)?.name || 'Unknown';
            acc[categoryName] = (acc[categoryName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({ name, count })).sort((a,b) => a.count - b.count);

        // Status Distribution
        const statusCounts = grantApplications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
        }, {} as Record<GrantApplicationStatus, number>);
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        
        return {
            totalApplications: totalApps,
            totalApproved: totalApprovedCount,
            totalDisbursed: totalDisbursedAmount,
            approvalRate: rate,
            monthlyTrendData: monthlyData,
            categoryDistributionData: categoryData,
            statusDistributionData: statusData,
        };
    }, [grantApplications, grantCategories]);

    if (isLoadingGrantApplications) {
        return <div className="flex justify-center items-center h-full"><Spinner className="w-12 h-12" /><span className="ml-4 text-xl">Loading Grant Analytics...</span></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Applications" value={totalApplications.toLocaleString()} icon={<GrantApplicationsIcon className="w-6 h-6" />} />
                <StatCard title="Approved Grants" value={totalApproved.toLocaleString()} icon={<CheckCircleIcon className="w-6 h-6" />} />
                <StatCard title="Approval Rate" value={`${approvalRate.toFixed(1)}%`} icon={<DocumentChartBarIcon className="w-6 h-6" />} />
                <StatCard title="Total Disbursed" value={`RM ${totalDisbursed.toLocaleString()}`} icon={<BuildingLibraryIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Monthly Application Trends">
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={monthlyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                                <XAxis dataKey="month" tick={chartTextStyle} />
                                <YAxis tick={chartTextStyle} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.gridStroke}`, borderRadius: '0.5rem' }} />
                                <Line type="monotone" dataKey="Applications" stroke={chartColors.lineTotal} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Applications by Category">
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={categoryDistributionData} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                                <XAxis type="number" tick={chartTextStyle} />
                                <YAxis dataKey="name" type="category" tick={chartTextStyle} width={150} />
                                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.gridStroke}`, borderRadius: '0.5rem' }}/>
                                <Bar dataKey="count" name="Applications" fill={chartColors.barFill} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            <Card title="Current Status Breakdown">
                 <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            {/* FIX: The `percent` prop from recharts can be undefined. Added a fallback to 0 to prevent a TypeScript error during arithmetic operations. */}
                            <Pie data={statusDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                                {/* FIX: Replaced incorrect mapping logic. Now mapping over statusDistributionData to generate cells and assigning colors cyclically. */}
                                {statusDistributionData.map((entry, index) => {
                                    const colors = theme === 'dark' ? chartColors.darkPie : chartColors.pie;
                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                })}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.gridStroke}`, borderRadius: '0.5rem' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default GrantAnalyticsView;