-- ============================================================
-- Storage bucket for client-site assets (images, PDFs, etc.)
-- Run after policies.sql. Files are stored at: assets/{site_id}/{filename}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Public read (client sites load images directly via public URL)
create policy "public read access to assets bucket"
  on storage.objects for select
  using (bucket_id = 'assets');

-- Authenticated members can upload/update/delete only inside
-- their own site's folder: assets/{site_id}/...
create policy "members can upload to their site folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'assets'
    and is_site_member((storage.foldername(name))[1]::uuid)
  );

create policy "members can update files in their site folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'assets'
    and is_site_member((storage.foldername(name))[1]::uuid)
  );

create policy "members can delete files in their site folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'assets'
    and is_site_member((storage.foldername(name))[1]::uuid)
  );
