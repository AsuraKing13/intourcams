

import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import Card from '../ui/Card.tsx';
import Spinner from '../ui/Spinner.tsx';
import { useAppContext } from '../AppContext.tsx';
import { ThemeContext } from '../ThemeContext.tsx';
import { ViewName, Cluster, AppEvent } from '../../types.ts';
import Select from '../ui/Select.tsx';
import { 
    TourismClusterIcon, 
    EventsCalendarIcon, 
    CLUSTER_CATEGORIES, 
    StarIcon as SolidStarIcon, 
    MapPinIcon, 
    ClockIcon, 
    CalendarDaysIcon,
    CultureClusterIcon,
    AdventureClusterIcon,
    NatureClusterIcon,
    FoodsClusterIcon,
    FestivalsClusterIcon,
    UsersIcon,
    InfoIcon,
    SARAWAK_DISTRICTS,
} from '../../constants.tsx';


// Leaflet is loaded from a CDN in index.html
declare const L: any;

interface TourismMappingViewProps {
    setCurrentView: (view: ViewName) => void;
}

const EVENT_CATEGORY_ICONS: { [key: string]: React.FC<any> } = {
    'Culture': CultureClusterIcon,
    'Adventure': AdventureClusterIcon,
    'Nature': NatureClusterIcon,
    'Festival': FestivalsClusterIcon,
    'Food': FoodsClusterIcon,
    'Community': UsersIcon,
    'Other': InfoIcon,
};

const CLUSTER_CATEGORY_COLORS: { [key: string]: string } = {
    'Association': '#9b59b6', // Amethyst
    'Homestay': '#3498db',    // Peter River
    'Culture': '#e67e22',     // Carrot
    'Adventure': '#e74c3c',   // Alizarin
    'Nature': '#2ecc71',      // Emerald
    'Foods': '#f1c40f',       // Sun Flower
    'Festivals': '#1abc9c',   // Turquoise
    'Default': '#7f8c8d'      // Asbestos
};


const TourismMappingView: React.FC<TourismMappingViewProps> = ({ setCurrentView }) => {
    const { clusters, isLoadingClusters, events, isLoadingEvents, currentUser } = useAppContext();
    const { theme } = useContext(ThemeContext);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const filterCardRef = useRef<HTMLDivElement>(null);
    const popupOptionsRef = useRef({ autoPanPadding: L.point(50, 70) });
    const navigationHandlerRef = useRef<(type: 'cluster' | 'event', id: string) => void>();

    const [showClusters, setShowClusters] = useState(true);
    const [showEvents, setShowEvents] = useState(true);
    const allCategoryIds = useMemo(() => new Set(CLUSTER_CATEGORIES.map(c => c.id)), []);
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(allCategoryIds);
    const [selectedDistrict, setSelectedDistrict] = useState('All');

    const isLoading = isLoadingClusters || isLoadingEvents;

    // This effect keeps the navigation handler up-to-date with the latest state and props.
    // It's a robust way to avoid stale closures in event handlers that are only registered once.
    useEffect(() => {
        navigationHandlerRef.current = (type, id) => {
            if (type === 'cluster') {
                const cluster = clusters.find(c => c.id === id);
                if (cluster) {
                    sessionStorage.setItem('initialClusterSearch', cluster.name);
                    setCurrentView(ViewName.TourismCluster);
                }
            } else if (type === 'event') {
                const eventItem = events.find(ev => ev.id === id);
                if (eventItem) {
                    sessionStorage.setItem('initialEventSearch', eventItem.title);
                    setCurrentView(ViewName.EventsCalendar);
                }
            }
        };
    }, [clusters, events, setCurrentView]);

    // This effect observes the filter card's dimensions and updates the popup padding accordingly.
    // This makes the map "aware" of the UI above it, preventing popups from opening underneath.
    useEffect(() => {
        const filterElement = filterCardRef.current;
        if (!filterElement) return;

        const resizeObserver = new ResizeObserver(() => {
            const height = filterElement.offsetHeight;
            // Set top padding to the filter card's height + a 20px margin for aesthetics.
            popupOptionsRef.current = { autoPanPadding: L.point(50, height + 20) };
        });

        resizeObserver.observe(filterElement);
        // FIX: The error "Expected 1 arguments, but got 0" pointed to a type definition issue with `resizeObserver.disconnect()`.
        // Using `unobserve(filterElement)` is the correct way to clean up a single element observer and resolves the error.
        // FIX: Replaced `disconnect()` with `unobserve(filterElement)` to correctly unobserve the specific element on cleanup, resolving the argument count error.
        return () => resizeObserver.unobserve(filterElement);
    }, []);


    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const handleSelectAllCategories = () => setSelectedCategories(allCategoryIds);
    const handleDeselectAllCategories = () => setSelectedCategories(new Set());
    
    // --- Popup Components ---
    const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
                <SolidStarIcon key={index} className={`w-4 h-4 ${index < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );

    const ClusterPopup: React.FC<{ cluster: Cluster }> = ({ cluster }) => {
        const googleMapsUrl = (cluster.latitude && cluster.longitude)
            ? `https://www.google.com/maps/search/?api=1&query=${cluster.latitude},${cluster.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cluster.display_address || cluster.location)}`;
        
        const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

        return (
            <div className="w-56 font-sans">
                <img src={cluster.image} alt={cluster.name} className="w-full h-24 object-cover" />
                <div className="p-2 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-gray-800">{cluster.name}</h3>
                        {isAdmin && cluster.is_hidden && (
                            <span className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-yellow-200 text-yellow-800">Hidden</span>
                        )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                        <StarRating rating={cluster.average_rating} />
                        <span className="ml-1">({cluster.review_count})</span>
                    </div>
                    <div className="flex items-start text-xs text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{cluster.display_address || cluster.location}</span>
                    </div>
                    {cluster.timing && (
                        <div className="flex items-center text-xs text-gray-600">
                            <ClockIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                            <span>{cluster.timing}</span>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1 pt-1">
                        {cluster.category.map(cat => (
                            <span key={cat} className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">{cat}</span>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                        <a 
                            href={googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()} 
                            className="popup-gmaps-button flex-1 text-center px-2 py-1.5 bg-gray-500 text-white text-sm font-semibold rounded hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                        >
                            <MapPinIcon className="w-3 h-3" />
                            Location
                        </a>
                        <button data-type="cluster" data-item-id={cluster.id} className="popup-details-button flex-1 text-center px-2 py-1.5 bg-brand-green text-white text-sm font-semibold rounded hover:bg-brand-green-dark transition-colors">Details</button>
                    </div>
                </div>
            </div>
        );
    };

    const EventPopup: React.FC<{ event: AppEvent }> = ({ event }) => {
        const googleMapsUrl = (event.latitude && event.longitude)
            ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.display_address || event.location_name)}`;

        return (
            <div className="w-56 font-sans">
                {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-24 object-cover" />}
                <div className="p-2 space-y-1">
                    <h3 className="font-bold text-base text-gray-800">{event.title}</h3>
                    <div className="flex items-center text-xs text-gray-600">
                        <CalendarDaysIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                        <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <span>Category: <strong>{event.category}</strong></span>
                    </div>
                    {event.organizer && (
                         <div className="flex items-center text-xs text-gray-600">
                            <span>By: <strong>{event.organizer}</strong></span>
                        </div>
                    )}
                    <div className="flex gap-2 mt-2">
                        <a 
                            href={googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()} 
                            className="popup-gmaps-button flex-1 text-center px-2 py-1.5 bg-gray-500 text-white text-sm font-semibold rounded hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                        >
                            <MapPinIcon className="w-3 h-3" />
                            Location
                        </a>
                        <button data-type="event" data-item-id={event.id} className="popup-details-button flex-1 text-center px-2 py-1.5 bg-brand-green text-white text-sm font-semibold rounded hover:bg-brand-green-dark transition-colors">Details</button>
                    </div>
                </div>
            </div>
        );
    };
    
    const getClusterIcon = (cluster: Cluster) => {
        const primaryCategory = cluster.category[0] || 'Default';
        const categoryDef = CLUSTER_CATEGORIES.find(c => c.id === primaryCategory);
        
        const IconComponent = categoryDef ? categoryDef.icon : TourismClusterIcon;
        const iconHtml = ReactDOMServer.renderToString(<IconComponent className="w-5 h-5 text-white" />);
    
        const backgroundColor = CLUSTER_CATEGORY_COLORS[primaryCategory as keyof typeof CLUSTER_CATEGORY_COLORS] || CLUSTER_CATEGORY_COLORS['Default'];

        const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';
        const opacity = isAdmin && cluster.is_hidden ? '0.5' : '1';
    
        return L.divIcon({
            html: `<div style="background-color: ${backgroundColor}; opacity: ${opacity};" class="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md">${iconHtml}</div>`,
            className: 'custom-div-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    };
    
    const getEventIcon = (event: AppEvent) => {
        const IconComponent = EVENT_CATEGORY_ICONS[event.category] || EventsCalendarIcon;
        // The icon component will be placed in a 12x12 div.
        const iconHtml = ReactDOMServer.renderToString(<IconComponent className="w-full h-full text-white" />);
        const EVENT_MARKER_COLOR = '#3498DB'; // Use a consistent blue for all events.

        // Reduced size from 32x32 to 28x28
        const markerHtml = `
            <div style="position: relative; width: 28px; height: 28px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 28 L0 0 L28 0 Z" fill="${EVENT_MARKER_COLOR}" stroke="white" stroke-width="2"/>
                </svg>
                <div style="position: absolute; top: 5px; left: 8px; width: 12px; height: 12px;">
                    ${iconHtml}
                </div>
            </div>`;

        return L.divIcon({
            html: markerHtml,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 28], // Anchor at the tip of the triangle
            popupAnchor: [0, -28] // Popup above the tip
        });
    };


    // Initialize map
    useEffect(() => {
        const mapContainer = mapContainerRef.current;
        if (mapContainer && !mapRef.current) {
            const map = L.map(mapContainer, { center: [2.5, 112.5], zoom: 7, scrollWheelZoom: false });
            mapRef.current = map;
            markersLayerRef.current = L.layerGroup().addTo(map);

            // Use event delegation on the map container for popup buttons. This is more robust
            // than adding listeners inside popupopen, as it avoids stale state closures.
            L.DomEvent.on(map.getContainer(), 'click', (ev: MouseEvent) => {
                const target = ev.target as HTMLElement;
                if (target.classList.contains('popup-details-button') && navigationHandlerRef.current) {
                    const type = target.dataset.type as 'cluster' | 'event';
                    const itemId = target.dataset.itemId;
                    if (type && itemId) {
                        navigationHandlerRef.current(type, itemId);
                    }
                }
            });

            // Enable scroll/pinch zoom only when the map is focused
            map.on('focus', () => {
                map.scrollWheelZoom.enable();
            });
            map.on('blur', () => {
                map.scrollWheelZoom.disable();
            });
        }
    }, []);

    // Update map tiles when theme changes
    useEffect(() => {
        if (!mapRef.current) return;
        const tileUrl = theme === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        mapRef.current.eachLayer((layer: any) => { if (layer instanceof L.TileLayer) mapRef.current.removeLayer(layer); });
        L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap contributors' }).addTo(mapRef.current);
    }, [theme]);
    
    // Update markers when filters or data change
    useEffect(() => {
        if (!markersLayerRef.current) return;
        markersLayerRef.current.clearLayers();

        if (showClusters) {
            clusters
                .filter(cluster => {
                    const matchesCategory = cluster.category.some(cat => selectedCategories.has(cat));
                    if (!matchesCategory) return false;

                    const locationString = `${cluster.location || ''} ${cluster.display_address || ''}`.toLowerCase();
                    const matchesDistrict = selectedDistrict === 'All' || locationString.includes(selectedDistrict.toLowerCase());
                    return matchesDistrict;
                })
                .forEach(cluster => {
                    if (cluster.latitude && cluster.longitude) {
                        const popupContent = ReactDOMServer.renderToString(<ClusterPopup cluster={cluster} />);
                        const clusterIcon = getClusterIcon(cluster);
                        const marker = L.marker([cluster.latitude, cluster.longitude], { icon: clusterIcon }).bindPopup(popupContent, popupOptionsRef.current);
                        markersLayerRef.current.addLayer(marker);
                    }
                });
        }

        if (showEvents) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to the start of the day for date comparison

            events
                .filter(event => {
                    const isUpcoming = new Date(event.end_date) >= today;
                    if (!isUpcoming) return false;

                    const locationString = `${event.location_name || ''} ${event.display_address || ''}`.toLowerCase();
                    const matchesDistrict = selectedDistrict === 'All' || locationString.includes(selectedDistrict.toLowerCase());
                    return matchesDistrict;
                })
                .forEach(event => {
                    if (event.latitude && event.longitude) {
                        const eventIcon = getEventIcon(event);
                        const popupContent = ReactDOMServer.renderToString(<EventPopup event={event} />);
                        const marker = L.marker([event.latitude, event.longitude], { icon: eventIcon }).bindPopup(popupContent, popupOptionsRef.current);
                        markersLayerRef.current.addLayer(marker);
                    }
                });
        }
    }, [clusters, events, showClusters, showEvents, selectedCategories, selectedDistrict, currentUser]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Tourism Mapping</h2>
                <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">
                    An interactive map showcasing tourism clusters and events across Sarawak.
                </p>
            </div>
            <Card ref={filterCardRef}>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium mr-2">Show on map:</span>
                         <button onClick={() => setShowClusters(p => !p)} className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-2 transition-colors ${showClusters ? 'bg-brand-green dark:bg-brand-dark-green text-white' : 'bg-neutral-200-light dark:bg-neutral-700-dark'}`}><TourismClusterIcon className="w-4 h-4" /> Clusters</button>
                         <button onClick={() => setShowEvents(p => !p)} className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-2 transition-colors ${showEvents ? 'bg-brand-green dark:bg-brand-dark-green text-white' : 'bg-neutral-200-light dark:bg-neutral-700-dark'}`}><EventsCalendarIcon className="w-4 h-4" /> Events</button>
                         <div className="flex-grow sm:flex-grow-0 sm:w-64">
                            <Select
                                options={SARAWAK_DISTRICTS.map(d => ({ value: d, label: d }))}
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                aria-label="Filter by district"
                            />
                         </div>
                    </div>

                    {showClusters && (
                        <div className="pt-4 border-t border-neutral-200-light dark:border-neutral-700-dark animate-modalShow">
                            <h4 className="text-sm font-semibold mb-2">Filter Cluster Categories:</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                                {CLUSTER_CATEGORIES.map(category => (
                                    <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={selectedCategories.has(category.id)} onChange={() => handleCategoryToggle(category.id)} className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                                        <category.icon className="w-4 h-4 text-brand-text-secondary-light dark:text-brand-text-secondary" />
                                        <span className="text-sm">{category.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2 text-right">
                                <button onClick={handleSelectAllCategories} className="text-xs font-semibold text-brand-green dark:text-brand-dark-green-text hover:underline">Select All</button>
                                <span className="mx-2 text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">|</span>
                                <button onClick={handleDeselectAllCategories} className="text-xs font-semibold text-brand-green dark:text-brand-dark-green-text hover:underline">Deselect All</button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="relative h-[65vh] w-full rounded-lg shadow-lg overflow-hidden border border-neutral-300-light dark:border-neutral-700-dark z-0">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center">
                        <Spinner className="w-8 h-8 text-white" />
                        <span className="ml-3 text-white">Loading map data...</span>
                    </div>
                )}
                <div ref={mapContainerRef} className="h-full w-full focus:outline-none focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-dark-green" tabIndex={0} />
            </div>
        </div>
    );
};

export default TourismMappingView;