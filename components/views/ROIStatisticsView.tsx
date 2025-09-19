import React, { useContext, useMemo } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Select from '../ui/Select.tsx';
import { DownloadIcon, MOCK_ROI_DATA, FilterIcon } from '../../constants.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../ThemeContext.tsx';

const ROIStatisticsView: React.FC = () => {
  const { theme } = useContext(ThemeContext);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">ROI Statistics</h2>
          <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Analyze tourism ROI trends yearly.</p>
        </div>
        <Button variant="primary" leftIcon={<DownloadIcon className="w-5 h-5"/>}>
          Download Data
        </Button>
      </div>

      <Card title="Filter ROI Data" titleIcon={<FilterIcon className="w-5 h-5 text-brand-green dark:text-brand-dark-green-text"/>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Year" options={yearOptions} defaultValue="all" />
          <Select label="Quarter" options={quarterOptions} defaultValue="all" />
        </div>
      </Card>
      
      <Card title="Revenue over Income (ROI)">
         <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={MOCK_ROI_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke}/>
                <XAxis dataKey="name" stroke={chartColors.axisStroke} tick={chartTextStyle}/>
                <YAxis 
                    label={{ value: 'Mil (RM)', angle: -90, position: 'insideLeft', style: chartTextStyle }} 
                    stroke={chartColors.axisStroke} 
                    tick={chartTextStyle} 
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, color: chartColors.tooltipColor, borderRadius: '0.5rem' }} 
                    itemStyle={{ color: chartColors.tooltipColor }}
                    cursor={{fill: theme === 'dark' ? '#333333' : '#E9ECEF'}}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="Revenue" fill={chartColors.barFillRevenue} />
                <Bar dataKey="Income" fill={chartColors.barFillIncome} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </Card>
    </div>
  );
};

export default React.memo(ROIStatisticsView);