import React, { useState, useMemo } from 'react';
import { ViewName, Cluster, AppEvent, ItineraryItem } from '../../types.ts';
import { useAppContext } from '../AppContext.tsx';
import { useToast } from '../ToastContext.tsx';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import Spinner from '../ui/Spinner.tsx';
import { SparklesIcon, TourismClusterIcon, EventsCalendarIcon, PlusIcon, MapPinIcon } from '../../constants.tsx';
import { generateItineraryRecommendations } from '../../services/gemini.ts';

interface AIPlannerViewProps {
  setCurrentView: (view: ViewName) => void;
  onAuthRequired?: (message?: string) => void;
}

interface Recommendation {
    id: string;
    type: 'cluster' | 'event';
    name: string;
    justification: string;
    location: string;
}

const activityOptions = ['Nature', 'Culture', 'Adventure', 'Food', 'Festivals', 'History', 'Relaxation'];

const AIPlannerView: React.FC<AIPlannerViewProps> = ({ setCurrentView, onAuthRequired }) => {
    const { clusters, events, currentUser, addItineraryItem } = useAppContext();
    const { showToast } = useToast();
    
    const [preferences, setPreferences] = useState({
        location: '',
        activities: new Set<string>(),
        duration: 3,
        budget: 500,
    });
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleActivityToggle = (activity: string) => {
        setPreferences(prev => {
            const newActivities = new Set(prev.activities);
            if (newActivities.has(activity)) {
                newActivities.delete(activity);
            } else {
                newActivities.add(activity);
            }
            return { ...prev, activities: newActivities };
        });
    };

    const handleGetRecommendations = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendations([]);

        try {
            const locationLower = preferences.location.toLowerCase();
            const selectedActivities = Array.from(preferences.activities).map(a => a.toLowerCase());

            const relevantClusters = clusters.filter(c => {
                const matchesLocation = !locationLower || (c.display_address || c.location).toLowerCase().includes(locationLower);
                const matchesActivity = selectedActivities.length === 0 || c.category.some(cat => selectedActivities.includes(cat.toLowerCase()));
                return matchesLocation && matchesActivity;
            });

            const relevantEvents = events.filter(e => {
                const matchesLocation = !locationLower || (e.display_address || e.location_name).toLowerCase().includes(locationLower);
                const matchesActivity = selectedActivities.length === 0 || selectedActivities.includes(e.category.toLowerCase());
                return matchesLocation && matchesActivity;
            });
            
            if (relevantClusters.length === 0 && relevantEvents.length === 0) {
                 setError("We couldn't find any locations or events matching your search criteria. Please try a broader location like 'Kuching' or 'Miri'.");
                 setIsLoading(false);
                 return;
            }

            const allRelevantItems = [
                ...relevantClusters.map(c => ({ ...c, itemType: 'cluster' as const })),
                ...relevantEvents.map(e => ({ ...e, itemType: 'event' as const }))
            ];
            const shuffledItems = allRelevantItems.sort(() => 0.5 - Math.random());
            const selectedItems = shuffledItems.slice(0, 30);

            const result = await generateItineraryRecommendations(preferences, selectedItems);
            setRecommendations(result);

        } catch (err) {
            console.error("AI Planner Error:", err);
            const errorMessage = err instanceof Error ? err.message : "Sorry, we couldn't generate recommendations at this time. Please try adjusting your preferences or try again later.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (item: Recommendation) => {
        if (item.type === 'cluster') {
            sessionStorage.setItem('initialClusterSearch', item.name);
            setCurrentView(ViewName.TourismCluster);
        } else {
            sessionStorage.setItem('initialEventSearch', item.name);
            setCurrentView(ViewName.EventsCalendar);
        }
    };
    
    const handleAddToItinerary = (item: Recommendation) => {
        if (!currentUser) {
            onAuthRequired?.("Please log in or register to save items to your itinerary.");
            return;
        }
        addItineraryItem(item.id, item.type, item.name);
    };

    return (
        <div className="space-y-6">
            <Card title="AI Trip Planner" titleIcon={<SparklesIcon className="w-6 h-6" />}>
                <div className="space-y-4">
                    <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">
                        Tell us about your ideal trip, and our AI will craft personalized recommendations for you.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input
                            label="Location"
                            placeholder="e.g., Kuching, Miri"
                            value={preferences.location}
                            onChange={e => setPreferences(p => ({ ...p, location: e.target.value }))}
                        />
                        <Input
                            label="Trip Duration (days)"
                            type="number"
                            min="1"
                            value={preferences.duration}
                            onChange={e => setPreferences(p => ({ ...p, duration: parseInt(e.target.value, 10) || 1 }))}
                        />
                        <Input
                            label="Budget per person (RM)"
                            type="number"
                            min="0"
                            step="50"
                            value={preferences.budget}
                            onChange={e => setPreferences(p => ({ ...p, budget: parseInt(e.target.value, 10) || 0 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-2">Interests</label>
                        <div className="flex flex-wrap gap-2">
                            {activityOptions.map(activity => (
                                <button
                                    key={activity}
                                    onClick={() => handleActivityToggle(activity)}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                        preferences.activities.has(activity)
                                            ? 'bg-brand-green dark:bg-brand-dark-green text-white font-semibold'
                                            : 'bg-neutral-200-light dark:bg-neutral-700-dark hover:bg-neutral-300-light dark:hover:bg-neutral-600-dark'
                                    }`}
                                >
                                    {activity}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleGetRecommendations}
                            isLoading={isLoading}
                            leftIcon={<SparklesIcon className="w-5 h-5" />}
                        >
                            Get Recommendations
                        </Button>
                    </div>
                </div>
            </Card>

            {isLoading && (
                <div className="text-center py-12">
                    <Spinner className="w-12 h-12 mx-auto" />
                    <p className="mt-4 text-lg font-semibold text-brand-text-light dark:text-brand-text">
                        Our AI is crafting your personalized trip...
                    </p>
                    <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">This may take a moment.</p>
                </div>
            )}

            {error && (
                <Card>
                    <p className="text-center text-red-500 dark:text-red-400 py-8">{error}</p>
                </Card>
            )}

            {recommendations.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text">Your Personalized Recommendations</h2>
                    {recommendations.map((rec, index) => (
                        <Card key={`${rec.id}-${index}`} className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-3">
                                        {rec.type === 'cluster' ? <TourismClusterIcon className="w-8 h-8 text-brand-green dark:text-brand-dark-green-text" /> : <EventsCalendarIcon className="w-8 h-8 text-brand-green dark:text-brand-dark-green-text" />}
                                        <div>
                                            <span className="text-xs uppercase font-semibold text-brand-text-secondary-light dark:text-brand-text-secondary">{rec.type}</span>
                                            <h3 className="text-xl font-bold text-brand-text-light dark:text-brand-text">{rec.name}</h3>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm flex items-center text-brand-text-secondary-light dark:text-brand-text-secondary">
                                        <MapPinIcon className="w-4 h-4 mr-1.5 flex-shrink-0" /> {rec.location}
                                    </p>
                                    <div className="mt-4 p-4 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg">
                                        <h4 className="font-semibold text-brand-green-text dark:text-brand-dark-green-text flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5" /> Why it's a great match for you:
                                        </h4>
                                        <p className="mt-2 text-brand-text-secondary-light dark:text-brand-text-secondary">{rec.justification}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center items-center gap-3 md:border-l md:pl-6 border-neutral-200-light dark:border-neutral-700-dark">
                                    <Button variant="secondary" size="lg" className="w-full" onClick={() => handleViewDetails(rec)}>
                                        View Details
                                    </Button>
                                    <Button variant="primary" size="lg" className="w-full" onClick={() => handleAddToItinerary(rec)} leftIcon={<PlusIcon className="w-5 h-5"/>}>
                                        Add to Itinerary
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AIPlannerView;