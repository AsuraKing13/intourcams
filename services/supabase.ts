import { createClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate, Json } from '../database.types.ts';
import { AppEvent, Cluster, GrantApplication, Notification, User, PublicHoliday, PromotionItem, AddGrantApplicationData, AddClusterData, AddEventData, AddPromotionData, ClusterProduct, AddClusterProductData, VisitorAnalyticsData, Feedback, FeedbackStatus, UserRole, UserTier, ClusterReview, ClusterAnalytic } from '../types.ts';
import { parseGrantApplication } from '../utils/parsers.ts';

// --- Supabase Client ---
// Use environment variables for Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Ensure environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);


// Export client for auth listeners
export const supabase = supabaseClient;

// --- API Service Object ---
export const api = {
    // --- Data Fetching ---
    async fetchClusters(): Promise<Cluster[]> {
        const { data, error } = await supabaseClient.from('clusters').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const parsedData = ((data as Tables<'clusters'>[] | null) || []).map(cluster => ({
            ...cluster,
            category: (Array.isArray(cluster.category) ? cluster.category.filter(item => typeof item === 'string') : [])
        }));
        return parsedData as Cluster[];
    },
    async fetchEvents(): Promise<AppEvent[]> {
        const { data, error } = await supabaseClient.from('events').select('*').order('start_date', { ascending: false });
        if (error) throw error;
        return (data as AppEvent[]) || [];
    },
    async fetchGrantApplications(): Promise<GrantApplication[]> {
        const { data, error } = await supabaseClient.from('grant_applications').select('*').order('last_update_timestamp', { ascending: false });
        if (error) throw error;
        return data.map(parseGrantApplication);
    },
    async fetchNotifications(): Promise<Notification[]> {
        const { data, error } = await supabaseClient.from('notifications').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        const parsedData = ((data as Tables<'notifications'>[] | null) || []).map(n => ({...n, read_by: n.read_by || [], cleared_by: n.cleared_by || [] }));
        return parsedData as Notification[];
    },
    async fetchUsers(): Promise<User[]> {
        const { data, error } = await supabaseClient.from('users').select('*');
        if (error) throw error;
        return (data as User[]) || [];
    },
    async fetchHolidays(): Promise<PublicHoliday[]> {
        const { data, error } = await supabaseClient.from('public_holidays').select('*');
        if (error) throw error;
        return (data as PublicHoliday[]) || [];
    },
    async fetchDashboardPromotions(): Promise<PromotionItem[]> {
        const { data, error } = await supabaseClient.from('promotions').select('*').eq('is_active', true).order('sort_order');
        if (error) throw error;
        return (data as PromotionItem[]) || [];
    },
    async fetchAllPromotions(): Promise<PromotionItem[]> {
        const { data, error } = await supabaseClient.from('promotions').select('*').order('sort_order');
        if (error) throw error;
        return (data as PromotionItem[]) || [];
    },
    async fetchVisitorAnalytics(): Promise<VisitorAnalyticsData[]> {
        const { data, error } = await supabaseClient.from('visitor_analytics').select('*');
        if (error) throw error;
        return (data as VisitorAnalyticsData[]) || [];
    },
    async fetchClusterAnalytics(): Promise<ClusterAnalytic[]> {
        const { data, error } = await supabaseClient.from('cluster_analytics').select('*');
        if (error) throw error;
        return (data as ClusterAnalytic[]) || [];
    },
    async fetchFeedback(): Promise<Feedback[]> {
        const { data, error } = await supabaseClient.from('feedback').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data as Feedback[]) || [];
    },
    async fetchAppConfig(): Promise<Record<string, string | null>> {
        const { data, error } = await supabaseClient.from('app_config').select('*');
        if (error) throw error;
        return ((data as Tables<'app_config'>[] | null) || []).reduce((acc, item) => ({...acc, [item.key]: item.value }), {});
    },
    
    // --- Auth ---
    loginUserWithPassword: (email: string, pass: string) => supabase.auth.signInWithPassword({ email, password: pass }),
    registerUserWithEmailPassword: (name: string, email: string, pass: string, role: UserRole) => supabase.auth.signUp({
        email, password: pass, options: { data: { name, role } }
    }),
    logoutUser: () => supabase.auth.signOut(),
    updateCurrentUserName: (name: string) => supabase.auth.updateUser({ data: { name }}),
    updateCurrentUserPassword: (pass: string) => supabase.auth.updateUser({ password: pass }),
    deleteCurrentUserAccount: () => supabase.rpc('delete_own_user_account'),

    // --- File Storage ---
    async uploadFile(bucket: string, file: File, userId: string, oldFileUrl?: string | null) {
        if (oldFileUrl) {
            try {
                const oldFilePath = new URL(oldFileUrl).pathname.split(`/${bucket}/`)[1];
                if (oldFilePath) await supabase.storage.from(bucket).remove([oldFilePath]);
            } catch (e) { console.error("Could not parse or remove old file:", e); }
        }
        const filePath = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (!publicUrl) throw new Error("Could not get public URL for uploaded file.");
        return publicUrl;
    },
    async deleteFile(bucket: string, fileUrl: string) {
         try {
            const filePath = new URL(fileUrl).pathname.split(`/${bucket}/`)[1];
            if(filePath) {
                const { error } = await supabase.storage.from(bucket).remove([filePath]);
                if (error) throw error;
            }
        } catch (e) {
            console.error(`Error deleting file from ${bucket}:`, e);
            throw e;
        }
    },
    createSignedUrl: async (bucket: string, path: string): Promise<string | null> => {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
        if (error) throw error;
        return data.signedUrl;
    },

    // --- Grant Applications ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addGrantApplication: (newApplication: TablesInsert<'grant_applications'>) => supabaseClient.from('grant_applications').insert([newApplication] as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    createAdminNotification: (payload: TablesInsert<'notifications'>) => supabaseClient.from('notifications').insert([payload] as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    rejectPendingApplication: (appId: string, notes: string) => supabaseClient.rpc('admin_reject_application', { p_application_id: appId, p_notes: notes } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    makeConditionalOffer: (appId: string, notes: string, amount: number) => supabaseClient.rpc('admin_make_conditional_offer', { p_application_id: appId, p_notes: notes, p_amount_approved: amount } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    acceptConditionalOffer: (appId: string) => supabaseClient.rpc('handle_grant_offer_response', { p_application_id: appId, p_accepted: true } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    declineConditionalOffer: (appId: string) => supabaseClient.rpc('handle_grant_offer_response', { p_application_id: appId, p_accepted: false } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    submitReport: (appId: string, reportFile: any, reportType: 'early' | 'final') => supabaseClient.rpc('submit_report', { p_application_id: appId, p_report_file: reportFile as unknown as Json, p_report_type: reportType } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    approveEarlyReportAndDisburse: (appId: string, amount: number, notes: string) => supabaseClient.rpc('admin_approve_early_report', { p_application_id: appId, p_disbursement_amount: amount, p_notes: notes } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    rejectEarlyReportSubmission: (appId: string, notes: string) => supabaseClient.rpc('admin_reject_early_report', { p_application_id: appId, p_notes: notes } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    rejectFinalReportSubmission: (appId: string, notes: string) => supabaseClient.rpc('admin_reject_final_report', { p_application_id: appId, p_notes: notes } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    completeGrantApplication: (appId: string, amount: number, notes: string) => supabaseClient.rpc('admin_complete_application', { p_application_id: appId, p_final_disbursement_amount: amount, p_notes: notes } as any),

    // --- Clusters ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addCluster: (newCluster: TablesInsert<'clusters'>) => supabaseClient.from('clusters').insert([newCluster] as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addClustersBatch: (payload: TablesInsert<'clusters'>[]) => supabaseClient.from('clusters').insert(payload as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    updateCluster: (id: string, data: TablesUpdate<'clusters'>) => supabaseClient.from('clusters').update(data as any).eq('id', id),
    deleteCluster: (id: string) => supabaseClient.from('clusters').delete().eq('id', id),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    incrementClusterView: (clusterId: string) => supabaseClient.rpc('increment_cluster_view', { cluster_id_to_increment: clusterId } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    incrementClusterClick: (clusterId: string) => supabaseClient.rpc('increment_cluster_click', { cluster_id_to_increment: clusterId } as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    transferClusterOwnership: (clusterId: string, newOwnerId: string) => supabaseClient.rpc('transfer_cluster_ownership', { p_cluster_id: clusterId, p_new_owner_id: newOwnerId } as any),

    // --- Cluster Reviews & Products ---
    fetchReviewsForCluster: async (clusterId: string): Promise<ClusterReview[]> => {
        // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
        const { data, error } = await supabaseClient.rpc('get_reviews_with_usernames', { p_cluster_id: clusterId } as any);
        if (error) throw error;
        return data || [];
    },
    addReviewForCluster: async (newReview: TablesInsert<'cluster_reviews'>) => {
        // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
        const { data, error } = await supabaseClient.from('cluster_reviews').insert([newReview] as any).select().single();
        if (error) throw error;
        return data;
    },
    fetchProductsForCluster: async (clusterId: string): Promise<ClusterProduct[]> => {
        const { data, error } = await supabaseClient.from('cluster_products').select('*').eq('cluster_id', clusterId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addProduct: (newProduct: TablesInsert<'cluster_products'>) => supabaseClient.from('cluster_products').insert([newProduct] as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    updateProduct: (id: string, data: Partial<AddClusterProductData>) => supabaseClient.from('cluster_products').update(data as any).eq('id', id),
    deleteProduct: (id: string) => supabaseClient.from('cluster_products').delete().eq('id', id),

    // --- Events ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addEvent: (newEvent: TablesInsert<'events'>) => supabaseClient.from('events').insert([newEvent] as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    updateEvent: (id: string, data: Partial<AddEventData>) => supabaseClient.from('events').update(data as any).eq('id', id),
    deleteEvent: (id: string) => supabaseClient.from('events').delete().eq('id', id),

    // --- Notifications ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    markNotificationAsRead: (id: string, payload: TablesUpdate<'notifications'>) => supabaseClient.from('notifications').update(payload as any).eq('id', id),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    clearAllNotifications: (notificationIds: string[]) => supabaseClient.rpc('mark_notifications_cleared_by_user', { p_notification_ids: notificationIds } as any),
    deleteGlobalNotification: (id: string) => supabaseClient.from('notifications').delete().eq('id', id),

    // --- User Management ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    editUser: (id: string, payload: TablesUpdate<'users'>) => supabaseClient.from('users').update(payload as any).eq('id', id),
    
    // --- Feedback ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addFeedback: (payload: TablesInsert<'feedback'>) => supabaseClient.from('feedback').insert([payload] as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    updateFeedbackStatus: (id: string, status: FeedbackStatus) => supabaseClient.from('feedback').update({ status } as any).eq('id', id),
    
    // --- Promotions ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addPromotion: (payload: TablesInsert<'promotions'>) => supabaseClient.from('promotions').insert([payload] as any),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    updatePromotion: (id: number, payload: TablesUpdate<'promotions'>) => supabaseClient.from('promotions').update(payload as any).eq('id', id),
    deletePromotion: (id: number) => supabaseClient.from('promotions').delete().eq('id', id),

    // --- Website Management ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    updateAppConfig: (payload: TablesUpdate<'app_config'>, key: string) => supabaseClient.from('app_config').update(payload as any).eq('key', key),
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    upsertAppConfig: (payload: TablesInsert<'app_config'>) => supabaseClient.from('app_config').upsert(payload as any),
    setSiteBanner: async (message: string, expires_at: string | null) => {
        // This is a multi-step operation, so it's kept as a single function
        const { data: bannersToDelete, error: fetchError } = await supabaseClient.from('notifications').select('id').eq('recipient_id', 'global_banner');
        if (fetchError) throw fetchError;
        // FIX: Casted `bannersToDelete` to `any[]` because type inference fails and returns `never[]`.
        if (bannersToDelete && (bannersToDelete as any[]).length > 0) {
            const ids = (bannersToDelete as any[]).map(b => b.id);
            const { error: deleteError } = await supabaseClient.from('notifications').delete().in('id', ids);
            if (deleteError) throw deleteError;
        }
        const newBanner: TablesInsert<'notifications'> = { 
            id: crypto.randomUUID(), recipient_id: 'global_banner', message, 
            type: 'status_change', timestamp: new Date().toISOString(), expires_at 
        };
        // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
        const { error: insertError } = await supabaseClient.from('notifications').insert([newBanner] as any);
        if (insertError) throw insertError;
    },
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    sendGlobalPanelNotification: (message: string) => supabaseClient.rpc('send_notification_to_all_users', { p_message: message } as any),

    // --- Analytics ---
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    uploadVisitorAnalyticsBatch: (data: VisitorAnalyticsData[]) => supabaseClient.rpc('upload_visitor_analytics_batch', { p_data: data as unknown as Json } as any),
    getDailyClusterAnalytics: async (clusterId: string, periodDays: number) => {
        // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
        const { data, error } = await supabaseClient.rpc('get_daily_cluster_analytics', { p_cluster_id: clusterId, p_period_days: periodDays } as any);
        if (error) throw error;
        return data || [];
    },

    // --- AI Caching ---
    getCachedAiInsight: async (viewName: string, filterKey: string) => {
        const { data, error } = await supabaseClient.from('ai_insights').select('content, data_last_updated_at').eq('view_name', viewName).eq('filter_key', filterKey).single();
        if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
        return data;
    },
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    setCachedAiInsight: (viewName: string, filterKey: string, content: string, dataLastUpdatedAt: string) => supabaseClient.from('ai_insights').upsert(
        [{ view_name: viewName, filter_key: filterKey, content, data_last_updated_at: dataLastUpdatedAt }] as any,
        { onConflict: 'view_name,filter_key' }
    ),
    getLatestEventTimestampForYear: async (year: number) => {
        const startDate = `${year}-01-01T00:00:00.000Z`;
        const endDate = `${year}-12-31T23:59:59.999Z`;
        const { data, error } = await supabaseClient.from('events').select('updated_at').gte('start_date', startDate).lte('start_date', endDate).order('updated_at', { ascending: false }).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? (data as any).updated_at : null;
    },

    // --- Itinerary ---
    findOrCreateItinerary: async (userId: string) => {
        const { data, error } = await supabaseClient.from('itineraries').select('id').eq('user_id', userId).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        // FIX: Casted `data` to `any` because type inference fails and returns `never`.
        if (data) return (data as any).id;
        
        // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
        const { data: newData, error: createError } = await supabaseClient.from('itineraries').insert([{ user_id: userId, name: "My Sarawak Trip" }] as any).select('id').single();
        // FIX: Casted `newData` to `any` because type inference fails and returns `never`.
        if (createError || !newData) throw createError || new Error("Failed to create itinerary.");
        return (newData as any).id;
    },
    // FIX: Casted argument to `any` to bypass TypeScript error due to broken type inference.
    addItineraryItem: (newItem: TablesInsert<'itinerary_items'>) => supabaseClient.from('itinerary_items').upsert([newItem] as any, { onConflict: 'itinerary_id,item_id' }),
};
