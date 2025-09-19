# Supabase Storage RLS Policies (SQL Scripts)

This file documents the correct Row Level Security (RLS) policies for every storage bucket required by the INTOURCAMS application. 

**Instructions:** Run these scripts in your Supabase SQL Editor after creating the buckets. For a complete, automated setup, please refer to the master script in `database_migrations.md`.

---

### Bucket: `promotion-images`
- **Public Access:** ON

```sql
-- Allow public read access to all public image buckets
CREATE POLICY "View Public Images" ON storage.objects FOR SELECT
  USING (bucket_id IN ('promotion-images', 'cluster-images', 'event-images'));

-- Allow Admins/Editors to manage all files in the promotions bucket
CREATE POLICY "Manage Promotions" ON storage.objects FOR ALL
  USING (bucket_id = 'promotion-images' AND is_admin_or_editor())
  WITH CHECK (bucket_id = 'promotion-images' AND is_admin_or_editor());
```

---

### Buckets: `cluster-images` & `event-images`
- **Public Access:** ON
- **Note:** File uploads must follow the path format `user_id/filename.ext`

```sql
-- Allow public read access (covered by the "View Public Images" policy)

-- Allow authenticated users to manage their own folder, and admins/editors to manage any file.
CREATE POLICY "Manage Cluster/Event Images" ON storage.objects FOR ALL
  USING (
    bucket_id IN ('cluster-images', 'event-images') AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR is_admin_or_editor())
  )
  WITH CHECK (
    bucket_id IN ('cluster-images', 'event-images') AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR is_admin_or_editor())
  );
```

---

### Buckets: `grant-early-report-files` & `grant-final-report-files`
- **Public Access:** OFF (Private)
- **Note:** File uploads must follow the path format `user_id/filename.ext`

```sql
-- Allow file owners or admins/editors to view files
CREATE POLICY "View Grant Reports" ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('grant-early-report-files', 'grant-final-report-files') AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR is_admin_or_editor())
  );

-- Allow file owners to upload files
CREATE POLICY "Upload Grant Reports" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('grant-early-report-files', 'grant-final-report-files') AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Allow file owners or admins/editors to update files
CREATE POLICY "Update Grant Reports" ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('grant-early-report-files', 'grant-final-report-files') AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR is_admin_or_editor())
  );

-- Allow file owners or admins/editors to delete files
CREATE POLICY "Delete Grant Reports" ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('grant-early-report-files', 'grant-final-report-files') AND
    (auth.uid() = (storage.foldername(name))[1]::uuid OR is_admin_or_editor())
  );
```