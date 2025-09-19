# Supabase Row Level Security Policies

This file is for documentation purposes only. The single source of truth for the latest, correct RLS policies is the **MASTER SCRIPT** inside the `database_migrations.md` file.

Please refer to that file when setting up or debugging database permissions.

---
## `clusters`
- **Public can view all clusters**
- **Admins, Editors, and Tourism Players can insert clusters**
- **Admins, Editors, or owners can update clusters**
- **Admins, Editors, or owners can delete clusters**

## `cluster_reviews`
- **Public can read all reviews**
- **Authenticated users can insert reviews (but not on their own cluster)**
- **Users can update their own reviews**
- **Admins or the review's author can delete reviews**

## `events`
- **Public can view all events**
- **Authenticated users can create events**
- **Admins, Editors, or the event's creator can update events**
- **Admins, Editors, or the event's creator can delete events**

## `notifications`
- **SELECT**: Public can see site-wide banners (`global_banner`). Authenticated users can see their personal notifications, global panel notifications (`global_panel`), and admin-group notifications (if they are an Admin/Editor). Admins can see grant-admin notifications.
- **INSERT**: Authenticated users can create notifications (UI is restricted to Admins/Editors for global notifications).
- **UPDATE**: Users can update notifications intended for them (personal, global banner/panel, admin groups). This allows marking as read/clearing.
- **DELETE**: Admins/Editors can delete global notifications (`global_banner`, `global_panel`).

## `grant_applications`
- **Admins and Editors have full control over all grant applications**
- **Users can insert their own grant applications**
- **Users can view their own grant applications**
- **Users can update their own grant applications (state logic is handled by RPCs)**

## `users`
- **Public can view all user profiles**
- **Users can update their own profile, and Admins/Editors can update any profile**

## `promotions`
- **Public can view active promotions**
- **Admins and Editors can manage all promotions**

## `public_holidays`
- **Public can view all holidays**