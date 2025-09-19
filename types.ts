
import React from 'react';
import type { Database } from './database.types.ts';

// =================================================================
// --- ENUMS Sourced from Supabase Schema ---
// =================================================================
export type GrantApplicationStatus = Database["public"]["Enums"]["grant_application_status"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type FeedbackStatus = Database["public"]["Enums"]["feedback_status"];
export type UserTier = Database["public"]["Enums"]["user_tier"];


// =================================================================
// --- AUGMENTED/HELPER TYPES (Client-Side Enhancements) ---
// =================================================================
/** Defines a creative sub-category, typically used within a PrimaryCreativeCategoryDef. */
export interface CreativeSubCategoryDef {
  id: string;
  name: string;
}

/** Represents a single entry in the status history of a grant application. */
export interface StatusHistoryEntry {
  status: GrantApplicationStatus;
  timestamp: string;
  notes: string;
  changed_by: string;
}

/** Represents a file submitted as part of a grant report. */
export interface ReportFile {
  path: string;
  file_name: string;
  submitted_at: string;
}

/** Defines a primary creative category and its potential subcategories. */
export interface PrimaryCreativeCategoryDef {
  id: string;
  name: string;
  subcategories: CreativeSubCategoryDef[];
}

/** Data shape for visitor analytics. */
export type VisitorAnalyticsData = {
  year: number;
  month: number;
  country: string;
  visitor_type: 'International' | 'Domestic';
  count: number;
};


// =================================================================
// --- CORE DATA MODELS (Derived from Supabase Table Rows) ---
// =================================================================
/** Using Omit<> creates a more robust type that won't break if columns are added to the DB.
 * It creates a client-side type from the DB row type, then modifies specific fields (e.g., JSON to structured object).
 */

type UserDbRow = Database["public"]["Tables"]["users"]["Row"];
export interface User extends UserDbRow {}

type ClusterDbRow = Database["public"]["Tables"]["clusters"]["Row"];
export interface Cluster extends ClusterDbRow {}

type ClusterProductDbRow = Database["public"]["Tables"]["cluster_products"]["Row"];
export interface ClusterProduct extends ClusterProductDbRow {}

type ClusterAnalyticDbRow = Database["public"]["Tables"]["cluster_analytics"]["Row"];
export interface ClusterAnalytic extends ClusterAnalyticDbRow {}

type ClusterReviewDbRow = Database["public"]["Tables"]["cluster_reviews"]["Row"];
export type ClusterReview = Omit<ClusterReviewDbRow, 'user_id'> & {
    user_id: ClusterReviewDbRow['user_id'];
    user_name: string; // Augmented property joined from the users table.
};

type AppEventDbRow = Database["public"]["Tables"]["events"]["Row"];
export interface AppEvent extends AppEventDbRow {}

type GrantApplicationDbRow = Database["public"]["Tables"]["grant_applications"]["Row"];
export type GrantApplication = Omit<GrantApplicationDbRow, 'status_history' | 'early_report_files' | 'final_report_files'> & {
    status_history: StatusHistoryEntry[]; // JSONB in DB, structured array on client.
    early_report_files: ReportFile[];
    final_report_files: ReportFile[];
};

type NotificationDbRow = Database["public"]["Tables"]["notifications"]["Row"];
export type Notification = Omit<NotificationDbRow, 'cleared_by' | 'read_by'> & {
    cleared_by: string[]; // UUID[] in DB can be null, we default to empty array on client.
    read_by: string[];
};

type PublicHolidayDbRow = Database["public"]["Tables"]["public_holidays"]["Row"];
export interface PublicHoliday extends PublicHolidayDbRow {}

type PromotionItemDbRow = Database["public"]["Tables"]["promotions"]["Row"];
export type PromotionItem = Omit<PromotionItemDbRow, 'cta_link'> & {
    cta_link?: ViewName | string | null; // Augment to allow ViewName enum for internal links.
};

type FeedbackDbRow = Database["public"]["Tables"]["feedback"]["Row"];
export interface Feedback extends FeedbackDbRow {}

// FIX: Corrected ItineraryDbRow to reference the newly added table definition in database.types.ts
type ItineraryDbRow = Database["public"]["Tables"]["itineraries"]["Row"];
export interface Itinerary extends ItineraryDbRow {}

// FIX: Corrected ItineraryItemDbRow to reference the newly added table definition in database.types.ts
type ItineraryItemDbRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
export interface ItineraryItem extends ItineraryItemDbRow {}


// =================================================================
// --- UI-SPECIFIC & OTHER HELPER TYPES ---
// =================================================================
export enum ViewName {
  MainMenu = 'Main Menu',
  Dashboard = 'Dashboard',
  TourismCluster = 'Tourism Cluster',
  TourismMapping = 'Tourism Mapping',
  ManageMyClusters = 'Manage My Clusters',
  GrantApplications = 'Grant Applications',
  TourismStatistics = 'Tourism Statistics',
  EventsCalendar = 'Events Calendar',
  AIPlanner = 'AI Planner',
  UserManagement = 'User Management',
  WebsiteManagement = 'Website Management',
  SystemFeedback = 'System Feedback',
  Settings = 'Settings',
}

export type Theme = 'dark' | 'light';

export type FontSize = 'normal' | 'large' | 'extra-large';
export type ContrastMode = 'normal' | 'high';

export interface AccessibilitySettings {
  fontSize: FontSize;
  contrastMode: ContrastMode;
}

export interface NavItemType {
  name: ViewName;
  icon: React.FC<{ className?: string }>;
}

export interface RecentActivity {
  id: string;
  icon: React.FC<{ className?: string }>;
  text: string;
  time: string;
}

export interface GrantCategory {
  id: string;
  name: string;
}

export interface EventItem {
  day: number;
  description: string;
}


// =================================================================
// --- DATA TRANSFER OBJECTS (DTOs for Forms) ---
// =================================================================
export type AddGrantApplicationData = {
  organization_name: string;
  email: string;
  contact_number: string | null;
  grant_category_id: string;
  primary_creative_category_id: string | null;
  creative_sub_category_id: string | null;
  project_name: string;
  project_description: string;
  program_start_date: string;
  end_date: string;
  amount_requested: number;
};

export type AddClusterData = {
    name: string;
    location: string; // User-editable display name
    description: string;
    category: string[];
    timing: string;
    image: string;
    is_preferred?: boolean | null;
    latitude: number | null;
    longitude: number | null;
    display_address: string | null; // Address from geocoding service
};

export type AddClusterProductData = {
    cluster_id: string;
    name: string;
    description: string | null;
    price_range: string | null;
    image_url: string | null;
};

export type AddEventData = {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location_name: string; // User-editable display name
    category: string;
    organizer: string;
    image_url: string | null;
    marker_color: string | null;
    contact_info: string | null;
    latitude: number | null;
    longitude: number | null;
    display_address: string | null; // Address from geocoding service
};

export type AddPromotionData = {
    title: string;
    description: string;
    image_url: string;
    cta_text: string;
    cta_link: string | null;
    requires_auth: boolean;
    is_active: boolean;
    sort_order: number;
};