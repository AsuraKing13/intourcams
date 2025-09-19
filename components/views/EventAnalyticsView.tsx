import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import Card from '../ui/Card.tsx';
import Select from '../ui/Select.tsx';
import { CalendarDaysIcon, EventAnalyticsIcon, SparklesIcon, ArrowPathIcon as RefreshIcon } from '../../constants.tsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';
import { ThemeContext } from '../ThemeContext.tsx';
import { useAppContext } from '../AppContext.tsx';
import { AppEvent } from '../../types.ts';
import Spinner from '../ui/Spinner.tsx';
import { generateEventAnalyticsInsight } from '../../services/gemini.ts';
import Button from '../ui/Button.tsx';
import { GlobeAltIcon } from '@heroicons/react/24/solid';

type GroundingChunk = { 
    web?: { 
        uri?: string; 
        title?: string 
    } 
};

const getFormattedError = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
        const supabaseError = err as { message: string; details?: string; hint?: string; code?: string };
        return `Error: ${supabaseError.message}${supabaseError.details ? ` Details: ${supabaseError.details}` : ''}`;
    }
    try {
        return `An unexpected error occurred: ${JSON.stringify(err)}`;
    } catch {
        return 'An unknown and un-serializable error occurred.';
    }
};

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

const EventAnalyticsView: React.FC = () => {
    const { theme } = useContext(ThemeContext);
    const { events, isLoadingEvents, getCachedAiInsight, setCachedAiInsight, getLatestEventTimestampForYear, currentUser } = useAppContext();
    const [aiInsight, setAiInsight] = useState<{ summary: string; sources: GroundingChunk[] } | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const canManage = useMemo(() => currentUser?.role === 'Admin' || currentUser?.role === 'Editor', [currentUser]);

    const yearOptions = useMemo(() => {
        if (events.length === 0) return [{ value: currentYear, label: String(currentYear) }];
        const years = new Set(events.map(e => new Date(e.start_date).getFullYear()));
        return Array.from(years).sort((a,b) => b-a).map(year => ({ value: year, label: String(year) }));
    }, [events, currentYear]);

    const filteredEvents = useMemo(() => {
        return events.filter(e => new Date(e.start_date).getFullYear() === selectedYear);
    }, [events, selectedYear]);

    const eventsByMonth = useMemo(() => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = monthNames.map(name => ({ month: name, 'Number of Events': 0 }));
        
        filteredEvents.forEach(event => {
            const monthIndex = new Date(event.start_date).getMonth();
            monthlyData[monthIndex]['Number of Events']++;
        });

        return monthlyData;
    }, [filteredEvents]);

    const generateSummary = useCallback(async (): Promise<{ summary: string; sources: GroundingChunk[] }> => {
        return generateEventAnalyticsInsight(filteredEvents, selectedYear);
    }, [filteredEvents, selectedYear]);

    const loadSummary = useCallback(async (forceRefresh = false) => {
        setIsGeneratingSummary(true);
        setAiInsight(null);

        if (forceRefresh && !canManage) {
             forceRefresh = false; 
        }

        const cacheKey = String(selectedYear);
        const cachedResult = await getCachedAiInsight('event_analytics', cacheKey);
        const latestEventTimestamp = await getLatestEventTimestampForYear(selectedYear);
        
        let isCacheFresh = false;
        if (cachedResult && latestEventTimestamp) {
            isCacheFresh = new Date(cachedResult.data_last_updated_at) >= new Date(latestEventTimestamp);
        } else if (cachedResult && !latestEventTimestamp) {
            isCacheFresh = true; // No new events, so cache is fresh
        }

        if (cachedResult && !forceRefresh && isCacheFresh) {
            try {
                const parsed = JSON.parse(cachedResult.content);
                setAiInsight(parsed);
            } catch (e) {
                setAiInsight({ summary: cachedResult.content, sources: [] });
            }
            setIsGeneratingSummary(false);
            return;
        }
        
        if (canManage) {
            const newInsight = await generateSummary();
            setAiInsight(newInsight);
            const newTimestamp = await getLatestEventTimestampForYear(selectedYear);
            await setCachedAiInsight('event_analytics', cacheKey, JSON.stringify(newInsight), newTimestamp || new Date().toISOString());
        } else {
            if (cachedResult) {
                try {
                    const parsed = JSON.parse(cachedResult.content);
                    setAiInsight(parsed);
                } catch (e) {
                    setAiInsight({ summary: cachedResult.content, sources: [] });
                }
            } else if (filteredEvents.length > 0) {
                 setAiInsight({ summary: "The AI analysis for this period has not been generated yet. An editor or admin can generate it by visiting this page.", sources: [] });
            } else {
                 setAiInsight({ summary: "No event data for this year to analyze.", sources: [] });
            }
        }
        setIsGeneratingSummary(false);
    }, [selectedYear, canManage, filteredEvents.length, getCachedAiInsight, getLatestEventTimestampForYear, generateSummary, setCachedAiInsight]);
    
    useEffect(() => {
        loadSummary();
    }, [selectedYear, loadSummary]);
    
    const chartColors = useMemo(() => {
        const isDark = theme === 'dark';
        return {
          axisStroke: isDark ? '#A0A0A0' : '#566573',
          gridStroke: isDark ? '#333333' : '#DEE2E6',
          tooltipBg: isDark ? '#252525' : '#FFFFFF',
          tooltipBorder: isDark ? '#333333' : '#DEE2E6',
          tooltipColor: isDark ? '#F9FAFB' : '#2C3E50',
          barFill: isDark ? '#D1D5DB' : '#004925',
          legendColor: isDark ? '#A0A0A0' : '#566573',
        };
    }, [theme]);

    const chartTextStyle = { fill: chartColors.axisStroke, fontSize: 12 };

    const { busiestMonth, nextEvent } = useMemo(() => {
        const monthWithMostEvents = [...eventsByMonth].sort((a, b) => b['Number of Events'] - a['Number of Events'])[0];
        const busiestMonthName = monthWithMostEvents && monthWithMostEvents['Number of Events'] > 0 ? monthWithMostEvents.month : 'N/A';
        
        const upcoming = events
            .filter(e => new Date(e.start_date) > new Date())
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

        const next = upcoming.length > 0 ? upcoming[0] : null;

        return { busiestMonth: busiestMonthName, nextEvent: next };
    }, [eventsByMonth, events]);

    if (isLoadingEvents) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner className="w-12 h-12" />
                <span className="ml-4 text-xl text-brand-text-secondary-light dark:text-brand-text-secondary">Loading Event Analytics...</span>
            </div>
        );
    }
    
    if (events.length === 0) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Event Analytics</h2>
                <Card>
                    <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-8">
                        No event data is available to generate analytics.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Event Analytics</h2>
                    <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Analyze trends from the official events calendar.</p>
                </div>
                <Select
                    options={yearOptions}
                    value={String(selectedYear)}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="w-32"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={`Total Events in ${selectedYear}`} value={filteredEvents.length.toString()} icon={<CalendarDaysIcon className="w-6 h-6" />} />
                <StatCard title="Busiest Month" value={busiestMonth} icon={<EventAnalyticsIcon className="w-6 h-6" />} />
                <StatCard title="Next Upcoming Event" value={nextEvent ? new Date(nextEvent.start_date).toLocaleDateString() : 'None'} icon={<CalendarDaysIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card title={`Monthly Event Distribution for ${selectedYear}`} className="lg:col-span-3">
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={eventsByMonth} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                                <XAxis dataKey="month" stroke={chartColors.axisStroke} tick={chartTextStyle} />
                                <YAxis stroke={chartColors.axisStroke} tick={chartTextStyle} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, color: chartColors.tooltipColor, borderRadius: '0.5rem' }}
                                    itemStyle={{ color: chartColors.tooltipColor }}
                                    cursor={{ fill: theme === 'dark' ? '#333333' : '#E9ECEF' }}
                                />
                                <Legend wrapperStyle={{ color: chartColors.legendColor }} />
                                <Bar dataKey="Number of Events" fill={chartColors.barFill}>
                                    <LabelList 
                                        dataKey="Number of Events" 
                                        position="top" 
                                        style={chartTextStyle}
                                        formatter={(value: number) => (value > 0 ? value : '')}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Upcoming Events" className="lg:col-span-2">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {events.filter(e => new Date(e.start_date) >= new Date()).slice(0, 10).map((event, index) => (
                            <div key={index} className="p-3 rounded-md bg-neutral-100-light dark:bg-neutral-700-dark">
                                <p className="font-semibold text-brand-text-light dark:text-brand-text">{event.title}</p>
                                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                                    {new Date(event.start_date).toLocaleDateString([], {dateStyle: 'medium'})}
                                </p>
                                {(event.display_address || event.location_name) && <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">{event.display_address || event.location_name}</p>}
                            </div>
                        ))}
                         {events.filter(e => new Date(e.start_date) >= new Date()).length === 0 && (
                            <p className="text-center text-sm text-brand-text-secondary-light dark:text-brand-text-secondary py-4">No upcoming events found.</p>
                         )}
                    </div>
                </Card>
                <Card 
                    title="AI-Powered Insights" 
                    titleIcon={<SparklesIcon className="w-5 h-5 text-brand-green dark:text-brand-dark-green-text" />} 
                    className="lg:col-span-5"
                    actions={canManage && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => loadSummary(true)}
                            isLoading={isGeneratingSummary}
                            leftIcon={<RefreshIcon className="w-4 h-4" />}
                        >
                            Refresh Analysis
                        </Button>
                    )}
                >
                    {isGeneratingSummary ? (
                        <div className="flex items-center justify-center h-full min-h-[150px]">
                            <Spinner />
                            <p className="ml-2 text-brand-text-secondary-light dark:text-brand-text-secondary">Generating analysis...</p>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            <div className="text-sm text-brand-text-light dark:text-brand-text whitespace-pre-wrap font-sans leading-relaxed">
                                {aiInsight?.summary || "No insights to display."}
                            </div>
                             {aiInsight && aiInsight.sources && aiInsight.sources.length > 0 && (
                                <div className="pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark">
                                    <h4 className="text-xs font-semibold uppercase text-brand-text-secondary-light dark:text-brand-text-secondary mb-2 flex items-center">
                                        <GlobeAltIcon className="w-4 h-4 mr-1.5" />
                                        Sources from the web
                                    </h4>
                                    <ul className="space-y-2">
                                        {aiInsight.sources.map((source, index) => source.web && source.web.uri && (
                                            <li key={index} className="flex items-start">
                                                <span className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mr-2 pt-0.5">{index + 1}.</span>
                                                <a
                                                    href={source.web.uri}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-brand-green dark:text-brand-dark-green-text hover:underline"
                                                    title={source.web.uri}
                                                >
                                                    {source.web.title || source.web.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default React.memo(EventAnalyticsView);
