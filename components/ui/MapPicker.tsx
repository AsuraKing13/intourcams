import React, { useState, useEffect, useRef, useCallback } from 'react';
import Input from './Input.tsx';
import Spinner from './Spinner.tsx';
import { SearchIcon, XMarkIcon } from '../../constants.tsx';

// Declare Leaflet in the global scope to satisfy TypeScript
declare const L: any;

interface MapPickerProps {
    initialPosition: { lat: number; lng: number } | null;
    onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
    mapContainerClassName?: string;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

const MapPicker: React.FC<MapPickerProps> = ({ initialPosition, onLocationChange, mapContainerClassName = 'h-96' }) => {
    const mapRef = useRef<any>(null);
    const selectedMarkerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimeoutRef = useRef<number | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (selectedMarkerRef.current) {
            selectedMarkerRef.current.remove();
            selectedMarkerRef.current = null;
        }
        
        setError(null);

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=my&limit=1`);
            if (!response.ok) throw new Error('Network response was not ok.');
            
            const data: NominatimResult[] = await response.json();

            if (data && data.length > 0) {
                const topResult = data[0];
                const lat = parseFloat(topResult.lat);
                const lng = parseFloat(topResult.lon);
                
                if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    setError("Invalid location data received. Please try another search term.");
                    return;
                }
                
                if (mapRef.current) {
                    const latLng = L.latLng(lat, lng);
                    selectedMarkerRef.current = L.marker(latLng).addTo(mapRef.current);
                    mapRef.current.setView(latLng, 15);
                }

                onLocationChange({ lat, lng, address: topResult.display_name || 'Selected Location' });
            } else {
                setError("No results found for your search term.");
            }

        } catch (err) {
            setError('Failed to fetch search results.');
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    }, [onLocationChange]);

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        const trimmedSearchTerm = searchTerm.trim();
        if (trimmedSearchTerm) {
            setIsSearching(true);
            setError(null);
            debounceTimeoutRef.current = window.setTimeout(() => {
                performSearch(trimmedSearchTerm);
            }, 500); // 500ms debounce
        } else {
            setIsSearching(false);
            setError(null);
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm, performSearch]);

    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        setError(null);
        if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setError("Invalid coordinates selected on the map.");
            return;
        }
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (!response.ok) throw new Error('Failed to reverse geocode.');
            const data = await response.json();

            setSearchTerm(''); // Clear search term on map click
            
            if (mapRef.current) {
                const latLng = L.latLng(lat, lng);
                if (selectedMarkerRef.current) {
                    selectedMarkerRef.current.remove();
                    selectedMarkerRef.current = null;
                }
                selectedMarkerRef.current = L.marker(latLng).addTo(mapRef.current);
            }
            onLocationChange({ lat, lng, address: data.display_name || 'Unknown location' });

        } catch (err) {
            setError('Could not get address for this location.');
            console.error(err);
        }
    }, [onLocationChange]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const center = initialPosition ? [initialPosition.lat, initialPosition.lng] : [2.5, 112.5];
        const zoom = initialPosition ? 13 : 6;

        const map = L.map(mapContainerRef.current).setView(center, zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('click', (e: any) => {
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;

        if (initialPosition) {
            selectedMarkerRef.current = L.marker(center).addTo(map);
        }

        return () => {
            if (mapRef.current) {
              mapRef.current.remove();
              mapRef.current = null;
            }
        };
    }, [initialPosition, reverseGeocode]);

    return (
        <div className="space-y-2">
            <div className="relative z-[1001] mb-2">
                <Input
                    icon={<SearchIcon className="w-5 h-5" />}
                    placeholder="Search for a location..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pr-10"
                />
                {isSearching ? (
                     <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Spinner className="h-5 w-5 text-gray-400" />
                    </div>
                ) : searchTerm && (
                    <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        aria-label="Clear search"
                    >
                        <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                )}
            </div>

            <div ref={mapContainerRef} className={`${mapContainerClassName} rounded-lg z-0`}></div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default MapPicker;