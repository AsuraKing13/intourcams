import React, { useContext, useMemo, useState } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Select from '../ui/Select.tsx';
import { DownloadIcon, FilterIcon, UploadCloudIcon } from '../../constants.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../ThemeContext.tsx';
import { useAppContext } from '../AppContext.tsx';
import Spinner from '../ui/Spinner.tsx';
import RoiDataUploadModal from '../ui/RoiDataUploadModal.tsx';

const ROIStatisticsView: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { roiAnalyticsData, isLoadingRoiAnalytics, currentUser } = useAppContext();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const isAdminOrEditor = useMemo(() => currentUser?.role === 'Admin' || currentUser?.role === 'Editor', [currentUser]);

  const yearOptions = [
    { value: 'all', label: 'All Years' }, { value: '2025', label: '2025' }, { value: '2024', label: '2024' },
    { value: '2023', label: '2023' }, { value: '2022', label: '2022' }, { value: '2021', label: '2021' }, { value: '2020', label: '2020' },
  ];
  const quarterOptions = [
    { value: 'all', label: 'All Quarters' }, { value: 'q1', label: 'Q1' }, { value: 'q2', label: 'Q2' },
    { value: 'q3', label: 'Q3' }, { value: 'q4', label: 'Q4' },
  ];

  const chartColors = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      axisStroke: isDark ? '#A0A0A0' : '#566573',
      gridStroke: isDark ? '#333333' : '#DEE2E6',
      tooltipBg: isDark ? '#252525' : '#FFFFFF',
      tooltipBorder: isDark ? '#333333' : '#DEE2E6',
      tooltipColor: isDark ? '#F9FAFB' : '#2C3E50',
      barFillRevenue: isDark ? '#eed374' : '#004925',
      barFillIncome: isDark ? '#D1D5DB' : '#9CA3AF',
      legendColor: isDark ? '#A0A0A0' : '#566573',
    };
  }, [theme]);

  const chartTextStyle = { fill: chartColors.axisStroke, fontSize: 12 };
  const legendStyle = { fill: chartColors.legendColor, fontSize: 12 };
  
  const chartData = useMemo(() =>
    roiAnalyticsData.map(d => ({
        name: String(d.year),
        Revenue: d.revenue,
        Income: d.income,
    })), [roiAnalyticsData]);

  const formatYAxisTick = (tick: number) => {
    if (tick >= 1_000_000_000) return `${(tick / 1_000_000_000).toFixed(1)}B`;
    if (tick >= 1_000_000) return `${(tick / 1_000_000).toFixed(1)}M`;
    if (tick >= 1_000) return `${(tick / 1_000).toFixed(1)}K`;
    return tick.toString();
  };

  const formatTooltipValue = (value: number) => `RM ${value.toLocaleString()}`;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">ROI Statistics</h2>
            <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Analyze tourism ROI trends yearly.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={<DownloadIcon className="w-5 h-5"/>}>
              Download Data
            </Button>
            {isAdminOrEditor && (
                <Button variant="primary" leftIcon={<UploadCloudIcon className="w-5 h-5"/>} onClick={() => setIsUploadModalOpen(true)}>
                    Upload Data
                </Button>
            )}
          </div>
        </div>

        <Card title="Filter ROI Data" titleIcon={<FilterIcon className="w-5 h-5 text-brand-green dark:text-brand-dark-green-text"/>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Year" options={yearOptions} defaultValue="all" />
            <Select label="Quarter" options={quarterOptions} defaultValue="all" />
          </div>
        </Card>
        
        <Card title="Revenue over Income (ROI)">
           {isLoadingRoiAnalytics ? (
              <div className="flex justify-center items-center h-[400px]">
                  <Spinner className="w-8 h-8" />
                  <span className="ml-2">Loading ROI data...</span>
              </div>
           ) : chartData.length > 0 ? (
              <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke}/>
                      <XAxis dataKey="name" stroke={chartColors.axisStroke} tick={chartTextStyle}/>
                      <YAxis 
                          label={{ value: 'Amount (RM)', angle: -90, position: 'insideLeft', style: chartTextStyle }} 
                          stroke={chartColors.axisStroke} 
                          tick={chartTextStyle} 
                          tickFormatter={formatYAxisTick}
                      />
                      <Tooltip 
                          contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, color: chartColors.tooltipColor, borderRadius: '0.5rem' }} 
                          itemStyle={{ color: chartColors.tooltipColor }}
                          cursor={{fill: theme === 'dark' ? '#333333' : '#E9ECEF'}}
                          formatter={formatTooltipValue}
                      />
                      <Legend wrapperStyle={legendStyle} />
                      <Bar dataKey="Revenue" fill={chartColors.barFillRevenue} />
                      <Bar dataKey="Income" fill={chartColors.barFillIncome} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
           ) : (
              <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-8 h-[400px] flex items-center justify-center">
                  No ROI data available to display. An administrator can upload this data.
              </p>
           )}
        </Card>
      </div>
      {isAdminOrEditor && (
        <RoiDataUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </>
  );
};

export default React.memo(ROIStatisticsView);