import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import Modal from '../ui/Modal.tsx';
import Input from '../ui/Input.tsx';
import FileUpload from '../ui/FileUpload.tsx';
import Select from '../ui/Select.tsx';
import { useAppContext } from '../AppContext.tsx';
import { AppEvent, PublicHoliday, AddEventData } from '../../types.ts';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { PlusIcon, PencilIcon, TrashIcon, EventsCalendarIcon, CalendarDaysIcon, SearchIcon } from '../../constants.tsx';
import { useToast } from '../ToastContext.tsx';
import Spinner from '../ui/Spinner.tsx';
import MapPicker from '../ui/MapPicker.tsx';

// Generic type for the hover tooltip item
type HoveredItem = {
    item: AppEvent | PublicHoliday;
    type: 'event' | 'holiday';
    top: number;
    left: number;
    right: number;
}

const ADMIN_COLOR_CHOICES = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#6366f1', '#d946ef']; // red, orange, lime, cyan, indigo, fuchsia
const TOURISM_PLAYER_EVENT_COLOR = '#3498DB'; // A nice, distinct blue
const DEFAULT_EVENT_COLOR = '#8e44ad'; // The original purple

const EventForm: React.FC<{ event?: AppEvent; onClose: () => void; initialDate?: string | null; }> = ({ event, onClose, initialDate }) => {
    const { addEvent, updateEvent, uploadEventImage, currentUser } = useAppContext();
    const { showToast } = useToast();
    const isAdminOrEditor = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

    const eventCategoryOptions = [
        { value: 'Culture', label: 'Culture' },
        { value: 'Adventure', label: 'Adventure' },
        { value: 'Nature', label: 'Nature' },
        { value: 'Festival', label: 'Festival' },
        { value: 'Food', label: 'Food' },
        { value: 'Community', label: 'Community' },
        { value: 'Other', label: 'Other' },
    ];
    
    const [formData, setFormData] = useState<AddEventData>({
        title: event?.title || '',
        description: event?.description || '',
        start_date: event?.start_date.substring(0, 10) || initialDate || '',
        end_date: event?.end_date.substring(0, 10) || initialDate || '',
        location_name: event?.location_name || '',
        category: event?.category || 'Culture',
        organizer: event?.organizer || '',
        image_url: event?.image_url || null,
        marker_color: event?.marker_color || (isAdminOrEditor ? ADMIN_COLOR_CHOICES[0] : DEFAULT_EVENT_COLOR),
        contact_info: event?.contact_info || '',
        latitude: event?.latitude || null,
        longitude: event?.longitude || null,
        display_address: event?.display_address || null,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [useCustomAddress, setUseCustomAddress] = useState(false);

    useEffect(() => {
        if (event?.location_name && event?.location_name !== event?.display_address) {
            setUseCustomAddress(true);
        } else {
            setUseCustomAddress(false);
        }
    }, [event]);

    const handleLocationChange = useCallback((location: { lat: number, lng: number, address: string }) => {
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            display_address: location.address,
            // If not using a custom address, update the primary location_name field as well
            ...(!useCustomAddress && { location_name: location.address })
        }));
    }, [useCustomAddress]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalLocationName = useCustomAddress ? formData.location_name : formData.display_address;
        if (!formData.title || !formData.start_date || !formData.end_date || !formData.description || !finalLocationName) {
            showToast("Please fill in all required fields: Title, Dates, Location, and Description.", "error");
            return;
        }

        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            showToast("End date cannot be before the start date.", "error");
            return;
        }
        
        setIsSubmitting(true);
        try {
            let finalImageUrl = formData.image_url;
            if (imageFile) {
                const oldImageUrl = event ? formData.image_url : undefined;
                finalImageUrl = await uploadEventImage(imageFile, oldImageUrl);
            }

            let finalMarkerColor = formData.marker_color;
            if (currentUser?.role === 'Tourism Player') {
                finalMarkerColor = TOURISM_PLAYER_EVENT_COLOR;
            }

            const payload: AddEventData = {
                ...formData,
                location_name: finalLocationName!,
                image_url: finalImageUrl,
                marker_color: finalMarkerColor,
                start_date: new Date(formData.start_date + 'T00:00:00.000Z').toISOString(),
                end_date: new Date(formData.end_date + 'T00:00:00.000Z').toISOString(),
            };
            
            if (event) { // Editing existing event
                await updateEvent(event.id, payload);
            } else { // Adding new event
                await addEvent(payload);
            }
            onClose();
        } catch (error) {
            console.error("Failed to submit event:", error);
            // Toast is already shown in the context function
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Event Title *" name="title" value={formData.title} onChange={handleChange} required disabled={isSubmitting} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Start Date *" name="start_date" type="date" value={formData.start_date} onChange={handleChange} required disabled={isSubmitting} />
                <Input label="End Date *" name="end_date" type="date" value={formData.end_date} onChange={handleChange} required disabled={isSubmitting} min={formData.start_date} />
            </div>

            <div>
                <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Location *</label>
                <MapPicker
                    initialPosition={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                    onLocationChange={handleLocationChange}
                    mapContainerClassName="h-64"
                />
            </div>

            <div className="flex items-center">
                <input 
                    type="checkbox" 
                    id="eventUseCustomAddress" 
                    checked={useCustomAddress} 
                    onChange={(e) => setUseCustomAddress(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                />
                <label htmlFor="eventUseCustomAddress" className="ml-2 text-sm text-brand-text-light dark:text-brand-text">
                    Use a custom display address
                </label>
            </div>

            {useCustomAddress ? (
                <Input 
                    label="Custom Location Name / Address *" 
                    name="location_name" 
                    value={formData.location_name} 
                    onChange={handleChange} 
                    required 
                    disabled={isSubmitting}
                    placeholder="e.g. Borneo Convention Centre Kuching"
                />
            ) : (
                 <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Map Address</label>
                    <p className="p-2.5 rounded-lg bg-neutral-100-light dark:bg-neutral-700-dark text-brand-text-secondary-light dark:text-brand-text-secondary text-sm">
                        {formData.display_address || "Click on the map to set a location."}
                    </p>
                </div>
            )}
            
            <div>
                <label htmlFor="eventDescription" className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Description *</label>
                <textarea id="eventDescription" name="description" value={formData.description} onChange={handleChange} required disabled={isSubmitting} rows={4} className="w-full rounded-lg p-2.5 outline-none transition-colors bg-input-bg-light dark:bg-input-bg border border-neutral-300-light dark:border-neutral-600-dark text-brand-text-light dark:text-brand-text focus:ring-brand-green dark:focus:ring-brand-dark-green focus:border-brand-green dark:focus:border-brand-dark-green" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Organizer" name="organizer" value={formData.organizer} onChange={handleChange} disabled={isSubmitting} />
              <Input label="Contact Information" name="contact_info" placeholder="Phone, email, or website" value={formData.contact_info} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <Select
                label="Category *"
                name="category"
                options={eventCategoryOptions}
                value={formData.category}
                onChange={handleChange}
                required
                disabled={isSubmitting}
            />

            {isAdminOrEditor && (
                 <div>
                    <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Map Marker Color</label>
                    <div className="flex flex-wrap gap-2">
                        {ADMIN_COLOR_CHOICES.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, marker_color: color }))}
                            className={`w-8 h-8 rounded-full border-2 transition-all
                                        ${formData.marker_color === color 
                                            ? 'border-brand-green dark:border-brand-dark-green ring-2 ring-offset-2 ring-brand-green dark:ring-brand-dark-green ring-offset-card-bg-light dark:ring-offset-card-bg' 
                                            : 'border-transparent hover:border-neutral-400'
                                        }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                        />
                        ))}
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">Event Image</label>
                {formData.image_url && !imageFile && <img src={formData.image_url} alt="Current event" className="w-full h-32 object-cover rounded-md mb-2" />}
                <FileUpload onFileSelect={setImageFile} disabled={isSubmitting} acceptedTypes="image/jpeg,image/png,image/webp" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>{event ? 'Save Changes' : 'Add Event'}</Button>
            </div>
        </form>
    );
};


const EventsCalendarView: React.FC = () => {
    const { events, isLoadingEvents, holidays, isLoadingHolidays, currentUser, deleteEvent } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
    const [modalMode, setModalMode] = useState<'details' | 'form' | 'closed'>('closed');
    const [newEventInitialDate, setNewEventInitialDate] = useState<string | null>(null);
    const [filterDistrict, setFilterDistrict] = useState('All');
    const [eventListFilter, setEventListFilter] = useState<'upcoming' | 'past'>('upcoming');
    const [includeHolidays, setIncludeHolidays] = useState(true);
    const [visibleItemsCount, setVisibleItemsCount] = useState(10);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);
    const [hoverTimeoutId, setHoverTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDayData, setSelectedDayData] = useState<{ day: number; events: AppEvent[]; holiday: PublicHoliday | null } | null>(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState<'calendar' | 'schedule'>('calendar');

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const SARAWAK_DISTRICTS = [ 'All', 'Kuching', 'Miri', 'Sibu', 'Bintulu', 'Limbang', 'Sarikei', 'Sri Aman', 'Kapit', 'Betong', 'Mukah', 'Serian', 'Samarahan' ];
    const districtOptions = SARAWAK_DISTRICTS.map(d => ({ value: d, label: d }));
    
    const canAddEvent = useMemo(() => {
        if (!currentUser?.role) return false;
        const userRole = currentUser.role.trim();
        return ['Admin', 'Editor', 'Tourism Player'].includes(userRole);
    }, [currentUser]);

    useEffect(() => {
        const initialSearch = sessionStorage.getItem('initialEventSearch');
        if (initialSearch) {
            setSearchTerm(initialSearch);
            sessionStorage.removeItem('initialEventSearch');
        }
    }, []);

    const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);
    
    const holidaysForYear = useMemo(() => {
        return holidays.filter(h => h.date.startsWith(String(currentYear)));
    }, [holidays, currentYear]);

    const isCalendarLoading = isLoadingEvents || isLoadingHolidays;

    const filteredEventsForCalendar = useMemo(() => {
        return events.filter(event => {
            const locationString = `${event.location_name || ''} ${event.display_address || ''}`.toLowerCase();
            const matchesDistrict = filterDistrict === 'All' || locationString.includes(filterDistrict.toLowerCase());
            return matchesDistrict;
        });
    }, [events, filterDistrict]);
    
    const combinedListableItems = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const term = searchTerm.toLowerCase();
    
        const districtFilteredEvents = events.filter(event => {
            const locationString = `${event.location_name || ''} ${event.display_address || ''}`.toLowerCase();
            const matchesDistrict = filterDistrict === 'All' || locationString.includes(filterDistrict.toLowerCase());

            const matchesSearch = !term ||
                (event.title || '').toLowerCase().includes(term) ||
                (event.description || '').toLowerCase().includes(term) ||
                (event.display_address || '').toLowerCase().includes(term) ||
                (event.location_name || '').toLowerCase().includes(term) ||
                (event.category || '').toLowerCase().includes(term);

            return matchesDistrict && matchesSearch;
        });
    
        const eventItems = (eventListFilter === 'upcoming'
            ? districtFilteredEvents
                .filter(event => new Date(event.end_date) >= now)
                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            : districtFilteredEvents
                .filter(event => new Date(event.end_date) < now)
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        ).map(item => ({ type: 'event' as const, item, date: new Date(item.start_date) }));
    
        const holidayItems = includeHolidays && !term // Do not show holidays if searching
            ? holidays
                .filter(h => {
                    const holidayDate = new Date(h.date + 'T00:00:00');
                    return eventListFilter === 'upcoming' ? holidayDate >= now : holidayDate < now;
                })
                .map(item => ({ type: 'holiday' as const, item, date: new Date(item.date + 'T00:00:00') }))
            : [];
    
        const combined = [...eventItems, ...holidayItems];
    
        combined.sort((a, b) => {
            const dateA = a.date.getTime();
            const dateB = b.date.getTime();
            if (dateA !== dateB) {
                return eventListFilter === 'upcoming' ? dateA - dateB : dateB - a.date.getTime();
            }
            if (a.type === 'holiday' && b.type === 'event') return -1;
            if (a.type === 'event' && b.type === 'holiday') return 1;
            return 0;
        });
    
        return combined;
    }, [events, holidays, filterDistrict, eventListFilter, includeHolidays, searchTerm]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid: ({ day: number; events: AppEvent[]; holiday: PublicHoliday | null } | null)[] = [];
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push(null);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const holiday = includeHolidays ? holidaysForYear.find(h => h.date === dateStr) : null;
            const dayEvents = filteredEventsForCalendar.filter(e => {
                const startDate = new Date(e.start_date);
                const endDate = new Date(e.end_date);
                startDate.setHours(0,0,0,0);
                endDate.setHours(0,0,0,0);
                return date >= startDate && date <= endDate;
            });
            grid.push({ day, events: dayEvents, holiday: holiday || null });
        }
        
        return grid;
    }, [currentDate, filteredEventsForCalendar, holidaysForYear, includeHolidays]);
    
    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const handleEventClick = (event: AppEvent) => {
        setSelectedEvent(event);
        setModalMode('details');
    };
    
    const handleOpenNewEventForm = (date?: string) => {
        setSelectedEvent(null);
        setNewEventInitialDate(date || null);
        setModalMode('form');
    };
    
    const handleEditEvent = () => {
        setModalMode('form');
    };
    
    const handleCloseModal = () => {
        setModalMode('closed');
        setSelectedEvent(null);
        setNewEventInitialDate(null);
    };

    const handleConfirmDelete = async () => {
        if (!selectedEvent) return;
    
        setIsDeleting(true);
        const success = await deleteEvent(selectedEvent.id);
        setIsDeleting(false);
    
        setIsDeleteConfirmOpen(false);
        if (success) {
            handleCloseModal();
        }
    };

    const handleLoadMore = () => {
        setVisibleItemsCount(prev => prev + 10);
    };

    const handleEventMouseEnter = (e: React.MouseEvent, event: AppEvent) => {
        if (hoverTimeoutId) clearTimeout(hoverTimeoutId);
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({
            item: event,
            type: 'event',
            top: rect.bottom,
            left: rect.left,
            right: rect.right,
        });
    };

    const handleHolidayMouseEnter = (e: React.MouseEvent, holiday: PublicHoliday) => {
        if (hoverTimeoutId) clearTimeout(hoverTimeoutId);
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({
            item: holiday,
            type: 'holiday',
            top: rect.bottom,
            left: rect.left,
            right: rect.right,
        });
    };

    const handleMouseLeave = () => {
        const timeoutId = setTimeout(() => {
            setHoveredItem(null);
        }, 200);
        setHoverTimeoutId(timeoutId);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-brand-text-light dark:text-brand-text mb-1">Events Calendar</h2>
                    <p className="text-brand-text-secondary-light dark:text-brand-text-secondary">Stay updated with the latest events and public holidays in Sarawak.</p>
                </div>
                {canAddEvent && (
                    <Button variant="primary" leftIcon={<PlusIcon className="w-5 h-5"/>} onClick={() => handleOpenNewEventForm()}>Add New Event</Button>
                )}
            </div>

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden mb-4">
                <div className="flex border-b border-neutral-300-light dark:border-neutral-700-dark">
                    <button
                        onClick={() => setActiveMobileTab('calendar')}
                        className={`py-2 px-4 text-sm font-medium ${activeMobileTab === 'calendar' ? 'border-b-2 border-brand-green text-brand-green-text dark:text-brand-dark-green-text' : 'text-brand-text-secondary-light dark:text-brand-text-secondary'}`}
                    >
                        Calendar View
                    </button>
                    <button
                        onClick={() => setActiveMobileTab('schedule')}
                        className={`py-2 px-4 text-sm font-medium ${activeMobileTab === 'schedule' ? 'border-b-2 border-brand-green text-brand-green-text dark:text-brand-dark-green-text' : 'text-brand-text-secondary-light dark:text-brand-text-secondary'}`}
                    >
                        Schedule List
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
                <div className={`lg:col-span-2 ${activeMobileTab === 'calendar' ? 'block' : 'hidden'} lg:block`}>
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <Button variant="ghost" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeftIcon className="w-6 h-6"/></Button>
                            <h3 className="text-xl font-semibold text-brand-green-text dark:text-brand-dark-green-text">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                            <Button variant="ghost" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRightIcon className="w-6 h-6"/></Button>
                        </div>

                        {isCalendarLoading ? (
                            <div className="text-center py-10"><Spinner /></div>
                        ) : (
                            <div className="relative">
                                <div className="grid grid-cols-7 gap-px bg-neutral-200-light dark:bg-neutral-700-dark border border-neutral-200-light dark:border-neutral-700-dark">
                                    {daysOfWeek.map(day => (
                                        <div key={day} className="text-center py-2 font-semibold text-sm text-brand-text-secondary-light dark:text-brand-text-secondary bg-card-bg-light dark:bg-card-bg">{day}</div>
                                    ))}
                                    {calendarGrid.map((dayInfo, index) => {
                                        const canCreateOnDate = dayInfo && canAddEvent;
                                        const dayDateString = canCreateOnDate ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayInfo.day).padStart(2, '0')}` : '';
                                        const eventWithImage = dayInfo?.events.find(e => e.image_url);
                                        const cellStyle = eventWithImage ? { backgroundImage: `url(${eventWithImage.image_url})` } : {};
                                        const cellClasses = `relative group p-1 sm:p-2 h-24 sm:h-32 bg-card-bg-light dark:bg-card-bg bg-cover bg-center transition-all duration-300 overflow-hidden sm:overflow-y-auto custom-scrollbar`;
                                        const hasItems = dayInfo && (dayInfo.events.length > 0 || !!dayInfo.holiday);

                                        const handleDayClickMobile = () => {
                                            if (dayInfo && hasItems) {
                                                setSelectedDayData(dayInfo);
                                                setIsDayModalOpen(true);
                                            }
                                        };

                                        return (
                                            <div key={index} style={cellStyle} className={cellClasses}>
                                                {eventWithImage && (
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 group-hover:from-black/60"></div>
                                                )}
                                                
                                                <div className="relative z-10 flex flex-col h-full">
                                                    {dayInfo && (
                                                        <>
                                                            <div className="flex justify-between items-start">
                                                                <span className={`text-sm font-semibold ${eventWithImage ? 'text-white text-shadow-md' : 'text-brand-text-light dark:text-brand-text'}`}>
                                                                    {dayInfo.day}
                                                                </span>
                                                                {canCreateOnDate && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenNewEventForm(dayDateString); }}
                                                                        className="p-1 rounded-full bg-green-500 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none hidden sm:block"
                                                                        aria-label={`Add event on ${monthNames[currentDate.getMonth()]} ${dayInfo.day}`}
                                                                        title={`Add event on ${monthNames[currentDate.getMonth()]} ${dayInfo.day}`}
                                                                    >
                                                                        <PlusIcon className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {/* DESKTOP VIEW: Full event titles */}
                                                            <div className="hidden sm:block mt-1 space-y-1 flex-grow overflow-hidden">
                                                                {dayInfo.holiday && (
                                                                    <button 
                                                                        key={dayInfo.holiday.name} 
                                                                        className={`w-full text-left p-1 text-xs rounded-md truncate transition-colors ${
                                                                            eventWithImage 
                                                                            ? 'bg-red-600/70 text-white hover:bg-red-500/80' 
                                                                            : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/80'
                                                                        }`}
                                                                        onMouseEnter={(e) => handleHolidayMouseEnter(e, dayInfo.holiday!)}
                                                                        onMouseLeave={handleMouseLeave}
                                                                        aria-label={dayInfo.holiday.name}
                                                                    >
                                                                        {dayInfo.holiday.name}
                                                                    </button>
                                                                )}
                                                                {dayInfo.events.map(event => (
                                                                    <button key={event.id} onClick={(e) => { e.stopPropagation(); handleEventClick(event); }} 
                                                                        className="w-full text-left p-1 text-xs rounded-md text-white hover:opacity-80 truncate"
                                                                        style={{ backgroundColor: eventWithImage ? 'rgba(255, 255, 255, 0.15)' : (event.marker_color || DEFAULT_EVENT_COLOR) }}
                                                                        onMouseEnter={(e) => handleEventMouseEnter(e, event)}
                                                                        onMouseLeave={handleMouseLeave}
                                                                        aria-label={event.title}
                                                                    >
                                                                        {event.title}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {/* MOBILE VIEW: Event indicators and click area */}
                                                            <div className="sm:hidden flex-grow cursor-pointer -m-1 p-1" onClick={hasItems ? handleDayClickMobile : undefined}>
                                                                <div className="flex flex-wrap gap-1 mt-1 items-start">
                                                                    {dayInfo.holiday && (
                                                                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title={dayInfo.holiday.name} />
                                                                    )}
                                                                    {dayInfo.events.slice(0, 4).map(event => (
                                                                        <div
                                                                            key={event.id}
                                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                                            style={{ backgroundColor: event.marker_color || DEFAULT_EVENT_COLOR }}
                                                                            title={event.title}
                                                                        />
                                                                    ))}
                                                                    {dayInfo.events.length > 4 && (
                                                                        <div className="w-2 h-2 bg-neutral-400 rounded-full flex-shrink-0" title={`${dayInfo.events.length - 4} more events`} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
                {/* Schedule List View */}
                <div className={`lg:col-span-1 ${activeMobileTab === 'schedule' ? 'block' : 'hidden'} lg:block`}>
                     <Card title="Schedule">
                        <div className="space-y-4 mb-4 pb-4 border-b border-neutral-200-light dark:border-neutral-700-dark">
                            <Input
                                placeholder="Search events by title, location..."
                                icon={<SearchIcon className="w-5 h-5" />}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Select label="Filter by District" options={districtOptions} value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} />
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="includeHolidays"
                                    checked={includeHolidays}
                                    onChange={(e) => setIncludeHolidays(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                                />
                                <label htmlFor="includeHolidays" className="ml-2 text-sm text-brand-text-light dark:text-brand-text">
                                    Include Public Holidays
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <Button variant={eventListFilter === 'upcoming' ? 'primary' : 'ghost'} size="sm" onClick={() => { setEventListFilter('upcoming'); setVisibleItemsCount(10); }}>Upcoming</Button>
                            <Button variant={eventListFilter === 'past' ? 'primary' : 'ghost'} size="sm" onClick={() => { setEventListFilter('past'); setVisibleItemsCount(10); }}>Past</Button>
                        </div>
                        {isCalendarLoading ? (
                            <div className="text-center py-10"><Spinner /></div>
                        ) : combinedListableItems.length > 0 ? (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {combinedListableItems.slice(0, visibleItemsCount).map((entry, index) => {
                                    if (entry.type === 'event') {
                                        const event = entry.item;
                                        return (
                                            <div key={`event-${event.id}-${index}`} className="p-3 rounded-md bg-neutral-100-light dark:bg-neutral-700-dark cursor-pointer hover:bg-neutral-200-light dark:hover:bg-neutral-600-dark" onClick={() => handleEventClick(event)}>
                                                <p className="font-semibold text-brand-text-light dark:text-brand-text">{event.title}</p>
                                                <p className="text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                                                    {new Date(event.start_date).toLocaleDateString([], { dateStyle: 'medium' })}
                                                </p>
                                                <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1 truncate">{event.display_address || event.location_name}</p>
                                            </div>
                                        );
                                    } else {
                                        const holiday = entry.item;
                                        return (
                                            <div key={`holiday-${holiday.name}-${index}`} className="p-3 rounded-md bg-red-100/50 dark:bg-red-900/30 flex items-center gap-4">
                                                <CalendarDaysIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-red-800 dark:text-red-200">{holiday.name}</p>
                                                    <p className="text-sm text-red-700 dark:text-red-300">
                                                        {new Date(holiday.date + 'T00:00:00').toLocaleDateString([], { dateStyle: 'medium' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                                {visibleItemsCount < combinedListableItems.length && (
                                    <div className="text-center mt-4">
                                        <Button variant="secondary" onClick={handleLoadMore}>Load More</Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-4">
                                No {eventListFilter} items match your filters.
                            </p>
                        )}
                    </Card>
                </div>
            </div>
            
            {selectedDayData && (
                <Modal
                    isOpen={isDayModalOpen}
                    onClose={() => setIsDayModalOpen(false)}
                    title={`${monthNames[currentDate.getMonth()]} ${selectedDayData.day}, ${currentDate.getFullYear()}`}
                    size="md"
                >
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {selectedDayData.holiday && (
                            <div className="p-3 rounded-md bg-red-100/50 dark:bg-red-900/30 flex items-center gap-4">
                                <CalendarDaysIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-red-800 dark:text-red-200">{selectedDayData.holiday.name}</p>
                                    <p className="text-sm text-red-700 dark:text-red-300">Public Holiday</p>
                                </div>
                            </div>
                        )}
                        {selectedDayData.events.length > 0 ? (
                            selectedDayData.events.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => {
                                        setIsDayModalOpen(false);
                                        handleEventClick(event);
                                    }}
                                    className="w-full text-left p-3 rounded-md bg-neutral-100-light dark:bg-neutral-700-dark hover:bg-neutral-200-light dark:hover:bg-neutral-600-dark transition-colors flex items-start gap-3"
                                >
                                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.marker_color || DEFAULT_EVENT_COLOR }} />
                                    <div>
                                        <p className="font-semibold text-brand-text-light dark:text-brand-text">{event.title}</p>
                                        <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1 truncate">{event.display_address || event.location_name}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            !selectedDayData.holiday && <p className="text-center text-brand-text-secondary-light dark:text-brand-text-secondary py-4">No events scheduled for this day.</p>
                        )}
                    </div>
                </Modal>
            )}

            <Modal 
              isOpen={modalMode !== 'closed'} 
              onClose={handleCloseModal} 
              title={
                modalMode === 'details' && selectedEvent
                  ? selectedEvent.title
                  : (selectedEvent ? "Edit Event" : "Add New Event")
              } 
              size={modalMode === 'form' ? 'xl' : 'lg'}
            >
              {modalMode === 'form' ? (
                <EventForm 
                    event={selectedEvent || undefined} 
                    onClose={handleCloseModal}
                    initialDate={newEventInitialDate}
                />
              ) : modalMode === 'details' && selectedEvent ? (
                <div className="space-y-4">
                  {selectedEvent.image_url && <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-48 object-cover rounded-md" />}
                  <p className="text-brand-text-light dark:text-brand-text whitespace-pre-wrap">{selectedEvent.description}</p>
                  <div className="text-sm space-y-1 text-brand-text-secondary-light dark:text-brand-text-secondary">
                      <p><strong>From:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()}</p>
                      <p><strong>To:</strong> {new Date(selectedEvent.end_date).toLocaleDateString()}</p>
                      <p><strong>Location:</strong> {selectedEvent.display_address || selectedEvent.location_name}</p>
                      <p><strong>Organizer:</strong> {selectedEvent.organizer}</p>
                      {selectedEvent.contact_info && <p><strong>Contact:</strong> {selectedEvent.contact_info}</p>}
                      <p><strong>Category:</strong> {selectedEvent.category}</p>
                  </div>
                  {currentUser && selectedEvent && (['Admin', 'Editor'].includes(currentUser.role) || selectedEvent.created_by === currentUser.id) ? (
                       <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200-light dark:border-neutral-600-dark">
                          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                          <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(true)} className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white dark:text-red-400 dark:border-red-400 dark:hover:bg-red-500 dark:hover:text-white" leftIcon={<TrashIcon className="w-4 h-4" />}>Delete</Button>
                          <Button variant="primary" onClick={handleEditEvent} leftIcon={<PencilIcon className="w-4 h-4" />}>Edit</Button>
                      </div>
                  ) : (
                       <div className="flex justify-end pt-4 border-t border-neutral-200-light dark:border-neutral-600-dark">
                          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                      </div>
                  )}
                </div>
              ) : null}
            </Modal>

            {selectedEvent && (
                <Modal 
                    isOpen={isDeleteConfirmOpen} 
                    onClose={() => setIsDeleteConfirmOpen(false)}
                    title="Confirm Deletion"
                    size="sm"
                >
                    <p className="text-brand-text-light dark:text-brand-text">
                        Are you sure you want to delete the event <span className="font-semibold">{selectedEvent.title}</span>?
                    </p>
                    <p className="text-sm text-red-500 dark:text-red-400 mt-2">This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3 pt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button 
                            type="button" 
                            variant="primary" 
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500" 
                            onClick={handleConfirmDelete}
                            isLoading={isDeleting}
                        >
                            Delete Event
                        </Button>
                    </div>
                </Modal>
            )}

            {hoveredItem && (
                <div
                    className="fixed z-50 w-64 rounded-lg shadow-xl bg-card-bg-light dark:bg-card-bg border border-neutral-300-light dark:border-neutral-700-dark animate-modalShow overflow-hidden"
                    style={{
                        top: `${hoveredItem.top + 5}px`,
                        left: hoveredItem.left > window.innerWidth / 2 ? 'auto' : `${hoveredItem.left}px`,
                        right: hoveredItem.left > window.innerWidth / 2 ? `${window.innerWidth - hoveredItem.right}px` : 'auto',
                    }}
                    onMouseEnter={() => {
                        if (hoverTimeoutId) {
                            clearTimeout(hoverTimeoutId);
                            setHoverTimeoutId(null);
                        }
                    }}
                    onMouseLeave={() => {
                        setHoveredItem(null);
                    }}
                >
                    {hoveredItem.type === 'event' ? (
                        (() => {
                            const event = hoveredItem.item as AppEvent;
                            return (
                                <>
                                    <div className="h-32 bg-neutral-200-light dark:bg-neutral-800-dark flex items-center justify-center">
                                        {event.image_url ? (
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <EventsCalendarIcon className="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-bold text-brand-green-text dark:text-brand-dark-green-text truncate">{event.title}</h4>
                                        <div className="mt-2 space-y-1 text-xs text-brand-text-secondary-light dark:text-brand-text-secondary">
                                            <div className="flex items-center">
                                                <EventsCalendarIcon className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                                <span>
                                                    {new Date(event.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    {' - '}
                                                    {new Date(event.end_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            {(event.display_address || event.location_name) && (
                                                <div className="flex items-start">
                                                    <span className="line-clamp-2">{event.display_address || event.location_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-2 bg-neutral-100-light dark:bg-neutral-800-dark/50 border-t border-neutral-200-light dark:border-neutral-700-dark">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                handleEventClick(event);
                                                setHoveredItem(null);
                                            }}
                                        >
                                            See More Details
                                        </Button>
                                    </div>
                                </>
                            );
                        })()
                    ) : (
                        (() => {
                            const holiday = hoveredItem.item as PublicHoliday;
                            return (
                                <div className="p-4">
                                    <h4 className="font-bold text-brand-green-text dark:text-brand-dark-green-text truncate">{holiday.name}</h4>
                                    <p className="mt-2 text-sm text-brand-text-secondary-light dark:text-brand-text-secondary">
                                        Public Holiday
                                    </p>
                                     <p className="text-xs text-brand-text-secondary-light dark:text-brand-text-secondary mt-1">
                                        {new Date(holiday.date + 'T00:00:00').toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            );
                        })()
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(EventsCalendarView);