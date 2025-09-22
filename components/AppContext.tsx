import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext, useMemo, useRef } from 'react';
import { type PostgrestError, type User as SupabaseUser, AuthError, type Session, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AppEvent, Cluster, GrantApplication, Notification, User, UserRole, StatusHistoryEntry, GrantCategory, PrimaryCreativeCategoryDef, ReportFile, ClusterReview, PublicHoliday, PromotionItem, AddGrantApplicationData, AddClusterData, AddEventData, AddPromotionData, ClusterProduct, AddClusterProductData, VisitorAnalyticsData, Feedback, FeedbackStatus, UserTier, ClusterAnalytic, Itinerary, ItineraryItem, NestedNavItemType } from '../types.ts';
import { useToast, type ToastType } from './ToastContext.tsx';
import { MOCK_GRANT_CATEGORIES, MOCK_CREATIVE_CATEGORIES, NAV_ITEMS, HEADER_NAV_ITEMS } from '../constants.tsx';
import type { Database, Tables, TablesInsert, TablesUpdate, Json } from '../database.types.ts';
import { api, supabase } from '../services/supabase.ts';
import { parseGrantApplication } from '../utils/parsers.ts';

// --- Constants ---
const BANNER_CONFIG_KEY = 'dashboard_banner_url';
const BANNER_OPACITY_KEY = 'dashboard_banner_opacity';
const MAINTENANCE_ENABLED_KEY = 'maintenance_mode_enabled';
const MAINTENANCE_MESSAGE_KEY = 'maintenance_mode_message';

// --- Helper Types ---
interface EditUserData { name: string; role: UserRole; tier: UserTier; }

// --- Context Value Interface ---
interface AppContextValue {
    // State
    clusters: Cluster[]; events: AppEvent[]; grantApplications: GrantApplication[]; notifications: Notification[]; users: User[];
    grantCategories: GrantCategory[]; creativeCategories: PrimaryCreativeCategoryDef[]; holidays: PublicHoliday[]; promotions: PromotionItem[];
    visitorAnalyticsData: VisitorAnalyticsData[]; clusterAnalytics: ClusterAnalytic[]; bannerImageUrl: string | null; bannerOverlayOpacity: number; isMaintenanceMode: boolean; maintenanceMessage: string;
    myItinerary: ItineraryItem[]; HEADER_NAV_ITEMS: NestedNavItemType[];
    // Loading State
    isLoadingClusters: boolean; isLoadingEvents: boolean; isLoadingGrantApplications: boolean; isLoadingNotifications: boolean;
    isLoadingUsers: boolean; isLoadingGrantCategories: boolean; isLoadingCreativeCategories: boolean; isLoadingHolidays: boolean;
    isLoadingPromotions: boolean; isLoadingVisitorAnalytics: boolean; isLoadingClusterAnalytics: boolean; isLoadingBannerImage: boolean; isLoadingMaintenanceMode: boolean;
    isLoadingItinerary: boolean;
    // Auth State
    currentUser: User | null; isAuthenticated: boolean; isInitializing: boolean; isLoggingOut: boolean; isPremiumUser: boolean;
    // UI State
    isPhoneView: boolean; togglePhoneView: () => void;
    // Auth actions
    loginUserWithPassword: (email: string, pass: string) => Promise<void>;
    registerUserWithEmailPassword: (name: string, email: string, pass: string, role: UserRole) => Promise<void>;
    logoutUser: () => Promise<void>;
    // Grant application actions
    addGrantApplication: (data: AddGrantApplicationData) => Promise<void>;
    reapplyForGrant: (originalApp: GrantApplication, newData: AddGrantApplicationData) => Promise<void>;
    rejectPendingApplication: (appId: string, notes: string) => Promise<void>;
    makeConditionalOffer: (appId: string, notes: string, amount: number) => Promise<void>;
    acceptConditionalOffer: (appId: string) => Promise<boolean>;
    declineConditionalOffer: (appId: string) => Promise<boolean>;
    submitEarlyReport: (appId: string, file: File) => Promise<void>;
    submitFinalReport: (appId: string, file: File) => Promise<void>;
    approveEarlyReportAndDisburse: (appId: string, amount: number, notes: string) => Promise<void>;
    rejectEarlyReportSubmission: (appId: string, notes: string) => Promise<void>;
    rejectFinalReportSubmission: (appId: string, notes: string) => Promise<void>;
    completeGrantApplication: (appId: string, amount: number, notes: string) => Promise<void>;
    createSignedUrl: (bucket: string, path: string) => Promise<string | null>;
    // Cluster actions
    addCluster: (data: AddClusterData) => Promise<void>;
    addClustersBatch: (data: AddClusterData[]) => Promise<void>;
    updateCluster: (id: string, data: Partial<AddClusterData>) => Promise<void>;
    deleteCluster: (id: string) => Promise<boolean>;
    uploadClusterImage: (file: File, oldImageUrl?: string) => Promise<string>;
    incrementClusterView: (clusterId: string) => void;
    incrementClusterClick: (clusterId: string) => void;
    transferClusterOwnership: (clusterId: string, newOwnerId: string) => Promise<boolean>;
    // Cluster Review actions
    fetchReviewsForCluster: (clusterId: string) => Promise<ClusterReview[]>;
    addReviewForCluster: (clusterId: string, rating: number, comment: string) => Promise<ClusterReview | null>;
    // Cluster Product Actions
    fetchProductsForCluster: (clusterId: string) => Promise<ClusterProduct[]>;
    addProduct: (data: AddClusterProductData) => Promise<void>;
    updateProduct: (id: string, data: Partial<AddClusterProductData>) => Promise<void>;
    deleteProduct: (id: string, imageUrl: string | null) => Promise<boolean>;
    uploadProductImage: (file: File, oldImageUrl?: string | null) => Promise<string>;
    // Event actions
    addEvent: (data: AddEventData) => Promise<void>;
    updateEvent: (id: string, data: Partial<AddEventData>) => Promise<void>;
    deleteEvent: (id: string) => Promise<boolean>;
    uploadEventImage: (file: File, oldImageUrl?: string | null) => Promise<string>;
    // Notification actions
    getNotificationsForCurrentUser: () => Notification[];
    markNotificationAsRead: (notification: Notification) => Promise<void>;
    markAllNotificationsAsRead: () => void;
    clearAllNotifications: () => Promise<void>;
    deleteGlobalNotification: (notificationId: string) => Promise<void>;
    // User Management actions
    editUser: (id: string, data: EditUserData) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    updateCurrentUserName: (name: string) => Promise<void>;
    updateCurrentUserPassword: (pass: string) => Promise<void>;
    deleteCurrentUserAccount: () => Promise<boolean>;
    // Promotions actions
    fetchAllPromotions: () => Promise<PromotionItem[]>;
    addPromotion: (data: AddPromotionData) => Promise<void>;
    updatePromotion: (id: number, data: Partial<AddPromotionData>) => Promise<void>;
    deletePromotion: (id: number, imageUrl: string) => Promise<void>;
    uploadPromotionImage: (file: File, oldImageUrl?: string) => Promise<string>;
    refreshDashboardPromotions: () => Promise<void>;
    // Banner actions
    uploadBannerImage: (file: File, oldImageUrl?: string) => Promise<string>;
    updateBannerImageUrl: (url: string) => Promise<void>;
    deleteBannerImage: (url: string) => Promise<void>;
    updateBannerOverlayOpacity: (opacity: number) => Promise<void>;
    // Website Management Actions
    setMaintenanceStatus: (enabled: boolean, message: string) => Promise<void>;
    setSiteBanner: (message: string, expires_at: string | null) => Promise<void>;
    sendGlobalPanelNotification: (message: string) => Promise<void>;
    // Analytics Actions
    getDailyClusterAnalytics: (clusterId: string, periodDays: number) => Promise<{ date: string, views: number, clicks: number }[]>;
    uploadVisitorAnalyticsBatch: (data: VisitorAnalyticsData[]) => Promise<void>;
    feedback: Feedback[];
    isLoadingFeedback: boolean;
    addFeedback: (content: string, isAnonymous: boolean, pageContext: string | null) => Promise<void>;
    updateFeedbackStatus: (id: string, status: FeedbackStatus) => Promise<void>;
    // AI & Itinerary Actions
    addItineraryItem: (itemId: string, itemType: 'cluster' | 'event', itemName: string) => Promise<void>;
    removeItineraryItem: (itineraryItemId: string) => Promise<void>;
    clearMyItinerary: () => Promise<void>;
    getCachedAiInsight: (viewName: string, filterKey: string) => Promise<{ content: string; data_last_updated_at: string } | null>;
    setCachedAiInsight: (viewName: string, filterKey: string, content: string, dataLastUpdatedAt: string) => Promise<void>;
    getLatestEventTimestampForYear: (year: number) => Promise<string | null>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const useAppContext = (): AppContextValue => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};

const initialDataState = {
    clusters: [] as Cluster[],
    events: [] as AppEvent[],
    grantApplications: [] as GrantApplication[],
    notifications: [] as Notification[],
    users: [] as User[],
    grantCategories: MOCK_GRANT_CATEGORIES,
    creativeCategories: MOCK_CREATIVE_CATEGORIES,
    holidays: [] as PublicHoliday[],
    promotions: [] as PromotionItem[],
    visitorAnalyticsData: [] as VisitorAnalyticsData[],
    clusterAnalytics: [] as ClusterAnalytic[],
    feedback: [] as Feedback[],
    myItinerary: [] as ItineraryItem[],
    bannerImageUrl: null as string | null,
    bannerOverlayOpacity: 0.5,
    isMaintenanceMode: false,
    maintenanceMessage: '',
    HEADER_NAV_ITEMS: HEADER_NAV_ITEMS,
    isLoadingClusters: true,
    isLoadingEvents: true,
    isLoadingGrantApplications: true,
    isLoadingNotifications: true,
    isLoadingUsers: true,
    isLoadingGrantCategories: false,
    isLoadingCreativeCategories: false,
    isLoadingHolidays: true,
    isLoadingPromotions: true,
    isLoadingVisitorAnalytics: true,
    isLoadingClusterAnalytics: true,
    isLoadingFeedback: true,
    isLoadingItinerary: true,
    isLoadingBannerImage: true,
    isLoadingMaintenanceMode: true,
};


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const [state, setState] = useState(initialDataState);
    const [auth, setAuth] = useState<{
        currentUser: User | null;
        isAuthenticated: boolean;
        isInitializing: boolean;
        isLoggingOut: boolean;
    }>({ currentUser: null, isAuthenticated: false, isInitializing: true, isLoggingOut: false });
    const [isPhoneView, setIsPhoneView] = useState(false);
    const initialAuthCheckCompleted = useRef(false);

    const isPremiumUser = useMemo(() => {
        if (!auth.currentUser) return false;
        if (auth.currentUser.role === 'Admin' || auth.currentUser.role === 'Editor') return true;
        return auth.currentUser.tier === 'Premium';
    }, [auth.currentUser]);

    const getErrorMessage = useCallback((error: unknown): string => {
        if (error && typeof error === 'object' && 'message' in error) return String((error as any).message);
        if (error instanceof Error) return error.message;
        return 'An unknown error occurred.';
    }, []);

    const handleError = useCallback((error: unknown, context: string, show: boolean = true) => {
        const message = getErrorMessage(error);
        console.error(`${context}:`, message, error);
        if(show) showToast(message, 'error');
    }, [getErrorMessage, showToast]);

    // --- DATA FETCHING ---
    const fetchClusters = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingClusters: true }));
        try {
            const data = await api.fetchClusters();
            setState(prev => ({ ...prev, clusters: data }));
        } catch (e) { handleError(e, 'Fetching clusters'); } 
        finally { setState(prev => ({ ...prev, isLoadingClusters: false })); }
    }, [handleError]);

    const fetchEvents = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingEvents: true }));
        try {
            const data = await api.fetchEvents();
            setState(prev => ({ ...prev, events: data }));
        } catch (e) { handleError(e, 'Fetching events'); } 
        finally { setState(prev => ({ ...prev, isLoadingEvents: false })); }
    }, [handleError]);

    const fetchGrantApplications = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingGrantApplications: true }));
        try {
            const data = await api.fetchGrantApplications();
            setState(prev => ({ ...prev, grantApplications: data }));
        } catch (e) { handleError(e, 'Fetching grant applications'); } 
        finally { setState(prev => ({ ...prev, isLoadingGrantApplications: false })); }
    }, [handleError]);

    const fetchNotifications = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingNotifications: true }));
        try {
            const data = await api.fetchNotifications();
            setState(prev => ({ ...prev, notifications: data }));
        } catch (e) { handleError(e, 'Fetching notifications'); } 
        finally { setState(prev => ({ ...prev, isLoadingNotifications: false })); }
    }, [handleError]);
    
    const fetchUsers = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingUsers: true }));
        try {
            const data = await api.fetchUsers();
            setState(prev => ({ ...prev, users: data }));
        } catch (e) { handleError(e, 'Fetching users'); } 
        finally { setState(prev => ({ ...prev, isLoadingUsers: false })); }
    }, [handleError]);

    const fetchHolidays = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingHolidays: true }));
        try {
            const data = await api.fetchHolidays();
            setState(prev => ({ ...prev, holidays: data }));
        } catch (e) { handleError(e, 'Fetching holidays'); } 
        finally { setState(prev => ({ ...prev, isLoadingHolidays: false })); }
    }, [handleError]);

    const refreshDashboardPromotions = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingPromotions: true }));
        try {
            const data = await api.fetchDashboardPromotions();
            setState(prev => ({ ...prev, promotions: data }));
        } catch (e) { handleError(e, 'Fetching promotions'); } 
        finally { setState(prev => ({ ...prev, isLoadingPromotions: false })); }
    }, [handleError]);

    const fetchVisitorAnalytics = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingVisitorAnalytics: true }));
        try {
            const data = await api.fetchVisitorAnalytics();
            setState(prev => ({ ...prev, visitorAnalyticsData: data }));
        } catch (e) {
            handleError(e, 'Fetching visitor analytics');
            setState(prev => ({ ...prev, visitorAnalyticsData: [] }));
        } finally {
            setState(prev => ({ ...prev, isLoadingVisitorAnalytics: false }));
        }
    }, [handleError]);
    
    const fetchClusterAnalytics = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingClusterAnalytics: true }));
        try {
            const data = await api.fetchClusterAnalytics();
            setState(prev => ({ ...prev, clusterAnalytics: data }));
        } catch (e) { handleError(e, 'Fetching cluster analytics'); }
        finally { setState(prev => ({ ...prev, isLoadingClusterAnalytics: false })); }
    }, [handleError]);

    const fetchFeedback = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingFeedback: true }));
        try {
            const data = await api.fetchFeedback();
            setState(prev => ({ ...prev, feedback: data }));
        } catch (e) { handleError(e, 'Fetching feedback'); } 
        finally { setState(prev => ({ ...prev, isLoadingFeedback: false })); }
    }, [handleError]);

    const fetchMyItinerary = useCallback(async (currentUserId: string | null) => {
        if (!currentUserId) {
            setState(prev => ({...prev, myItinerary: [], isLoadingItinerary: false }));
            return;
        };
        setState(prev => ({ ...prev, isLoadingItinerary: true }));
        try {
            const itineraryId = await api.findOrCreateItinerary(currentUserId);
            const items = await api.fetchMyItineraryItems(itineraryId);
            setState(prev => ({ ...prev, myItinerary: items }));
        } catch (e) { handleError(e, 'Fetching itinerary'); }
        finally { setState(prev => ({ ...prev, isLoadingItinerary: false })); }
    }, [handleError]);

    const uploadVisitorAnalyticsBatch = useCallback(async (data: VisitorAnalyticsData[]) => {
        try {
            await api.uploadVisitorAnalyticsBatch(data);
            showToast(`${data.length} records uploaded successfully!`, 'success');
            fetchVisitorAnalytics(); // Refresh data in the background
        } catch(error) {
            handleError(error, "Uploading visitor analytics");
            throw error;
        }
    }, [handleError, showToast, fetchVisitorAnalytics]);

    const fetchConfig = useCallback(async () => {
        setState(prev => ({ ...prev, isLoadingBannerImage: true, isLoadingMaintenanceMode: true }));
        try {
            const config = await api.fetchAppConfig();
            setState(prev => ({
                ...prev,
                bannerImageUrl: config[BANNER_CONFIG_KEY] || null,
                bannerOverlayOpacity: parseFloat(config[BANNER_OPACITY_KEY] || '0.5'),
                isMaintenanceMode: config[MAINTENANCE_ENABLED_KEY] === 'true',
                maintenanceMessage: config[MAINTENANCE_MESSAGE_KEY] || '',
            }));
        } catch(e) { handleError(e, 'Fetching app config'); }
        finally { setState(prev => ({ ...prev, isLoadingBannerImage: false, isLoadingMaintenanceMode: false })); }
    }, [handleError]);

    const fetchAllData = useCallback(async (userId: string | null) => {
        Promise.allSettled([
            fetchClusters(), fetchEvents(), fetchGrantApplications(), fetchNotifications(),
            fetchUsers(), fetchHolidays(), refreshDashboardPromotions(), fetchVisitorAnalytics(), 
            fetchFeedback(), fetchClusterAnalytics(), fetchMyItinerary(userId)
        ]);
    }, [fetchClusters, fetchEvents, fetchGrantApplications, fetchNotifications, fetchUsers, fetchHolidays, refreshDashboardPromotions, fetchVisitorAnalytics, fetchFeedback, fetchClusterAnalytics, fetchMyItinerary]);
    
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                if (session) {
                    const currentUserId = session.user.id;
                    if (initialAuthCheckCompleted.current && auth.currentUser) {
                        // This is a session refresh, not a new login. We can do a quick profile check.
                        const { data: userProfile, error: profileError } = await supabase
                            .from('users').select('*').eq('id', session.user.id).single();
                        if (profileError || !userProfile) {
                            console.error('User profile check failed on refresh, signing out.', profileError);
                            await api.logoutUser();
                        } else {
                            setAuth(prev => ({ ...prev, currentUser: userProfile as User, isAuthenticated: true }));
                        }
                        return; // Avoid full re-fetch on simple refresh
                    }
    
                    // This is the initial login or first load with a session.
                    setAuth(prev => ({ ...prev, isInitializing: true }));
                    await fetchConfig();
                    const { data: userProfile, error: profileError } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                    if (profileError || !userProfile) {
                        console.error('User profile fetch failed on initial load, signing out.', profileError);
                        await api.logoutUser();
                        return; // The state will be cleared by the subsequent SIGNED_OUT event.
                    }
                    setAuth({ currentUser: userProfile as User, isAuthenticated: true, isInitializing: false, isLoggingOut: false });
                    initialAuthCheckCompleted.current = true;
                    fetchAllData(currentUserId);
                } else {
                    // No session, which covers both initial load (no user) and explicit sign-out.
                    // The previous logic incorrectly re-triggered the initializing state on logout.
                    // This simplified logic ensures that whenever there's no session, we cleanly
                    // transition to the guest state without getting stuck.
                    setAuth({
                        currentUser: null,
                        isAuthenticated: false,
                        isInitializing: false, // Key fix: ensure this is false to show the guest/login view
                        isLoggingOut: false,   // Ensure this is reset
                    });
                    setState(initialDataState); // Reset all data to its initial state for a guest.
                    initialAuthCheckCompleted.current = false;

                    if (_event === 'SIGNED_OUT') {
                        showToast("You have been logged out.", "success");
                    }
                    
                    // Fetch public data for the guest view.
                    fetchConfig();
                    fetchAllData(null);
                }
            } catch (e) {
                handleError(e, "Error during authentication state change.", true);
                setAuth({ currentUser: null, isAuthenticated: false, isInitializing: false, isLoggingOut: false });
            }
        });
        return () => { subscription.unsubscribe(); };
    }, [fetchAllData, fetchConfig, handleError, showToast, auth.currentUser]);

    useEffect(() => {
        const handleDbChange = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
            console.log('DB Change received:', payload);
            const { table } = payload;
            switch (table) {
                case 'notifications': fetchNotifications(); break;
                case 'grant_applications': fetchGrantApplications(); break;
                case 'clusters':
                case 'cluster_reviews':
                case 'cluster_products': fetchClusters(); break;
                case 'events': fetchEvents(); break;
                case 'users': fetchUsers(); break;
                case 'promotions': refreshDashboardPromotions(); break;
                case 'app_config': fetchConfig(); break;
                case 'visitor_analytics': fetchVisitorAnalytics(); break;
                case 'cluster_analytics': fetchClusterAnalytics(); break;
                case 'feedback': fetchFeedback(); break;
                case 'itinerary_items': fetchMyItinerary(auth.currentUser?.id || null); break;
            }
        };
        const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, handleDbChange).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [auth.currentUser, fetchClusters, fetchEvents, fetchGrantApplications, fetchNotifications, fetchUsers, refreshDashboardPromotions, fetchConfig, fetchVisitorAnalytics, fetchClusterAnalytics, fetchFeedback, fetchMyItinerary]);

    const loginUserWithPassword = useCallback(async (email: string, pass: string) => {
        const { error } = await api.loginUserWithPassword(email, pass);
        if (error) throw error;
    }, []);

    const registerUserWithEmailPassword = useCallback(async (name: string, email: string, pass: string, role: UserRole) => {
        const { error } = await api.registerUserWithEmailPassword(name, email, pass, role);
        if (error) throw error;
    }, []);
    
    const logoutUser = useCallback(async () => {
        setAuth(prev => ({ ...prev, isLoggingOut: true }));
        const { error } = await api.logoutUser();
        if (error) {
            handleError(error, 'Logout');
            setAuth(prev => ({ ...prev, isLoggingOut: false }));
        }
    }, [handleError]);

    const uploadFile = useCallback(async (bucket: string, file: File, userId: string, oldFileUrl?: string | null) => {
        return api.uploadFile(bucket, file, userId, oldFileUrl);
    }, []);

    const deleteFile = useCallback(async(bucket: string, fileUrl: string) => {
        try {
            await api.deleteFile(bucket, fileUrl);
        } catch(e) {
            handleError(e, `Deleting file from ${bucket}`);
        }
    }, [handleError]);
    
    const addGrantApplication = useCallback(async(data: AddGrantApplicationData) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        const now = new Date();
        const grantId = `GA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const initialStatus: StatusHistoryEntry = {
            status: 'Pending', timestamp: now.toISOString(),
            notes: 'Application submitted by applicant.', changed_by: auth.currentUser.name
        };
        const newApplication: TablesInsert<'grant_applications'> = {
            ...data,
            id: grantId,
            applicant_id: auth.currentUser.id,
            status: 'Pending',
            submission_timestamp: now.toISOString(),
            last_update_timestamp: now.toISOString(),
            status_history: [initialStatus] as unknown as Json,
            early_report_files: [],
            final_report_files: [],
            resubmission_count: 0,
        };
        try {
            await api.addGrantApplication(newApplication);
            const notificationMessage = `New grant application "${data.project_name}" submitted by ${auth.currentUser.name}.`;
            const notificationPayload: TablesInsert<'notifications'> = {
                recipient_id: 'grant_admins', message: notificationMessage, related_application_id: grantId,
                type: 'new_app', timestamp: now.toISOString()
            };
            await api.createAdminNotification(notificationPayload);
            showToast("Application submitted successfully!", "success");
        } catch(appError) {
             handleError(appError, "Submitting grant application"); 
             throw appError; 
        }
    }, [auth.currentUser, handleError, showToast]);
    
    const reapplyForGrant = useCallback(async(originalApp: GrantApplication, newData: AddGrantApplicationData) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        const now = new Date();
        const newId = `GA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const initialStatus: StatusHistoryEntry = {
            status: 'Pending', timestamp: now.toISOString(),
            notes: `Re-submitted from previous application ${originalApp.id}.`, changed_by: auth.currentUser.name
        };
        const newApplication: TablesInsert<'grant_applications'> = {
            ...newData, id: newId, applicant_id: auth.currentUser.id, status: 'Pending', submission_timestamp: now.toISOString(),
            last_update_timestamp: now.toISOString(), status_history: [initialStatus] as unknown as Json, resubmitted_from_id: originalApp.id,
            resubmission_count: (originalApp.resubmission_count || 0) + 1, early_report_files: [], final_report_files: [],
        };
        try {
            await api.addGrantApplication(newApplication);
            const notificationMessage = `Grant re-application "${newData.project_name}" submitted by ${auth.currentUser.name}.`;
            await api.createAdminNotification({
                recipient_id: 'grant_admins', message: notificationMessage, related_application_id: newId,
                type: 'resubmission', timestamp: now.toISOString()
            });
            showToast("Re-application submitted successfully!", "success");
        } catch (appError) {
            handleError(appError, "Re-submitting grant"); 
            throw appError;
        }
    }, [auth.currentUser, handleError, showToast]);

    const rejectPendingApplication = useCallback(async (appId: string, notes: string) => {
        try {
            await api.rejectPendingApplication(appId, notes);
        } catch(error) { handleError(error, "Rejecting application"); throw error; }
    }, [handleError]);

    const makeConditionalOffer = useCallback(async (appId: string, notes: string, amount: number) => {
        try {
            await api.makeConditionalOffer(appId, notes, amount);
        } catch(error) { handleError(error, "Making conditional offer"); throw error; }
    }, [handleError]);

    const acceptConditionalOffer = useCallback(async (appId: string): Promise<boolean> => {
        try {
            await api.acceptConditionalOffer(appId);
            showToast("Offer accepted! Please proceed to the next step.", "success");
            return true;
        } catch (error) { handleError(error, "Accepting offer"); return false; }
    }, [handleError, showToast]);
    
    const declineConditionalOffer = useCallback(async (appId: string): Promise<boolean> => {
        try {
            await api.declineConditionalOffer(appId);
            showToast("Offer declined.", "info");
            return true;
        } catch(error) { handleError(error, "Declining offer"); return false; }
    }, [handleError, showToast]);
    
    const submitReport = useCallback(async (appId: string, file: File, reportType: 'early' | 'final') => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        try {
            const bucket = reportType === 'early' ? 'grant-early-report-files' : 'grant-final-report-files';
            const filePath = `${auth.currentUser.id}/${appId}/${Date.now()}-${file.name}`;
            await api.uploadFile(bucket, file, auth.currentUser.id);
            const reportFile: ReportFile = { path: filePath, file_name: file.name, submitted_at: new Date().toISOString() };
            await api.submitReport(appId, reportFile, reportType);
            showToast(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report submitted for review.`, "success");
        } catch (error) { handleError(error, "Submitting report"); throw error; }
    }, [auth.currentUser, handleError, showToast]);
    
    const submitEarlyReport = useCallback((appId: string, file: File) => submitReport(appId, file, 'early'), [submitReport]);
    const submitFinalReport = useCallback((appId: string, file: File) => submitReport(appId, file, 'final'), [submitReport]);

    const approveEarlyReportAndDisburse = useCallback(async (appId: string, amount: number, notes: string) => {
        try {
            await api.approveEarlyReportAndDisburse(appId, amount, notes);
            showToast("Early report approved and applicant notified.", "success");
        } catch (error) { handleError(error, "Approving early report"); throw error; }
    }, [handleError, showToast]);

    const rejectEarlyReportSubmission = useCallback(async (appId: string, notes: string) => {
        try {
            await api.rejectEarlyReportSubmission(appId, notes);
            showToast("Early report rejected and applicant notified.", "info");
        } catch (error) { handleError(error, "Rejecting early report"); throw error; }
    }, [handleError, showToast]);
    
    const rejectFinalReportSubmission = useCallback(async (appId: string, notes: string) => {
        try {
            await api.rejectFinalReportSubmission(appId, notes);
            showToast("Final report rejected and applicant notified.", "info");
        } catch(error) { handleError(error, "Rejecting final report"); throw error; }
    }, [handleError, showToast]);

    const completeGrantApplication = useCallback(async (appId: string, amount: number, notes: string) => {
        try {
            await api.completeGrantApplication(appId, amount, notes);
            showToast("Grant completed successfully.", "success");
        } catch(error) { handleError(error, "Completing application"); throw error; }
    }, [handleError, showToast]);
    
    const createSignedUrl = useCallback(async (bucket: string, path: string): Promise<string | null> => {
        try {
            return await api.createSignedUrl(bucket, path);
        } catch(e) { handleError(e, "Creating signed URL"); return null; }
    }, [handleError]);
    
    const addCluster = useCallback(async (data: AddClusterData) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        try {
            await api.addCluster({ ...data, owner_id: auth.currentUser.id });
            showToast("Cluster added successfully!", "success");
        } catch (error) { handleError(error, "Adding cluster"); throw error; }
    }, [auth.currentUser, handleError, showToast]);

    const addClustersBatch = useCallback(async(data: AddClusterData[]) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        try {
            const BATCH_SIZE = 500;
            for (let i = 0; i < data.length; i += BATCH_SIZE) {
                const batch = data.slice(i, i + BATCH_SIZE);
                const payload: TablesInsert<'clusters'>[] = batch.map((d) => ({ ...d, owner_id: auth.currentUser!.id }));
                await api.addClustersBatch(payload);
            }
            showToast(`${data.length} clusters uploaded successfully!`, "success");
        } catch (error) {
            const enrichedError = new Error(`Batch upload failed. Supabase error: ${(error as Error).message}`);
            handleError(enrichedError, "Batch adding clusters");
            throw enrichedError;
        }
    }, [auth.currentUser, handleError, showToast]);
    
    const updateCluster = useCallback(async (id: string, data: Partial<AddClusterData>) => {
        try {
            await api.updateCluster(id, data);
            showToast("Cluster updated successfully!", "success");
        } catch(error) { handleError(error, "Updating cluster"); throw error; }
    }, [handleError, showToast]);

    const deleteCluster = useCallback(async (id: string): Promise<boolean> => {
        try {
            const clusterToDelete = state.clusters.find(c => c.id === id);
            await api.deleteCluster(id);
            if (clusterToDelete?.image) await deleteFile('cluster-images', clusterToDelete.image);
            return true;
        } catch(error) { handleError(error, "Deleting cluster"); return false; }
    }, [handleError, state.clusters, deleteFile]);
    
    const uploadClusterImage = useCallback((file: File, oldImageUrl?: string) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        return uploadFile('cluster-images', file, auth.currentUser.id, oldImageUrl);
    }, [auth.currentUser, uploadFile]);
    
    const transferClusterOwnership = useCallback(async (clusterId: string, newOwnerId: string): Promise<boolean> => {
        try {
            await api.transferClusterOwnership(clusterId, newOwnerId);
            showToast("Cluster ownership transferred successfully!", "success");
            await fetchClusters();
            return true;
        } catch(error) { handleError(error, "Transferring cluster ownership"); return false; }
    }, [handleError, showToast, fetchClusters]);

// FIX: The supabase rpc builder is a "thenable" but doesn't have .catch.
// Changed to an async function to await the result and handle errors properly.
    const incrementClusterView = useCallback(async (clusterId: string) => {
        const { error } = await api.incrementClusterView(clusterId);
        if (error) {
            console.error("Error incrementing view:", error.message);
        }
    }, []);

// FIX: The supabase rpc builder is a "thenable" but doesn't have .catch.
// Changed to an async function to await the result and handle errors properly.
    const incrementClusterClick = useCallback(async (clusterId: string) => {
        const { error } = await api.incrementClusterClick(clusterId);
        if (error) {
            console.error("Error incrementing click:", error.message);
        }
    }, []);

    const fetchReviewsForCluster = useCallback(async (clusterId: string): Promise<ClusterReview[]> => {
        try {
            return await api.fetchReviewsForCluster(clusterId);
        } catch(e) { handleError(e, "Fetching reviews"); return []; }
    }, [handleError]);
    
    const addReviewForCluster = useCallback(async (clusterId: string, rating: number, comment: string): Promise<ClusterReview | null> => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        try {
            const newReview: TablesInsert<'cluster_reviews'> = { cluster_id: clusterId, user_id: auth.currentUser.id, rating, comment };
            const data = await api.addReviewForCluster(newReview);
            showToast("Review submitted!", "success");
            return { ...(data as any), user_name: auth.currentUser.name };
        } catch(e) { handleError(e, "Adding review"); return null; }
    }, [auth.currentUser, handleError, showToast]);

    const fetchProductsForCluster = useCallback(async (clusterId: string): Promise<ClusterProduct[]> => {
        try {
            return await api.fetchProductsForCluster(clusterId);
        } catch (e) { handleError(e, "Fetching cluster products"); return []; }
    }, [handleError]);

    const addProduct = useCallback(async (data: AddClusterProductData) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        try {
            await api.addProduct({ ...data, owner_id: auth.currentUser.id });
            showToast("Product added successfully!", "success");
        } catch(error) { handleError(error, "Adding product"); throw error; }
    }, [auth.currentUser, handleError, showToast]);

    const updateProduct = useCallback(async (id: string, data: Partial<AddClusterProductData>) => {
        try {
            await api.updateProduct(id, data);
            showToast("Product updated successfully!", "success");
        } catch(error) { handleError(error, "Updating product"); throw error; }
    }, [handleError, showToast]);

    const deleteProduct = useCallback(async (id: string, imageUrl: string | null): Promise<boolean> => {
        try {
            await api.deleteProduct(id);
            if (imageUrl) await deleteFile('product-images', imageUrl);
            showToast("Product deleted successfully.", "success");
            return true;
        } catch(error) { handleError(error, "Deleting product"); return false; }
    }, [handleError, showToast, deleteFile]);
    
    const uploadProductImage = useCallback((file: File, oldImageUrl?: string | null) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        return uploadFile('product-images', file, auth.currentUser.id, oldImageUrl);
    }, [auth.currentUser, uploadFile]);

    const addEvent = useCallback(async (data: AddEventData) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        try {
            await api.addEvent({ ...data, created_by: auth.currentUser.id });
            showToast("Event added successfully!", "success");
        } catch(error) { handleError(error, "Adding event"); throw error; }
    }, [auth.currentUser, handleError, showToast]);

    const updateEvent = useCallback(async (id: string, data: Partial<AddEventData>) => {
        try {
            await api.updateEvent(id, data);
            showToast("Event updated successfully!", "success");
        } catch(error) { handleError(error, "Updating event"); throw error; }
    }, [handleError, showToast]);

    const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
        try {
            await api.deleteEvent(id);
            showToast("Event deleted successfully.", "success");
            return true;
        } catch (error) { handleError(error, "Deleting event"); return false; }
    }, [handleError, showToast]);
    
    const uploadEventImage = useCallback((file: File, oldImageUrl?: string | null) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        return uploadFile('event-images', file, auth.currentUser.id, oldImageUrl);
    }, [auth.currentUser, uploadFile]);

    const getNotificationsForCurrentUser = useCallback(() => {
        if (!auth.currentUser) return [];
        const { role, id } = auth.currentUser;
        return state.notifications.filter(n => {
            if (n.cleared_by?.includes(id)) return false;
            if (n.recipient_id === id) return true;
            if ((role === 'Admin' || role === 'Editor') && n.recipient_id === 'admins') return true;
            if (role === 'Admin' && n.recipient_id === 'grant_admins') return true;
            return false;
        });
    }, [auth.currentUser, state.notifications]);

    const markNotificationAsRead = useCallback(async(notification: Notification) => {
        if (!auth.currentUser) return;
        try {
            const newReadBy = [...(notification.read_by || []), auth.currentUser.id];
            await api.markNotificationAsRead(notification.id, { read_by: newReadBy });
        } catch(error) { handleError(error, "Marking notification as read"); }
    }, [auth.currentUser, handleError]);
    
    const markAllNotificationsAsRead = useCallback(() => {
        const unread = getNotificationsForCurrentUser().filter(n => !(n.read_by || []).includes(auth.currentUser!.id));
        unread.forEach(markNotificationAsRead);
    }, [auth.currentUser, getNotificationsForCurrentUser, markNotificationAsRead]);

    const clearAllNotifications = useCallback(async () => {
        if (!auth.currentUser) return;
        const notificationsToClear = getNotificationsForCurrentUser();
        if (notificationsToClear.length === 0) return;
        try {
            await api.clearAllNotifications(notificationsToClear.map(n => n.id));
            showToast("Notifications cleared.", "success");
            fetchNotifications(); // Force a re-fetch
        } catch (error) { handleError(error, "Clearing notifications"); }
    }, [auth.currentUser, getNotificationsForCurrentUser, handleError, showToast, fetchNotifications]);

    const deleteGlobalNotification = useCallback(async (notificationId: string) => {
        try {
            await api.deleteGlobalNotification(notificationId);
            showToast("Site-wide banner taken down.", 'success');
        } catch(error) { handleError(error, "Deleting global notification"); throw error; }
    }, [handleError, showToast]);

    const editUser = useCallback(async (id: string, data: EditUserData) => {
        try {
            await api.editUser(id, { name: data.name, role: data.role, tier: data.tier });
            showToast("User updated successfully.", "success");
        } catch(error) { handleError(error, "Editing user"); throw error; }
    }, [handleError, showToast]);
    
    const deleteUser = useCallback(async (id: string) => {
        showToast("User deletion is not implemented in this version.", "info");
    }, [showToast]);
    
    const updateCurrentUserName = useCallback(async(name: string) => {
        try {
            const { error } = await api.updateCurrentUserName(name);
            if (error) throw error;
            if(auth.currentUser) setAuth(prev => ({ ...prev, currentUser: { ...prev.currentUser!, name } }));
            showToast("Name updated successfully.", "success");
        } catch (error) { handleError(error, "Updating user name"); throw error; }
    }, [handleError, showToast, auth.currentUser]);

    const updateCurrentUserPassword = useCallback(async(pass: string) => {
        try {
            const { error } = await api.updateCurrentUserPassword(pass);
            if (error) throw error;
            showToast("Password updated successfully. You may need to log in again.", "success");
        } catch (error) { handleError(error, "Updating password"); throw error; }
    }, [handleError, showToast]);
    
    const deleteCurrentUserAccount = useCallback(async (): Promise<boolean> => {
        if (!auth.currentUser) {
            showToast("You must be logged in to delete your account.", "error");
            return false;
        }
        try {
            await api.deleteCurrentUserAccount();
            showToast("Your account has been successfully deleted. You have been logged out.", "success");
            await api.logoutUser();
            return true;
        } catch (e) { handleError(e, "Deleting user account"); return false; }
    }, [auth.currentUser, handleError, showToast]);

    const addFeedback = useCallback(async (content: string, isAnonymous: boolean, pageContext: string | null) => {
        if (!auth.currentUser && !isAnonymous) {
            showToast("You must be logged in to submit non-anonymous feedback.", "error");
            throw new Error("Authentication required for non-anonymous feedback.");
        }
        try {
            await api.addFeedback({
                content, page_context: pageContext, user_id: isAnonymous ? null : auth.currentUser?.id,
                user_email: isAnonymous ? null : auth.currentUser?.email, status: 'new'
            });
        } catch(error) { handleError(error, "Submitting feedback"); throw error; }
    }, [auth.currentUser, handleError, showToast]);

    const updateFeedbackStatus = useCallback(async (id: string, status: FeedbackStatus) => {
        if (!auth.currentUser || (auth.currentUser.role !== 'Admin' && auth.currentUser.role !== 'Editor')) {
            showToast("You don't have permission to perform this action.", "error");
            throw new Error("Permission denied.");
        }
        try {
            await api.updateFeedbackStatus(id, status);
            showToast(`Feedback status updated to '${status}'.`, "success");
        } catch(error) { handleError(error, "Updating feedback status"); throw error; }
    }, [auth.currentUser, handleError, showToast]);

    const fetchAllPromotions = useCallback(async(): Promise<PromotionItem[]> => {
        try {
            return await api.fetchAllPromotions();
        } catch(e) { handleError(e, "Fetching all promotions"); return []; }
    }, [handleError]);

    const addPromotion = useCallback(async(data: AddPromotionData) => {
        if (!auth.currentUser) throw new Error("Auth required.");
        try {
            await api.addPromotion({ ...data, created_by: auth.currentUser.id });
            showToast("Promotion added.", "success");
        } catch(error) { handleError(error, "Adding promotion"); throw error; }
    }, [auth.currentUser, handleError, showToast]);

    const updatePromotion = useCallback(async(id: number, data: Partial<AddPromotionData>) => {
        try {
            await api.updatePromotion(id, data);
            showToast("Promotion updated.", "success");
        } catch(error) { handleError(error, "Updating promotion"); throw error; }
    }, [handleError, showToast]);

    const deletePromotion = useCallback(async(id: number, imageUrl: string) => {
        try {
            await api.deletePromotion(id);
            await deleteFile('promotion-images', imageUrl);
            showToast("Promotion deleted.", "success");
        } catch(error) { handleError(error, "Deleting promotion"); throw error; }
    }, [handleError, showToast, deleteFile]);

    const uploadPromotionImage = useCallback((file: File, oldImageUrl?: string) => {
        if (!auth.currentUser) throw new Error("Auth required.");
        return uploadFile('promotion-images', file, auth.currentUser.id, oldImageUrl);
    }, [auth.currentUser, uploadFile]);
    
    const uploadBannerImage = useCallback((file: File, oldImageUrl?: string) => {
        if (!auth.currentUser) throw new Error("Auth required.");
        return uploadFile('banner-images', file, auth.currentUser.id, oldImageUrl);
    }, [auth.currentUser, uploadFile]);

    const updateBannerImageUrl = useCallback(async(url: string) => {
        try {
            await api.updateAppConfig({ value: url }, BANNER_CONFIG_KEY);
            showToast("Banner image updated.", "success");
        } catch(error) { handleError(error, "Updating banner URL"); throw error; }
    }, [handleError, showToast]);

    const deleteBannerImage = useCallback((url: string) => deleteFile('banner-images', url), [deleteFile]);
    
    const updateBannerOverlayOpacity = useCallback(async(opacity: number) => {
        if (!auth.currentUser) throw new Error("Authentication required.");
        try {
            await api.upsertAppConfig({ key: BANNER_OPACITY_KEY, value: String(opacity), updated_by: auth.currentUser.id });
            setState(prev => ({ ...prev, bannerOverlayOpacity: opacity }));
            showToast("Banner darkness updated.", "success");
        } catch(error) { handleError(error, "Updating banner opacity"); throw error; }
    }, [auth.currentUser, handleError, showToast]);

    const setMaintenanceStatus = useCallback(async(enabled: boolean, message: string) => {
        try {
            await Promise.all([
                api.updateAppConfig({ value: String(enabled) }, MAINTENANCE_ENABLED_KEY),
                api.updateAppConfig({ value: message }, MAINTENANCE_MESSAGE_KEY)
            ]);
            showToast("Maintenance mode settings saved.", "success");
        } catch(error) { handleError(error, "Setting maintenance status"); throw error; }
    }, [handleError, showToast]);

    const setSiteBanner = useCallback(async(message: string, expires_at: string | null) => {
        try {
            await api.setSiteBanner(message, expires_at);
            showToast("Site-wide banner has been updated.", "success");
        } catch(error) { handleError(error, "Setting site banner"); throw error; }
    }, [handleError, showToast]);

    const sendGlobalPanelNotification = useCallback(async(message: string) => {
        try {
            await api.sendGlobalPanelNotification(message);
            showToast("Notification sent to all current users.", "success");
        } catch(error) { handleError(error, "Sending notification to all users"); throw error; }
    }, [handleError, showToast]);

    const getDailyClusterAnalytics = useCallback(async(clusterId: string, periodDays: number): Promise<{ date: string, views: number, clicks: number }[]> => {
        try {
            return await api.getDailyClusterAnalytics(clusterId, periodDays);
        } catch(e) { handleError(e, "Fetching daily analytics"); return []; }
    }, [handleError]);

    const getCachedAiInsight = useCallback((viewName: string, filterKey: string) => api.getCachedAiInsight(viewName, filterKey), []);
    // FIX: The return type of this function did not match the context interface.
    // Made it an async function that awaits the API call to ensure it returns Promise<void>.
    const setCachedAiInsight = useCallback(async (viewName: string, filterKey: string, content: string, dataLastUpdatedAt: string) => {
        const { error } = await api.setCachedAiInsight(viewName, filterKey, content, dataLastUpdatedAt);
        if (error) {
            handleError(error, "Setting AI Insight Cache");
        }
    }, [handleError]);
    const getLatestEventTimestampForYear = useCallback((year: number) => api.getLatestEventTimestampForYear(year), []);

    const addItineraryItem = useCallback(async (itemId: string, itemType: 'cluster' | 'event', itemName: string) => {
        if (!auth.currentUser) {
            showToast("You must be logged in to create an itinerary.", "error");
            return;
        }
        try {
            const itineraryId = await api.findOrCreateItinerary(auth.currentUser.id);
            const { error } = await api.addItineraryItem({ itinerary_id: itineraryId, item_id: itemId, item_type: itemType, item_name: itemName });
            if (error && error.code === '23505') {
                 showToast(`"${itemName}" is already in your itinerary.`, 'info');
            } else if (error) {
                throw error;
            } else {
                showToast(`Added "${itemName}" to your itinerary!`, 'success');
            }
        } catch (e) { handleError(e, "Adding item to itinerary"); }
    }, [auth.currentUser, showToast, handleError]);
    
    const removeItineraryItem = useCallback(async (itineraryItemId: string) => {
        try {
            await api.removeItineraryItem(itineraryItemId);
            showToast("Item removed from itinerary.", "success");
        } catch (e) { handleError(e, "Removing itinerary item"); }
    }, [handleError, showToast]);

    const clearMyItinerary = useCallback(async () => {
        if (!auth.currentUser) return;
        try {
            const itineraryId = await api.findOrCreateItinerary(auth.currentUser.id);
            await api.clearMyItinerary(itineraryId);
            showToast("Itinerary cleared.", "success");
        } catch (e) { handleError(e, "Clearing itinerary"); }
    }, [auth.currentUser, handleError, showToast]);

    const togglePhoneView = () => setIsPhoneView(p => !p);

    const contextValue = useMemo(() => ({
        ...state, ...auth, isPhoneView, isPremiumUser, togglePhoneView,
        loginUserWithPassword, registerUserWithEmailPassword, logoutUser, addGrantApplication, reapplyForGrant, rejectPendingApplication,
        makeConditionalOffer, acceptConditionalOffer, declineConditionalOffer, submitEarlyReport, submitFinalReport, approveEarlyReportAndDisburse,
        rejectEarlyReportSubmission, rejectFinalReportSubmission, completeGrantApplication, createSignedUrl, addCluster, addClustersBatch, updateCluster, deleteCluster,
        uploadClusterImage, incrementClusterView, incrementClusterClick, transferClusterOwnership, fetchReviewsForCluster, addReviewForCluster,
        fetchProductsForCluster, addProduct, updateProduct, deleteProduct, uploadProductImage, addEvent, updateEvent, deleteEvent, uploadEventImage, getNotificationsForCurrentUser, markNotificationAsRead, markAllNotificationsAsRead,
        clearAllNotifications, deleteGlobalNotification, editUser, deleteUser, updateCurrentUserName, updateCurrentUserPassword, deleteCurrentUserAccount,
        addFeedback, updateFeedbackStatus, fetchAllPromotions, addPromotion, updatePromotion, deletePromotion, uploadPromotionImage, refreshDashboardPromotions,
        uploadBannerImage, updateBannerImageUrl, deleteBannerImage, updateBannerOverlayOpacity, setMaintenanceStatus,
        setSiteBanner, sendGlobalPanelNotification, getDailyClusterAnalytics, uploadVisitorAnalyticsBatch, addItineraryItem, removeItineraryItem, clearMyItinerary, getCachedAiInsight, setCachedAiInsight, getLatestEventTimestampForYear
    }), [
        state, auth, isPhoneView, isPremiumUser,
        loginUserWithPassword, registerUserWithEmailPassword, logoutUser, addGrantApplication, reapplyForGrant, rejectPendingApplication,
        makeConditionalOffer, acceptConditionalOffer, declineConditionalOffer, submitEarlyReport, submitFinalReport, approveEarlyReportAndDisburse,
        rejectEarlyReportSubmission, rejectFinalReportSubmission, completeGrantApplication, createSignedUrl, addCluster, addClustersBatch, updateCluster, deleteCluster,
        uploadClusterImage, incrementClusterView, incrementClusterClick, transferClusterOwnership, fetchReviewsForCluster, addReviewForCluster,
        fetchProductsForCluster, addProduct, updateProduct, deleteProduct, uploadProductImage, addEvent, updateEvent, deleteEvent, uploadEventImage, getNotificationsForCurrentUser, markNotificationAsRead, markAllNotificationsAsRead,
        clearAllNotifications, deleteGlobalNotification, editUser, deleteUser, updateCurrentUserName, updateCurrentUserPassword, deleteCurrentUserAccount,
        addFeedback, updateFeedbackStatus, fetchAllPromotions, addPromotion, updatePromotion, deletePromotion, uploadPromotionImage, refreshDashboardPromotions,
        uploadBannerImage, updateBannerImageUrl, deleteBannerImage, updateBannerOverlayOpacity, setMaintenanceStatus,
        setSiteBanner, sendGlobalPanelNotification, getDailyClusterAnalytics, uploadVisitorAnalyticsBatch, addItineraryItem, removeItineraryItem, clearMyItinerary, getCachedAiInsight, setCachedAiInsight, getLatestEventTimestampForYear,
        togglePhoneView
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};
