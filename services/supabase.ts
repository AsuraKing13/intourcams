import { createClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate, Json } from '../database.types.ts';
import { AppEvent, Cluster, GrantApplication, Notification, User, PublicHoliday, PromotionItem, AddGrantApplicationData, AddClusterData, AddEventData, AddPromotionData, ClusterProduct, AddClusterProductData, VisitorAnalyticsData, Feedback, FeedbackStatus, UserRole, UserTier, ClusterReview, ClusterAnalytic, ItineraryItem, WebsiteTrafficSummary } from '../types.ts';
import { parseGrantApplication } from '../utils/parsers.ts';
import type { PostgrestError } from '@supabase/supabase-js';

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
    deleteCurrentUserAccount: async () => {
        const { error } = await (supabase.rpc as any)('delete_own_user_account', {});
        if (error) throw error;
    },

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
    addGrantApplication: (newApplication: TablesInsert<'grant_applications'>) => (supabaseClient.from('grant_applications') as any).insert(newApplication),
    createAdminNotification: (payload: TablesInsert<'notifications'>) => (supabaseClient.from('notifications') as any).insert(payload),
    rejectPendingApplication: (appId: string, notes: string) => (supabaseClient.rpc as any)('admin_reject_application', { p_application_id: appId, p_notes: notes }),
    makeConditionalOffer: (appId: string, notes: string, amount: number) => (supabaseClient.rpc as any)('admin_make_conditional_offer', { p_application_id: appId, p_notes: notes, p_amount_approved: amount }),
    acceptConditionalOffer: (appId: string) => (supabaseClient.rpc as any)('handle_grant_offer_response', { p_application_id: appId, p_accepted: true }),
    declineConditionalOffer: (appId: string) => (supabaseClient.rpc as any)('handle_grant_offer_response', { p_application_id: appId, p_accepted: false }),
    submitReport: (appId: string, reportFile: any, reportType: 'early' | 'final') => (supabaseClient.rpc as any)('submit_report', { p_application_id: appId, p_report_file: reportFile as unknown as Json, p_report_type: reportType }),
    approveEarlyReportAndDisburse: (appId: string, amount: number, notes: string) => (supabaseClient.rpc as any)('admin_approve_early_report', { p_application_id: appId, p_disbursement_amount: amount, p_notes: notes }),
    rejectEarlyReportSubmission: (appId: string, notes: string) => (supabaseClient.rpc as any)('admin_reject_early_report', { p_application_id: appId, p_notes: notes }),
    rejectFinalReportSubmission: (appId: string, notes: string) => (supabaseClient.rpc as any)('admin_reject_final_report', { p_application_id: appId, p_notes: notes }),
    completeGrantApplication: (appId: string, amount: number, notes: string) => (supabaseClient.rpc as any)('admin_complete_application', { p_application_id: appId, p_final_disbursement_amount: amount, p_notes: notes }),

    // --- Clusters ---
    addCluster: (newCluster: TablesInsert<'clusters'>) => (supabaseClient.from('clusters') as any).insert(newCluster),
    addClustersBatch: (payload: TablesInsert<'clusters'>[]) => (supabaseClient.from('clusters') as any).insert(payload),
    updateCluster: (id: string, data: TablesUpdate<'clusters'>) => (supabaseClient.from('clusters') as any).update(data).eq('id', id),
    deleteCluster: (id: string) => supabaseClient.from('clusters').delete().eq('id', id),
    incrementClusterView: (clusterId: string) => (supabaseClient.rpc as any)('increment_cluster_view', { cluster_id_to_increment: clusterId }),
    incrementClusterClick: (clusterId: string) => (supabaseClient.rpc as any)('increment_cluster_click', { cluster_id_to_increment: clusterId }),
    transferClusterOwnership: (clusterId: string, newOwnerId: string) => (supabaseClient.rpc as any)('transfer_cluster_ownership', { p_cluster_id: clusterId, p_new_owner_id: newOwnerId }),

    // --- Cluster Reviews & Products ---
    async fetchReviewsForCluster(clusterId: string): Promise<ClusterReview[]> {
        const { data, error } = await (supabaseClient.rpc as any)('get_reviews_with_usernames', { p_cluster_id: clusterId });
        if (error) throw error;
        return (data as any) || [];
    },
    async addReviewForCluster(newReview: TablesInsert<'cluster_reviews'>) {
        const { data, error } = await (supabaseClient.from('cluster_reviews') as any).insert(newReview).select().single();
        if (error) throw error;
        return data;
    },
    async fetchProductsForCluster(clusterId: string): Promise<ClusterProduct[]> {
        const { data, error } = await supabaseClient.from('cluster_products').select('*').eq('cluster_id', clusterId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    addProduct: (newProduct: TablesInsert<'cluster_products'>) => (supabaseClient.from('cluster_products') as any).insert(newProduct),
    updateProduct: (id: string, data: Partial<AddClusterProductData>) => (supabaseClient.from('cluster_products') as any).update(data).eq('id', id),
    deleteProduct: (id: string) => supabaseClient.from('cluster_products').delete().eq('id', id),

    // --- Events ---
    addEvent: (newEvent: TablesInsert<'events'>) => (supabaseClient.from('events') as any).insert(newEvent),
    updateEvent: (id: string, data: Partial<AddEventData>) => (supabaseClient.from('events') as any).update(data).eq('id', id),
    deleteEvent: (id: string) => supabaseClient.from('events').delete().eq('id', id),

    // --- Notifications ---
    markNotificationAsRead: (id: string, payload: TablesUpdate<'notifications'>) => (supabaseClient.from('notifications') as any).update(payload).eq('id', id),
    clearAllNotifications: (notificationIds: string[]) => (supabaseClient.rpc as any)('mark_notifications_cleared_by_user', { p_notification_ids: notificationIds }),
    deleteGlobalNotification: (id: string) => supabaseClient.from('notifications').delete().eq('id', id),

    // --- User Management ---
    editUser: (id: string, payload: TablesUpdate<'users'>) => (supabaseClient.from('users') as any).update(payload).eq('id', id),
    
    // --- Feedback ---
    addFeedback: (payload: TablesInsert<'feedback'>) => (supabaseClient.from('feedback') as any).insert(payload),
    updateFeedbackStatus: (id: string, status: FeedbackStatus) => (supabaseClient.rpc as any)('update_feedback_status', { p_id: id, p_status: status }),
    
    // --- Promotions ---
    addPromotion: (payload: TablesInsert<'promotions'>) => (supabaseClient.from('promotions') as any).insert(payload),
    updatePromotion: (id: number, payload: TablesUpdate<'promotions'>) => (supabaseClient.from('promotions') as any).update(payload).eq('id', id),
    deletePromotion: (id: number) => supabaseClient.from('promotions').delete().eq('id', id),

    // --- Website Management ---
    updateAppConfig: (payload: TablesUpdate<'app_config'>, key: string) => (supabaseClient.from('app_config') as any).update(payload).eq('key', key),
    upsertAppConfig: (payload: TablesInsert<'app_config'>) => (supabaseClient.from('app_config') as any).upsert(payload),
    setSiteBanner: async (message: string, expires_at: string | null) => {
        const { data: bannersToDelete, error: fetchError } = await supabaseClient.from('notifications').select('id').eq('recipient_id', 'global_banner');
        if (fetchError) throw fetchError;
        if (bannersToDelete && bannersToDelete.length > 0) {
            const ids = bannersToDelete.map(b => b.id);
            const { error: deleteError } = await supabaseClient.from('notifications').delete().in('id', ids);
            if (deleteError) throw deleteError;
        }
        const newBanner: TablesInsert<'notifications'> = { 
            id: crypto.randomUUID(), recipient_id: 'global_banner', message, 
            type: 'status_change', timestamp: new Date().toISOString(), expires_at 
        };
        await (supabaseClient.from('notifications') as any).insert(newBanner);
    },
    sendGlobalPanelNotification: (message: string) => (supabaseClient.rpc as any)('send_notification_to_all_users', { p_message: message }),

    // --- Analytics ---
    uploadVisitorAnalyticsBatch: (data: VisitorAnalyticsData[]) => (supabaseClient.rpc as any)('upload_visitor_analytics_batch', { p_data: data as unknown as Json }),
    logPageView: (pagePath: string, sessionId: string) => (supabaseClient.rpc as any)('log_page_view', { p_page_path: pagePath, p_session_id: sessionId }),
    async getWebsiteTrafficSummary(periodDays: number): Promise<WebsiteTrafficSummary> {
        const { data, error } = await (supabaseClient.rpc as any)('get_website_traffic_summary', { p_period_days: periodDays });
        if (error) throw error;
        return data as unknown as WebsiteTrafficSummary;
    },
    async getPublicTotalVisits(): Promise<number | null> {
        // FIX: RPC calls for functions with no arguments require passing an empty object `{}` to prevent schema cache errors.
        const { data, error } = await (supabaseClient.rpc as any)('get_public_total_visits', {});
        if (error) {
            console.error("Error fetching public total visits:", error);
            throw error;
        }
        return data;
    },
    async getDailyClusterAnalytics(clusterId: string, periodDays: number) {
        const { data, error } = await (supabaseClient.rpc as any)('get_daily_cluster_analytics', { p_cluster_id: clusterId, p_period_days: periodDays });
        if (error) throw error;
        return data || [];
    },

    // --- AI Caching ---
    async getCachedAiInsight(viewName: string, filterKey: string) {
        const { data, error } = await supabaseClient.from('ai_insights').select('content, data_last_updated_at').eq('view_name', viewName).eq('filter_key', filterKey).single();
        if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
        return data;
    },
    setCachedAiInsight: (viewName: string, filterKey: string, content: string, dataLastUpdatedAt: string) => (supabaseClient.from('ai_insights') as any).upsert(
        { view_name: viewName, filter_key: filterKey, content, data_last_updated_at: dataLastUpdatedAt },
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
    async findOrCreateItinerary(userId: string): Promise<string> {
        const { data, error }: { data: { id: string } | null; error: PostgrestError | null } = await supabaseClient.from('itineraries').select('id').eq('user_id', userId).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) return data.id;
        
        // FIX: Removed 'as any' to allow proper type inference for the insert operation's result.
        // The 'as any' was causing `newData` to be inferred as `never`, leading to a compile-time error.
        const { data: newData, error: insertError } = await supabaseClient.from('itineraries').insert({ user_id: userId, name: "My Itinerary" }).select().single();
        if (insertError) throw insertError;
        if (!newData) throw new Error("Itinerary creation failed: no data returned.");
        return newData.id;
    },
    async fetchMyItineraryItems(itineraryId: string): Promise<ItineraryItem[]> {
        const { data, error } = await supabaseClient
            .from('itinerary_items')
            .select('*')
            .eq('itinerary_id', itineraryId)
            .order('added_at', { ascending: true });
        if (error) throw error;
        return (data as ItineraryItem[]) || [];
    },
    addItineraryItem: (item: TablesInsert<'itinerary_items'>) => (supabaseClient.from('itinerary_items') as any).insert(item),
    removeItineraryItem: (itemId: string) => supabaseClient.from('itinerary_items').delete().eq('id', itemId),
    clearMyItinerary: (itineraryId: string) => supabaseClient.from('itinerary_items').delete().eq('itinerary_id', itineraryId),
};