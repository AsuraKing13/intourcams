import React, { useContext, useMemo, useState } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Select from '../ui/Select.tsx';
import { DownloadIcon, UsersIcon, CalendarDaysIcon, UploadCloudIcon } from '../../constants.tsx';
import { GlobeAltIcon } from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { ThemeContext } from '../ThemeContext.tsx';
import { useAppContext } from '../AppContext.tsx';
import Spinner from '../ui/Spinner.tsx';
import VisitorDataUploadModal from '../ui/VisitorDataUploadModal.tsx';

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

const VisitorAnalyticsView: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const { visitorAnalyticsData, isLoadingVisitorAnalytics, currentUser } = useAppContext();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const isAdminOrEditor = useMemo(() => currentUser?.role === 'Admin' || currentUser?.role === 'Editor', [currentUser]);

  const availableYears = useMemo(() => {
      if (isLoadingVisitorAnalytics || visitorAnalyticsData.length === 0) {
          return [new Date().getFullYear()];
      }
      return [...new Set(visitorAnalyticsData.map(d => d.year))].sort((a: number, b: number) => b - a);
  }, [visitorAnalyticsData, isLoadingVisitorAnalytics]);
  
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  
  // Effect to update selected year if available years change (e.g., on initial load)
  React.useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || new Date().getFullYear());
    }
  }, [availableYears, selectedYear]);

  const yearOptions = availableYears.map(y => ({ value: String(y), label: String(y) }));

  const yearData = useMemo(() => {
    return visitorAnalyticsData.filter(d => d.year === selectedYear);
  }, [visitorAnalyticsData, selectedYear]);

  const { totalVisitors, topCountry, busiestMonth, visitorTypeData, topCountriesData, monthlyTrendData } = useMemo(() => {
    if (yearData.length === 0) {
        return { totalVisitors: 0, topCountry: 'N/A', busiestMonth: 'N/A', visitorTypeData: [], topCountriesData: [], monthlyTrendData: [] };
    }
    
    // Total Visitors
    const total = yearData.reduce((sum, item) => sum + item.count, 0);

    // Visitor Type Breakdown (Pie Chart)
    const typeData = yearData.reduce((acc, item) => {
        acc[item.visitor_type] = (acc[item.visitor_type] || 0) + item.count;
        return acc;
    }, {} as Record<'Domestic' | 'International', number>);

    const pieData = Object.entries(typeData).map(([name, value]) => ({ name, value }));
    
    // Top International Countries (Bar Chart)
    const internationalData = yearData.filter(d => d.visitor_type === 'International');
    const countryTotals = internationalData.reduce((acc, item) => {
        acc[item.country] = (acc[item.country] || 0) + item.count;
        return acc;
    }, {} as Record<string, number>);

    const sortedCountries = Object.entries(countryTotals)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10);
    const topCountryName = sortedCountries.length > 0 ? sortedCountries[0][0] : 'N/A';

    // Monthly Trends (Line Chart)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = monthNames.map((name, index) => {
        const month = index + 1;
        const monthStats = yearData.filter(d => d.month === month);
        return {
            month: name,
            Total: monthStats.reduce((sum, item) => sum + item.count, 0),
            International: monthStats.filter(d => d.visitor_type === 'International').reduce((sum, i) => sum + i.count, 0),
            Domestic: monthStats.filter(d => d.visitor_type === 'Domestic').reduce((sum, i) => sum + i.count, 0),
        };
    });
    const busiestMonthName = [...monthlyData].sort((a,b) => b.Total - a.Total)[0]?.month || 'N/A';

    return {
        totalVisitors: total,
        topCountry: topCountryName,
        busiestMonth: busiestMonthName,
        visitorTypeData: pieData,
        topCountriesData: sortedCountries.map(([name, count]) => ({ country: name, count: count as number })).reverse(), // Reverse for horizontal bar chart
        monthlyTrendData: monthlyData
    };
  }, [yearData]);
  
  const chartColors = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      pieFill1: isDark ? '#eed374' : '#004925', // Yellow for Dark Mode / Brand Green for Light Mode
      pieFill2: isDark ? '#D1D5DB' : '#9CA3AF', // Light Gray for Dark Mode / Medium Gray for Light Mode
      pieFill3: isDark ? '#C8A03E' : '#047857',
      axisStroke: isDark ? '#A0A0A0' : '#566573',
      gridStroke: isDark ? '#333333' : '#DEE2E6',
      tooltipBg: isDark ? '#252525' : '#FFFFFF',
      tooltipBorder: isDark ? '#333333' : '#DEE2E6',
      tooltipColor: isDark ? '#F9FAFB' : '#2C3E50',
      barFill: isDark ? '#D1D5DB' : '#004925',
      lineTotal: isDark ? '#F9FAFB' : '#000000',
      lineInternational: isDark ? '#D1D5DB' : '#004925',
      lineDomestic: isDark ? '#4DBA87' : '#2ECC71',
      legendColor: isDark ? '#A0A0A0' : '#566573',
    };
  }, [theme]);
  
  const chartTextStyle = { fill: chartColors.axisStroke, fontSize: 12 };
  const legendStyle = { fill: chartColors.legendColor, fontSize: 12 };
  
  if (isLoadingVisitorAnalytics) {
      return <div className="flex justify-center items-center h-full"><Spinner className="w-12 h-12" /><span className="ml-4 text-xl">Loading Analytics...</span></div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Visitor Analytics</h2>
          <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Understand visitor trends and demographics in Sarawak.</p>
        </div>
        <div className="flex items-center gap-4">
            <Select options={yearOptions} value={String(selectedYear)} onChange={e => setSelectedYear(Number(e.target.value))} className="w-32" />
            <Button variant="secondary" leftIcon={<DownloadIcon className="w-5 h-5"/>} disabled>
              Download Report
            </Button>
            {isAdminOrEditor && (
                <Button variant="primary" leftIcon={<UploadCloudIcon className="w-5 h-5"/>} onClick={() => setIsUploadModalOpen(true)}>
                    Upload Data
                </Button>
            )}
        </div>
      </div>
      
      {visitorAnalyticsData.length === 0 ? (
          <Card>
              <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-8">
                  No visitor analytics data has been uploaded yet.
              </p>
          </Card>
      ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title={`Total Visitors (${selectedYear})`} value={totalVisitors.toLocaleString()} icon={<UsersIcon className="w-6 h-6"/>} />
            <StatCard title="Top Country (Intl.)" value={topCountry} icon={<GlobeAltIcon className="w-6 h-6"/>} />
            <StatCard title="Busiest Month" value={busiestMonth} icon={<CalendarDaysIcon className="w-6 h-6"/>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Visitor Type Breakdown" className="lg:col-span-1">
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={visitorTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {visitorTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? chartColors.pieFill1 : chartColors.pieFill2} />))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '0.5rem' }}/>
                            <Legend wrapperStyle={legendStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card title="Top 10 International Arrivals" className="lg:col-span-2">
                <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <BarChart data={topCountriesData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                        <XAxis type="number" stroke={chartColors.axisStroke} tick={chartTextStyle} />
                        <YAxis dataKey="country" type="category" stroke={chartColors.axisStroke} width={80} tick={chartTextStyle}/>
                        <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '0.5rem' }} cursor={{fill: theme === 'dark' ? '#333333' : '#E9ECEF'}} />
                        <Bar dataKey="count" name="Visitors" fill={chartColors.barFill} barSize={15} />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </Card>
        </div>
        <Card title={`Monthly Visitor Trends for ${selectedYear}`}>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke}/>
                    <XAxis dataKey="month" stroke={chartColors.axisStroke} tick={chartTextStyle}/>
                    <YAxis label={{ value: 'Number of Visitors', angle: -90, position: 'insideLeft', style: chartTextStyle }} stroke={chartColors.axisStroke} tick={chartTextStyle} />
                    <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: '0.5rem' }} cursor={{fill: theme === 'dark' ? '#333333' : '#E9ECEF'}} />
                    <Legend wrapperStyle={legendStyle}/>
                    <Line type="monotone" dataKey="Total" stroke={chartColors.lineTotal} strokeWidth={3} />
                    <Line type="monotone" dataKey="International" stroke={chartColors.lineInternational} />
                    <Line type="monotone" dataKey="Domestic" stroke={chartColors.lineDomestic} />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </Card>
        </>
      )}
      {isAdminOrEditor && (
        <VisitorDataUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  );
};

export default React.memo(VisitorAnalyticsView);