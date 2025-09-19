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
- **Users can read notifications intended for them or for admins (if they are an admin/editor)**
- **Authenticated users can insert notifications**
- **Users can update/clear notifications intended for them**
- **Admins/Editors can update/clear notifications intended for them or for the general admin pool**

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