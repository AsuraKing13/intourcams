export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_insights: {
        Row: {
          id: number
          created_at: string
          view_name: string
          filter_key: string
          content: string
          data_last_updated_at: string
        }
        Insert: {
          id?: number
          created_at?: string
          view_name: string
          filter_key: string
          content: string
          data_last_updated_at: string
        }
        Update: {
          id?: number
          created_at?: string
          view_name?: string
          filter_key?: string
          content?: string
          data_last_updated_at?: string
        }
      }
      app_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
      }
      cluster_analytics: {
        Row: {
          cluster_id: string
          created_at: string
          id: number
          type: string
        }
        Insert: {
          cluster_id: string
          created_at?: string
          id?: number
          type: string
        }
        Update: {
          cluster_id?: string
          created_at?: string
          id?: number
          type?: string
        }
      }
      cluster_products: {
        Row: {
          cluster_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          owner_id: string
          price_range: string | null
        }
        Insert: {
          cluster_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          owner_id: string
          price_range?: string | null
        }
        Update: {
          cluster_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string
          price_range?: string | null
        }
      }
      cluster_reviews: {
        Row: {
          cluster_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          cluster_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          cluster_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
      }
      clusters: {
        Row: {
          average_rating: number
          category: string[]
          click_count: number
          created_at: string
          description: string
          display_address: string | null
          id: string
          image: string
          is_hidden: boolean
          is_preferred: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          owner_id: string | null
          review_count: number
          timing: string
          view_count: number
        }
        Insert: {
          average_rating?: number
          category?: string[]
          click_count?: number
          created_at?: string
          description: string
          display_address?: string | null
          id?: string
          image: string
          is_hidden?: boolean
          is_preferred?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          owner_id?: string | null
          review_count?: number
          timing: string
          view_count?: number
        }
        Update: {
          average_rating?: number
          category?: string[]
          click_count?: number
          created_at?: string
          description?: string
          display_address?: string | null
          id?: string
          image?: string
          is_hidden?: boolean
          is_preferred?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          owner_id?: string | null
          review_count?: number
          timing?: string
          view_count?: number
        }
      }
      events: {
        Row: {
          category: string
          contact_info: string | null
          created_at: string
          created_by: string
          description: string
          display_address: string | null
          end_date: string
          id: string
          image_url: string | null
          latitude: number | null
          location_name: string
          longitude: number | null
          marker_color: string | null
          organizer: string
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          contact_info?: string | null
          created_at?: string
          created_by: string
          description: string
          display_address?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          location_name: string
          longitude?: number | null
          marker_color?: string | null
          organizer: string
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          contact_info?: string | null
          created_at?: string
          created_by?: string
          description?: string
          display_address?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          marker_color?: string | null
          organizer?: string
          start_date?: string
          title?: string
          updated_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          created_at: string
          content: string
          user_id: string | null
          user_email: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          page_context: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          user_id?: string | null
          user_email?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          page_context?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          user_id?: string | null
          user_email?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          page_context?: string | null
        }
      }
      grant_applications: {
        Row: {
          amount_approved: number | null
          amount_requested: number
          applicant_id: string
          contact_number: string | null
          creative_sub_category_id: string | null
          early_report_files: Json
          early_report_rejection_count: number | null
          email: string
          end_date: string
          final_disbursement_amount: number | null
          final_report_files: Json
          final_report_rejection_count: number | null
          grant_category_id: string
          id: string
          initial_disbursement_amount: number | null
          last_update_timestamp: string
          notes: string | null
          organization_name: string
          primary_creative_category_id: string | null
          program_start_date: string
          project_description: string
          project_name: string
          resubmission_count: number
          resubmitted_from_id: string | null
          status: Database["public"]["Enums"]["grant_application_status"]
          status_history: Json
          submission_timestamp: string
        }
        Insert: {
          amount_approved?: number | null
          amount_requested: number
          applicant_id: string
          contact_number?: string | null
          creative_sub_category_id?: string | null
          early_report_files?: Json
          early_report_rejection_count?: number | null
          email: string
          end_date: string
          final_disbursement_amount?: number | null
          final_report_files?: Json
          final_report_rejection_count?: number | null
          grant_category_id: string
          id: string
          initial_disbursement_amount?: number | null
          last_update_timestamp: string
          notes?: string | null
          organization_name: string
          primary_creative_category_id?: string | null
          program_start_date: string
          project_description: string
          project_name: string
          resubmission_count?: number
          resubmitted_from_id?: string | null
          status: Database["public"]["Enums"]["grant_application_status"]
          status_history: Json
          submission_timestamp: string
        }
        Update: {
          amount_approved?: number | null
          amount_requested?: number
          applicant_id?: string
          contact_number?: string | null
          creative_sub_category_id?: string | null
          early_report_files?: Json
          early_report_rejection_count?: number | null
          email?: string
          end_date?: string
          final_disbursement_amount?: number | null
          final_report_files?: Json
          final_report_rejection_count?: number | null
          grant_category_id?: string
          id?: string
          initial_disbursement_amount?: number | null
          last_update_timestamp?: string
          notes?: string | null
          organization_name?: string
          primary_creative_category_id?: string | null
          program_start_date?: string
          project_description?: string
          project_name?: string
          resubmission_count?: number
          resubmitted_from_id?: string | null
          status?: Database["public"]["Enums"]["grant_application_status"]
          status_history?: Json
          submission_timestamp?: string
        }
      }
      itineraries: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      itinerary_items: {
        Row: {
          id: string
          itinerary_id: string
          item_id: string
          item_type: "cluster" | "event"
          item_name: string
          added_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          item_id: string
          item_type: "cluster" | "event"
          item_name: string
          added_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          item_id?: string
          item_type?: "cluster" | "event"
          item_name?: string
          added_at?: string
        }
      }
      notifications: {
        Row: {
          cleared_by: string[] | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          read: boolean
          read_by: string[] | null
          recipient_id: string
          related_application_id: string | null
          timestamp: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          cleared_by?: string[] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          read?: boolean
          read_by?: string[] | null
          recipient_id: string
          related_application_id?: string | null
          timestamp: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          cleared_by?: string[] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          read?: boolean
          read_by?: string[] | null
          recipient_id?: string
          related_application_id?: string | null
          timestamp?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
      }
      promotions: {
        Row: {
          created_at: string
          created_by: string
          cta_link: string | null
          cta_text: string
          description: string
          id: number
          image_url: string
          is_active: boolean
          requires_auth: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          cta_link?: string | null
          cta_text: string
          description: string
          id?: number
          image_url: string
          is_active?: boolean
          requires_auth?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          cta_link?: string | null
          cta_text?: string
          description?: string
          id?: number
          image_url?: string
          is_active?: boolean
          requires_auth?: boolean
          sort_order?: number
          title?: string
        }
      }
      public_holidays: {
        Row: {
          date: string
          name: string
        }
        Insert: {
          date: string
          name: string
        }
        Update: {
          date?: string
          name?: string
        }
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          tier: Database["public"]["Enums"]["user_tier"]
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          tier?: Database["public"]["Enums"]["user_tier"]
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          tier?: Database["public"]["Enums"]["user_tier"]
        }
      }
      visitor_analytics: {
        Row: {
          count: number
          country: string
          id: number
          month: number
          visitor_type: string
          year: number
        }
        Insert: {
          count: number
          country: string
          id?: number
          month: number
          visitor_type: string
          year: number
        }
        Update: {
          count?: number
          country?: string
          id?: number
          month?: number
          visitor_type?: string
          year?: number
        }
      }
      website_traffic_analytics: {
        Row: {
          id: number
          created_at: string
          page_path: string | null
          user_id: string | null
          session_id: string
        }
        Insert: {
          id?: number
          created_at?: string
          page_path?: string | null
          user_id?: string | null
          session_id: string
        }
        Update: {
          id?: number
          created_at?: string
          page_path?: string | null
          user_id?: string | null
          session_id?: string
        }
      }
    }
    Views: {}
    Functions: {
      admin_approve_early_report: {
        Args: any
        Returns: undefined
      }
      admin_complete_application: {
        Args: any
        Returns: undefined
      }
      admin_make_conditional_offer: {
        Args: any
        Returns: undefined
      }
      admin_reject_application: {
        Args: any
        Returns: undefined
      }
      admin_reject_early_report: {
        Args: any
        Returns: undefined
      }
      admin_reject_final_report: {
        Args: any
        Returns: undefined
      }
      create_global_notification: {
        Args: any
        Returns: undefined
      }
      delete_own_user_account: {
        Args: any
        Returns: undefined
      }
      get_daily_cluster_analytics: {
        Args: {
          p_cluster_id: string
          p_period_days: number
        }
        Returns: {
          date: string
          views: number
          clicks: number
        }[]
      }
      get_public_total_visits: {
        Args: any
        Returns: number
      }
      get_reviews_with_usernames: {
        Args: {
          p_cluster_id: string
        }
        Returns: {
          id: string
          cluster_id: string
          user_id: string
          user_name: string
          rating: number
          comment: string | null
          created_at: string
        }[]
      }
      get_website_traffic_summary: {
        Args: {
          p_period_days: number
        }
        Returns: Json
      }
      handle_grant_offer_response: {
        Args: any
        Returns: undefined
      }
      increment_cluster_click: {
        Args: any
        Returns: undefined
      }
      increment_cluster_view: {
        Args: any
        Returns: undefined
      }
      log_page_view: {
        Args: any
        Returns: undefined
      }
      mark_notifications_cleared_by_user: {
        Args: any
        Returns: undefined
      }
      send_notification_to_all_users: {
        Args: any
        Returns: undefined
      }
      submit_report: {
        Args: any
        Returns: undefined
      }
      transfer_cluster_ownership: {
        Args: any
        Returns: undefined
      }
      update_feedback_status: {
        Args: any
        Returns: undefined
      }
      upload_visitor_analytics_batch: {
        Args: any
        Returns: undefined
      }
    }
    Enums: {
      feedback_status: "new" | "seen" | "archived"
      grant_application_status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Conditional Offer"
        | "Early Report Required"
        | "Early Report Submitted"
        | "Final Report Required"
        | "Final Report Submitted"
        | "Complete"
      notification_type:
        | "new_app"
        | "resubmission"
        | "submission_confirm"
        | "auto_rejection"
        | "status_change"
      user_role: "Admin" | "Editor" | "User" | "Tourism Player"
      user_tier: "Normal" | "Premium"
    }
    CompositeTypes: {}
  }
}

// FIX: Replaced complex, auto-generated helper types with simpler, more stable versions
// to resolve widespread `... is not assignable to type 'never'` errors. This is often
// caused by a version mismatch between the Supabase client and the generated types.
// These simpler types work for projects using a single 'public' schema.
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];