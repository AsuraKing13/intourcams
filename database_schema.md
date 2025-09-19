# INTOURCAMS Database Schema

This document outlines the schema for the INTOURCAMS application database, based on the corrected and verified structure. This is the definitive source of truth.

## Custom Types (Enums)

### `user_role`
- `Admin`, `Editor`, `User`, `Tourism Player`

### `grant_application_status`
- `Pending`, `Approved`, `Rejected`, `Conditional Offer`, `Early Report Required`, `Early Report Submitted`, `Final Report Required`, `Final Report Submitted`, `Complete`

### `notification_type`
- `new_app`, `resubmission`, `submission_confirm`, `status_change`, `auto_rejection`

---

## Table Schemas

### `public.users`

| Column | Data Type |
| :--- | :--- |
| `id` | `uuid` |
| `name` | `text` |
| `email` | `text` |
| `role` | `user_role` |
| `avatar` | `text` |
| `created_at`| `timestamptz` |

### `public.clusters`

| Column | Data Type |
| :--- | :--- |
| `id` | `uuid` |
| `created_at` | `timestamptz` |
| `name` | `text` |
| `location` | `text` |
| `description` | `text` |
| `category` | `text[]` |
| `timing` | `text` |
| `image` | `text` |
| `is_preferred` | `boolean` |
| `owner_id` | `uuid` |
| `latitude` | `float8` |
| `longitude` | `float8` |
| `average_rating`| `float4` |
| `review_count` | `integer` |
| `display_address`| `text` |

### `public.cluster_reviews`

| Column | Data Type |
| :--- | :--- |
| `id` | `uuid` |
| `created_at` | `timestamptz`|
| `cluster_id` | `uuid` |
| `user_id` | `uuid` |
| `rating` | `integer` |
| `comment` | `text` |

### `public.events`

| Column | Data Type |
| :--- | :--- |
| `id` | `uuid` |
| `created_at` | `timestamptz`|
| `title` | `text` |
| `description` | `text` |
| `start_date` | `timestamptz`|
| `end_date` | `timestamptz`|
| `location_name`| `text` |
| `latitude` | `float8` |
| `longitude` | `float8` |
| `category` | `text` |
| `image_url` | `text` |
| `organizer` | `text` |
| `created_by` | `uuid` |
| `updated_at` | `timestamptz`|
| `display_address`| `text` |
| `marker_color` | `text` |
| `contact_info` | `text` |

### `public.grant_applications`

| Column | Data Type |
| :--- | :--- |
| `id` | `text` |
| `applicant_id` | `uuid` |
| `organization_name`| `text` |
| `email` | `text` |
| `contact_number` | `text` |
| `grant_category_id` | `text`|
| `primary_creative_category_id` | `text` |
| `creative_sub_category_id` | `text` |
| `project_name` | `text` |
| `project_description`| `text` |
| `program_start_date`| `date` |
| `end_date` | `date` |
| `amount_requested` | `numeric` |
| `submission_timestamp`| `timestamptz`|
| `last_update_timestamp` | `timestamptz`|
| `notes` | `text` |
| `status_history`| `jsonb` |
| `resubmitted_from_id`| `text` |
| `amount_approved`| `numeric` |
| `initial_disbursement_amount`| `numeric` |
| `early_report_rejection_count`| `integer`|
| `status` | `grant_application_status`|
| `resubmission_count` | `integer` |
| `early_report_files` | `jsonb` |
| `final_report_files` | `jsonb` |
| `final_report_rejection_count`| `integer`|
| `final_disbursement_amount`| `numeric` |

### `public.grant_categories`

| Column | Data Type |
| :--- | :--- |
| `id` | `text` |
| `name` | `text` |

### `public.creative_categories`

| Column | Data Type |
| :--- | :--- |
| `id` | `text` |
| `name` | `text` |
| `subcategories`| `jsonb` |

### `public.notifications`

| Column | Data Type |
| :--- | :--- |
| `id` | `uuid` |
| `created_at` | `timestamptz`|
| `recipient_id` | `text` |
| `message` | `text` |
| `timestamp` | `timestamptz`|
| `read` | `boolean`|
| `related_application_id`| `text` |
| `type` | `notification_type`|
| `cleared_by` | `uuid[]` |
| `read_by` | `uuid[]` |

### `public.promotions`

| Column | Data Type |
| :--- | :--- |
| `id` | `bigint` |
| `created_at` | `timestamptz`|
| `title` | `text` |
| `description` | `text` |
| `image_url` | `text` |
| `cta_text` | `text` |
| `cta_link` | `text` |
| `requires_auth`| `boolean`|
| `is_active` | `boolean`|
| `sort_order` | `integer`|
| `created_by` | `uuid` |

### `public.public_holidays`

| Column | Data Type |
| :--- | :--- |
| `date` | `date` |
| `name` | `text` |