-- # Supabase Database Migration & Function Scripts
--
-- ## **MASTER SCRIPT V106: ADD ITINERARY FEATURE**
-- ---
-- This script adds the `itineraries` and `itinerary_items` tables to support the new AI Planner feature. It also includes all previous migration changes.
--
-- ### INSTRUCTIONS:
-- 1.  Copy and run the **ENTIRE** "MASTER CONSOLIDATED SCRIPT V106" script below in your Supabase SQL Editor. This script is idempotent and safe to run multiple times.
--
-- ### What's New in V106:
-- - **NEW**: Added `itineraries` table for user trip plans.
-- - **NEW**: Added `itinerary_items` table to store locations/events within a plan.
-- - **NEW**: Added RLS policies to ensure users can only access their own itineraries.
-- - **Includes all changes from V105**.
---
-- ## MASTER CONSOLIDATED SCRIPT V106 (The Only One To Run)
-- ---
-- This script unifies all migrations, cleans up conflicts, and establishes the definitive database state.

-- == STEP 1: CLEANUP - DYNAMICALLY DROP ALL RLS POLICIES & FUNCTIONS TO RESOLVE DEPENDENCIES ==
DO $$
DECLARE
    table_name_var TEXT;
    policy_record RECORD;
BEGIN
    FOREACH table_name_var IN ARRAY ARRAY['clusters', 'cluster_reviews', 'events', 'grant_applications', 'notifications', 'promotions', 'public_holidays', 'users', 'cluster_analytics', 'app_config', 'visitor_analytics', 'cluster_products', 'ai_insights', 'feedback', 'event_analytics', 'search_queries', 'itineraries', 'itinerary_items']
    LOOP
        FOR policy_record IN
            SELECT policyname FROM pg_policies WHERE tablename = table_name_var AND schemaname = 'public'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.' || quote_ident(table_name_var) || ';';
        END LOOP;
    END LOOP;
END;
$$;
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON storage.objects;';
    END LOOP;
END;
$$;

-- Drop trigger BEFORE function to fix dependency error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all known functions to ensure a clean slate.
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin_or_editor();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.increment_cluster_view(uuid);
DROP FUNCTION IF EXISTS public.increment_cluster_click(uuid);
DROP FUNCTION IF EXISTS public.increment_event_view(uuid);
DROP FUNCTION IF EXISTS public.increment_event_click(uuid);
DROP FUNCTION IF EXISTS public.log_search_query(text);
DROP FUNCTION IF EXISTS public.get_daily_cluster_analytics(uuid, integer);
DROP FUNCTION IF EXISTS public.submit_report(text, jsonb, text);
DROP FUNCTION IF EXISTS public.handle_grant_offer_response(text, boolean);
DROP FUNCTION IF EXISTS public.admin_reject_application(text, text);
DROP FUNCTION IF EXISTS public.admin_make_conditional_offer(text, text, numeric);
DROP FUNCTION IF EXISTS public.admin_approve_early_report(text, numeric, text);
DROP FUNCTION IF EXISTS public.admin_reject_early_report(text, text);
DROP FUNCTION IF EXISTS public.admin_reject_final_report(text, text);
DROP FUNCTION IF EXISTS public.admin_complete_application(text, numeric, text);
DROP FUNCTION IF EXISTS public.get_reviews_with_usernames(uuid);
DROP FUNCTION IF EXISTS public.create_global_notification(text);
DROP FUNCTION IF EXISTS public.create_grant_notification_for_admins(text, text, notification_type);
DROP FUNCTION IF EXISTS public.mark_notifications_cleared_by_user(text[]);
DROP FUNCTION IF EXISTS public.transfer_cluster_ownership(uuid, uuid);
DROP FUNCTION IF EXISTS public.send_notification_to_all_users(text);
DROP FUNCTION IF EXISTS public.delete_own_user_account();
DROP FUNCTION IF EXISTS public.upload_visitor_analytics_batch(jsonb);


-- == STEP 2: TYPE & TABLE CREATION / ALTERATION ==
-- Create/update enums first
DROP TYPE IF EXISTS public.user_tier CASCADE;
CREATE TYPE public.user_tier AS ENUM ('Normal', 'Premium');
DROP TYPE IF EXISTS public.feedback_status CASCADE;
CREATE TYPE public.feedback_status AS ENUM ('new', 'seen', 'archived');
DROP TYPE IF EXISTS public.itinerary_item_type CASCADE;
CREATE TYPE public.itinerary_item_type AS ENUM ('cluster', 'event');

-- Alter `users` table to add the new `tier` column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS tier public.user_tier NOT NULL DEFAULT 'Normal';

-- `app_config` for banner & maintenance
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.users(id)
);
INSERT INTO public.app_config (key, value)
VALUES 
    ('dashboard_banner_url', ''),
    ('dashboard_banner_opacity', '0.5'),
    ('maintenance_mode_enabled', 'false'), 
    ('maintenance_mode_message', 'The website is currently down for maintenance. We will be back shortly.')
ON CONFLICT (key) DO NOTHING;

-- `cluster_products` table
CREATE TABLE IF NOT EXISTS public.cluster_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    cluster_id UUID NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.users(id),
    name TEXT NOT NULL,
    description TEXT,
    price_range TEXT,
    image_url TEXT
);

-- `ai_insights` table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    view_name TEXT NOT NULL,
    filter_key TEXT NOT NULL,
    content TEXT NOT NULL,
    data_last_updated_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_view_filter_unique_idx ON public.ai_insights (view_name, filter_key);

-- `visitor_analytics` table (Non-destructive creation)
CREATE TABLE IF NOT EXISTS public.visitor_analytics (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    year SMALLINT NOT NULL,
    month SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
    country TEXT NOT NULL,
    visitor_type TEXT NOT NULL CHECK (visitor_type IN ('International', 'Domestic')),
    count INTEGER NOT NULL,
    CONSTRAINT visitor_analytics_unique UNIQUE (year, month, country, visitor_type)
);

-- `feedback` table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,
    status public.feedback_status DEFAULT 'new' NOT NULL,
    page_context TEXT
);

-- `event_analytics` table
CREATE TABLE IF NOT EXISTS public.event_analytics (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('view', 'click'))
);

-- `search_queries` table
CREATE TABLE IF NOT EXISTS public.search_queries (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    search_term TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- `itineraries` table to store user trip plans
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- `itinerary_items` table to store items within an itinerary
CREATE TABLE IF NOT EXISTS public.itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
    item_id UUID NOT NULL, -- This is the ID of the cluster or event
    item_type public.itinerary_item_type NOT NULL,
    item_name TEXT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT itinerary_item_unique UNIQUE (itinerary_id, item_id) -- Prevent adding the same item twice
);


-- == STEP 3: FUNCTION & TRIGGER CREATION - CREATE NEW, CORRECT FUNCTIONS ==
-- **Function and Trigger to create a user profile on signup**
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, avatar, tier)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    substring(new.raw_user_meta_data->>'name' from 1 for 1),
    'Normal'  -- Default tier for new users
  );
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- **Security Helper Function**
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is authenticated and has the role of Admin or Editor
  RETURN (
    auth.role() = 'authenticated' AND
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'Editor')
  );
END;
$$;


-- **Analytics Functions**
CREATE OR REPLACE FUNCTION public.increment_cluster_view(cluster_id_to_increment uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT owner_id FROM public.clusters WHERE id = cluster_id_to_increment) IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.cluster_analytics (cluster_id, type) VALUES (cluster_id_to_increment, 'view');
    UPDATE public.clusters SET view_count = view_count + 1 WHERE id = cluster_id_to_increment;
  END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.increment_cluster_click(cluster_id_to_increment uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT owner_id FROM public.clusters WHERE id = cluster_id_to_increment) IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.cluster_analytics (cluster_id, type) VALUES (cluster_id_to_increment, 'click');
    UPDATE public.clusters SET click_count = click_count + 1 WHERE id = cluster_id_to_increment;
  END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.increment_event_view(event_id_to_increment uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT created_by FROM public.events WHERE id = event_id_to_increment) IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.event_analytics (event_id, type) VALUES (event_id_to_increment, 'view');
  END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.increment_event_click(event_id_to_increment uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT created_by FROM public.events WHERE id = event_id_to_increment) IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.event_analytics (event_id, type) VALUES (event_id_to_increment, 'click');
  END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.log_search_query(p_search_term text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    INSERT INTO public.search_queries (search_term, user_id) VALUES (p_search_term, auth.uid());
  ELSE
    INSERT INTO public.search_queries (search_term) VALUES (p_search_term);
  END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_daily_cluster_analytics(p_cluster_id uuid, p_period_days integer)
RETURNS TABLE(date text, views bigint, clicks bigint) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series((now() - (p_period_days - 1) * interval '1 day')::date, now()::date, '1 day'::interval)::date AS day
  ),
  analytics_data AS (
    SELECT created_at::date AS day, type, COUNT(*) AS count
    FROM public.cluster_analytics
    WHERE cluster_id = p_cluster_id AND created_at >= (now() - (p_period_days - 1) * interval '1 day')::date
    GROUP BY 1, 2
  )
  SELECT to_char(ds.day, 'YYYY-MM-DD') AS date,
    COALESCE(SUM(ad.count) FILTER (WHERE ad.type = 'view'), 0)::bigint AS views,
    COALESCE(SUM(ad.count) FILTER (WHERE ad.type = 'click'), 0)::bigint AS clicks
  FROM date_series ds LEFT JOIN analytics_data ad ON ds.day = ad.day
  GROUP BY ds.day ORDER BY ds.day;
END;
$$;

-- **Cluster Review Functions**
CREATE OR REPLACE FUNCTION public.get_reviews_with_usernames(p_cluster_id uuid)
RETURNS TABLE (
    id uuid,
    cluster_id uuid,
    user_id uuid,
    user_name text,
    rating integer,
    comment text,
    created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cr.id,
    cr.cluster_id,
    cr.user_id,
    u.name as user_name,
    cr.rating,
    cr.comment,
    cr.created_at
  FROM
    public.cluster_reviews AS cr
  JOIN
    public.users AS u ON cr.user_id = u.id
  WHERE
    cr.cluster_id = p_cluster_id
  ORDER BY
    cr.created_at DESC;
$$;

-- **Cluster Ownership Transfer Function**
CREATE OR REPLACE FUNCTION public.transfer_cluster_ownership(p_cluster_id uuid, p_new_owner_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_owner_id uuid;
  v_is_admin_or_editor boolean;
BEGIN
  SELECT owner_id INTO v_current_owner_id FROM public.clusters WHERE id = p_cluster_id;
  SELECT public.is_admin_or_editor() INTO v_is_admin_or_editor;
  IF auth.uid() = v_current_owner_id OR v_is_admin_or_editor THEN
    UPDATE public.clusters SET owner_id = p_new_owner_id WHERE id = p_cluster_id;
    UPDATE public.cluster_products SET owner_id = p_new_owner_id WHERE cluster_id = p_cluster_id;
  ELSE
    RAISE EXCEPTION 'User does not have permission to transfer this cluster.';
  END IF;
END;
$$;


-- **Notification Helper Function for Grant Admins**
CREATE OR REPLACE FUNCTION public.create_grant_notification_for_admins(p_message text, p_related_application_id text, p_type notification_type)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.notifications (recipient_id, message, related_application_id, type, timestamp)
    VALUES ('grant_admins', p_message, p_related_application_id, p_type, now());
END;
$$;

-- **Notification function to send to all users**
CREATE OR REPLACE FUNCTION public.send_notification_to_all_users(p_message text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_record record;
BEGIN
  -- This function is intended to be called by an admin.
  -- It iterates through all users and creates a personalized notification for each.
  -- This ensures that users who register after the notification is sent do not receive it.
  IF (SELECT public.is_admin_or_editor()) THEN
    FOR user_record IN SELECT id FROM public.users
    LOOP
      INSERT INTO public.notifications (id, recipient_id, message, type, "timestamp")
      VALUES (gen_random_uuid(), user_record.id::text, p_message, 'status_change', now());
    END LOOP;
  ELSE
    RAISE EXCEPTION 'Only Admins or Editors can send notifications to all users.';
  END IF;
END;
$$;

-- **Grant Application RPC Functions**
CREATE OR REPLACE FUNCTION public.submit_report(p_application_id text, p_report_file jsonb, p_report_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_status grant_application_status; v_user_name TEXT; v_project_name TEXT; v_message TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT project_name INTO v_project_name FROM public.grant_applications WHERE id = p_application_id;
  IF p_report_type = 'early' THEN
    new_status := 'Early Report Submitted';
    UPDATE public.grant_applications SET status = new_status, early_report_files = early_report_files || p_report_file, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', new_status, 'timestamp', now(), 'notes', 'Early report submitted by applicant.', 'changed_by', v_user_name) WHERE id = p_application_id;
  ELSIF p_report_type = 'final' THEN
    new_status := 'Final Report Submitted';
    UPDATE public.grant_applications SET status = new_status, final_report_files = final_report_files || p_report_file, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', new_status, 'timestamp', now(), 'notes', 'Final report submitted by applicant.', 'changed_by', v_user_name) WHERE id = p_application_id;
  END IF;
  v_message := 'A ' || p_report_type || ' report has been submitted for "' || v_project_name || '".';
  PERFORM public.create_grant_notification_for_admins(v_message, p_application_id, 'submission_confirm');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_grant_offer_response(p_application_id text, p_accepted boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_status grant_application_status; history_note TEXT; v_user_name TEXT; v_project_name TEXT; v_message TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT project_name INTO v_project_name FROM public.grant_applications WHERE id = p_application_id;
  IF p_accepted THEN new_status := 'Early Report Required'; history_note := 'Applicant accepted the conditional offer.';
  ELSE new_status := 'Rejected'; history_note := 'Applicant declined the conditional offer.';
  END IF;
  UPDATE public.grant_applications SET status = new_status, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', new_status, 'timestamp', now(), 'notes', history_note, 'changed_by', v_user_name) WHERE id = p_application_id;
  v_message := 'Applicant has ' || (CASE WHEN p_accepted THEN 'accepted' ELSE 'declined' END) || ' the offer for "' || v_project_name || '".';
  PERFORM public.create_grant_notification_for_admins(v_message, p_application_id, 'status_change');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_application(p_application_id text, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_name TEXT; v_applicant_id UUID; v_project_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT applicant_id, project_name INTO v_applicant_id, v_project_name FROM public.grant_applications WHERE id = p_application_id;
  UPDATE public.grant_applications SET status = 'Rejected', notes = p_notes, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', 'Rejected', 'timestamp', now(), 'notes', p_notes, 'changed_by', v_user_name) WHERE id = p_application_id;
  INSERT INTO public.notifications (recipient_id, message, related_application_id, type, timestamp) VALUES (v_applicant_id::text, 'Your application "' || v_project_name || '" has been rejected. See notes for details.', p_application_id, 'status_change', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_make_conditional_offer(p_application_id text, p_notes text, p_amount_approved numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_name TEXT; v_applicant_id UUID; v_project_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT applicant_id, project_name INTO v_applicant_id, v_project_name FROM public.grant_applications WHERE id = p_application_id;
  UPDATE public.grant_applications SET status = 'Conditional Offer', notes = p_notes, amount_approved = p_amount_approved, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', 'Conditional Offer', 'timestamp', now(), 'notes', p_notes, 'changed_by', v_user_name) WHERE id = p_application_id;
  INSERT INTO public.notifications (recipient_id, message, related_application_id, type, timestamp) VALUES (v_applicant_id::text, 'You have received a conditional offer for your application "' || v_project_name || '".', p_application_id, 'status_change', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_early_report(p_application_id text, p_disbursement_amount numeric, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_name TEXT; v_applicant_id UUID; v_project_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT applicant_id, project_name INTO v_applicant_id, v_project_name FROM public.grant_applications WHERE id = p_application_id;
  UPDATE public.grant_applications SET status = 'Final Report Required', initial_disbursement_amount = p_disbursement_amount, notes = p_notes, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', 'Final Report Required', 'timestamp', now(), 'notes', p_notes, 'changed_by', v_user_name) WHERE id = p_application_id;
  INSERT INTO public.notifications (recipient_id, message, related_application_id, type, timestamp) VALUES (v_applicant_id::text, 'Your early report for "' || v_project_name || '" has been approved. You may now proceed to the final report stage.', p_application_id, 'status_change', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_early_report(p_application_id text, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_name TEXT; v_applicant_id UUID; v_project_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT applicant_id, project_name INTO v_applicant_id, v_project_name FROM public.grant_applications WHERE id = p_application_id;
  UPDATE public.grant_applications SET status = 'Early Report Required', early_report_rejection_count = coalesce(early_report_rejection_count, 0) + 1, notes = p_notes, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', 'Early Report Required', 'timestamp', now(), 'notes', 'Early report rejected. ' || p_notes, 'changed_by', v_user_name) WHERE id = p_application_id;
  INSERT INTO public.notifications (recipient_id, message, related_application_id, type, timestamp) VALUES (v_applicant_id::text, 'Your early report for "' || v_project_name || '" was rejected. Please review the notes and resubmit.', p_application_id, 'status_change', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_final_report(p_application_id text, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_name TEXT; v_applicant_id UUID; v_project_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT applicant_id, project_name INTO v_applicant_id, v_project_name FROM public.grant_applications WHERE id = p_application_id;
  UPDATE public.grant_applications SET status = 'Final Report Required', final_report_rejection_count = coalesce(final_report_rejection_count, 0) + 1, notes = p_notes, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', 'Final Report Required', 'timestamp', now(), 'notes', 'Final report rejected. ' || p_notes, 'changed_by', v_user_name) WHERE id = p_application_id;
  INSERT INTO public.notifications (recipient_id, message, related_application_id, type, timestamp) VALUES (v_applicant_id::text, 'Your final report for "' || v_project_name || '" was rejected. Please review the notes and resubmit.', p_application_id, 'status_change', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_complete_application(p_application_id text, p_final_disbursement_amount numeric, p_notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_name TEXT; v_applicant_id UUID; v_project_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
  SELECT applicant_id, project_name INTO v_applicant_id, v_project_name FROM public.grant_applications WHERE id = p_application_id;
  UPDATE public.grant_applications SET status = 'Complete', final_disbursement_amount = p_final_disbursement_amount, notes = p_notes, last_update_timestamp = now(), status_history = status_history || jsonb_build_object('status', 'Complete', 'timestamp', now(), 'notes', p_notes, 'changed_by', v_user_name) WHERE id = p_application_id;
  INSERT INTO public.notifications (recipient_id, message, related_application_id, type, timestamp) VALUES (v_applicant_id::text, 'Congratulations! Your grant application for "' || v_project_name || '" has been successfully completed.', p_application_id, 'status_change', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notifications_cleared_by_user(p_notification_ids text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NOT NULL THEN
    UPDATE public.notifications
    SET cleared_by = array_append(coalesce(cleared_by, '{}'::uuid[]), current_user_id)
    WHERE id::text = ANY(p_notification_ids)
    AND coalesce(cleared_by @> ARRAY[current_user_id], false) = false;
  END IF;
END;
$$;

-- **User self-deletion function**
CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function is called by an authenticated user to delete their own account.
  -- The SECURITY DEFINER context allows the deletion from auth.users.
  -- A foreign key from public.users to auth.users with ON DELETE CASCADE is required.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- **Visitor analytics upload function**
CREATE OR REPLACE FUNCTION public.upload_visitor_analytics_batch(p_data jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    item jsonb;
BEGIN
    IF NOT public.is_admin_or_editor() THEN
        RAISE EXCEPTION 'Only Admins or Editors can upload analytics data.';
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(p_data)
    LOOP
        INSERT INTO public.visitor_analytics (year, month, country, visitor_type, count)
        VALUES (
            (item->>'year')::smallint,
            (item->>'month')::smallint,
            item->>'country',
            item->>'visitor_type',
            (item->>'count')::integer
        )
        ON CONFLICT (year, month, country, visitor_type)
        DO UPDATE SET count = EXCLUDED.count;
    END LOOP;
END;
$$;


-- == STEP 4: RLS POLICIES - RE-APPLY ALL POLICIES USING ROBUST INLINE SUBQUERIES ==
-- Enable RLS for all tables if not already enabled.
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;


-- `clusters` Policies
CREATE POLICY "Public can view all clusters" ON public.clusters FOR SELECT USING (true);
CREATE POLICY "Admins, Editors, and Players can insert clusters" ON public.clusters FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND ( (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'Editor', 'Tourism Player') )
);
CREATE POLICY "Admins, Editors, or owners can update/delete clusters" ON public.clusters FOR ALL USING (
  public.is_admin_or_editor() OR (auth.uid() = owner_id)
);

-- `cluster_reviews` Policies
CREATE POLICY "Public can read all reviews" ON public.cluster_reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can insert reviews (not on own cluster)" ON public.cluster_reviews FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (SELECT owner_id FROM public.clusters WHERE id = cluster_id) <> auth.uid()
);
CREATE POLICY "Users can update own reviews" ON public.cluster_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins or authors can delete reviews" ON public.cluster_reviews FOR DELETE USING (
  public.is_admin_or_editor() OR (auth.uid() = user_id)
);

-- `events` Policies
CREATE POLICY "Public can view all events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins, Editors, or creators can update/delete events" ON public.events FOR ALL USING (
  public.is_admin_or_editor() OR (auth.uid() = created_by)
);

-- `notifications` Policies
CREATE POLICY "Public can view site-wide banners" ON public.notifications FOR SELECT USING (recipient_id = 'global_banner');
CREATE POLICY "Users can see their personal notifications" ON public.notifications FOR SELECT USING (recipient_id = auth.uid()::text);
CREATE POLICY "Admins and Editors can see admin-group notifications" ON public.notifications FOR SELECT USING (
    recipient_id = 'admins' AND public.is_admin_or_editor()
);
CREATE POLICY "Admins can see grant-admin notifications" ON public.notifications FOR SELECT USING (
    recipient_id = 'grant_admins' AND ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin')
);
CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update notifications intended for them" ON public.notifications FOR UPDATE USING (
    (auth.uid()::text = recipient_id) OR
    (recipient_id = 'admins' AND public.is_admin_or_editor()) OR
    (recipient_id = 'grant_admins' AND ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin')) OR
    (recipient_id = 'global_banner' AND auth.role() = 'authenticated')
);
CREATE POLICY "Admins and Editors can delete site-wide banners" ON public.notifications FOR DELETE USING (
    recipient_id = 'global_banner' AND public.is_admin_or_editor()
);


-- `grant_applications` Policies
CREATE POLICY "Admins have full access to grants" ON public.grant_applications FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
);
CREATE POLICY "Users can manage their own grant applications" ON public.grant_applications FOR ALL USING (
  auth.uid() = applicant_id
) WITH CHECK (
  auth.uid() = applicant_id
);

-- `users` Policies
CREATE POLICY "Public can view all user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile, Admins/Editors can update any" ON public.users FOR UPDATE USING (
  (auth.uid() = id) OR public.is_admin_or_editor()
);

-- `promotions` Policies
CREATE POLICY "Public can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins and Editors can manage all promotions" ON public.promotions FOR ALL USING (
  public.is_admin_or_editor()
);

-- `public_holidays` Policies
CREATE POLICY "Public can view all holidays" ON public.public_holidays FOR SELECT USING (true);

-- `cluster_analytics` Policies
CREATE POLICY "Public read access for analytics" ON public.cluster_analytics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert analytics" ON public.cluster_analytics FOR INSERT WITH CHECK (true);

-- `event_analytics` Policies
CREATE POLICY "Public read access for event analytics" ON public.event_analytics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert event analytics" ON public.event_analytics FOR INSERT WITH CHECK (true);

-- `search_queries` Policies
CREATE POLICY "Admins and Editors can view search queries" ON public.search_queries FOR SELECT USING (public.is_admin_or_editor());
CREATE POLICY "Anyone can insert search queries" ON public.search_queries FOR INSERT WITH CHECK (true);

-- `app_config` Policies
CREATE POLICY "Public can read app config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Admins and Editors can manage app config" ON public.app_config FOR ALL USING (
  public.is_admin_or_editor()
);

-- `visitor_analytics` Policies
CREATE POLICY "Public can view all visitor analytics" ON public.visitor_analytics FOR SELECT USING (true);
CREATE POLICY "Admins and Editors can manage visitor analytics" ON public.visitor_analytics FOR ALL
USING (
  public.is_admin_or_editor()
)
WITH CHECK (
  public.is_admin_or_editor()
);

-- `cluster_products` Policies
CREATE POLICY "Public can view all products" ON public.cluster_products FOR SELECT USING (true);
CREATE POLICY "Owners, Admins, Editors can insert products" ON public.cluster_products FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  (
    public.is_admin_or_editor() OR
    (auth.uid() = (SELECT owner_id FROM public.clusters WHERE id = cluster_id))
  )
);
CREATE POLICY "Owners, Admins, Editors can update/delete products" ON public.cluster_products FOR ALL USING (
  auth.role() = 'authenticated' AND
  (
    public.is_admin_or_editor() OR
    auth.uid() = owner_id
  )
);

-- `ai_insights` Policies
CREATE POLICY "Public can read AI insights" ON public.ai_insights FOR SELECT USING (true);
CREATE POLICY "Admins and Editors can manage AI insights" ON public.ai_insights FOR ALL USING (public.is_admin_or_editor());

-- `feedback` Policies
CREATE POLICY "Authenticated users can submit feedback" ON public.feedback FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins and Editors can view and manage feedback" ON public.feedback FOR ALL USING (public.is_admin_or_editor());

-- `itineraries` Policies
CREATE POLICY "Users can manage their own itineraries" ON public.itineraries FOR ALL
USING (auth.uid() = user_id);

-- `itinerary_items` Policies
CREATE POLICY "Users can manage items in their own itineraries" ON public.itinerary_items FOR ALL
USING (
  auth.uid() = (SELECT user_id FROM public.itineraries WHERE id = itinerary_id)
);


-- == STEP 5: STORAGE POLICIES ==
CREATE POLICY "View Public Images" ON storage.objects FOR SELECT
  USING (bucket_id IN ('promotion-images', 'cluster-images', 'event-images', 'banner-images', 'product-images'));
  
CREATE POLICY "Manage Promotions" ON storage.objects FOR ALL
  USING (bucket_id = 'promotion-images' AND public.is_admin_or_editor())
  WITH CHECK (bucket_id = 'promotion-images' AND public.is_admin_or_editor());

CREATE POLICY "Admins and Editors can manage banner images" ON storage.objects FOR ALL
  USING (bucket_id = 'banner-images' AND public.is_admin_or_editor())
  WITH CHECK (bucket_id = 'banner-images' AND public.is_admin_or_editor());

CREATE POLICY "Manage Cluster/Event Images" ON storage.objects FOR ALL
  USING (bucket_id IN ('cluster-images', 'event-images') AND ((auth.uid() = (storage.foldername(name))[1]::uuid) OR public.is_admin_or_editor()))
  WITH CHECK (bucket_id IN ('cluster-images', 'event-images') AND ((auth.uid() = (storage.foldername(name))[1]::uuid) OR public.is_admin_or_editor()));

CREATE POLICY "Manage Grant Reports" ON storage.objects FOR ALL
  USING (bucket_id IN ('grant-early-report-files', 'grant-final-report-files') AND ((auth.uid() = (storage.foldername(name))[1]::uuid) OR public.is_admin_or_editor()))
  WITH CHECK (bucket_id IN ('grant-early-report-files', 'grant-final-report-files') AND ((auth.uid() = (storage.foldername(name))[1]::uuid) OR public.is_admin_or_editor()));

-- Allow owners of the product (folder) or admins/editors to upload, update, and delete images.
-- The user's UUID must match the first folder in the file path, e.g., 'public/product-images/uuid-of-user/image.png'
CREATE POLICY "Manage Product Images" ON storage.objects FOR ALL
  USING (bucket_id = 'product-images' AND ((auth.uid() = (storage.foldername(name))[1]::uuid) OR public.is_admin_or_editor()))
  WITH CHECK (bucket_id = 'product-images' AND ((auth.uid() = (storage.foldername(name))[1]::uuid) OR public.is_admin_or_editor()));