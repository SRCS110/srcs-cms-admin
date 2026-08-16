-- ============================================================
-- Row Level Security — run after schema.sql
-- Model: a logged-in user can read/write a site's data only if
-- they have a row in site_users for that site.
-- Public (anon) visitors can only READ published content — this is
-- what lets the pure-HTML client sites fetch content at runtime
-- without any login.
-- ============================================================

alter table sites enable row level security;
alter table site_users enable row level security;
alter table pages enable row level security;
alter table content_blocks enable row level security;
alter table assets enable row level security;

-- Helper: is the current user attached to this site?
create or replace function is_site_member(target_site uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from site_users
    where site_id = target_site
      and user_id = auth.uid()
  );
$$;

-- ---------- SITES ----------
create policy "public can read active sites (for site.config lookups)"
  on sites for select
  using (status = 'active');

create policy "members can update their site"
  on sites for update
  using (is_site_member(id));

create policy "authenticated users can create a site (provisioning)"
  on sites for insert
  to authenticated
  with check (true);

-- ---------- SITE_USERS ----------
create policy "members can view their own membership rows"
  on site_users for select
  using (user_id = auth.uid() or is_site_member(site_id));

create policy "owners/admins can manage membership"
  on site_users for all
  using (
    exists (
      select 1 from site_users su
      where su.site_id = site_users.site_id
        and su.user_id = auth.uid()
        and su.role in ('owner','admin')
    )
  );

-- ---------- PAGES ----------
create policy "public can read published pages"
  on pages for select
  using (published = true);

create policy "members can manage their site's pages"
  on pages for all
  using (is_site_member(site_id))
  with check (is_site_member(site_id));

-- ---------- CONTENT_BLOCKS ----------
create policy "public can read content blocks of published pages"
  on content_blocks for select
  using (
    exists (
      select 1 from pages p
      where p.id = content_blocks.page_id and p.published = true
    )
  );

create policy "members can manage their site's content blocks"
  on content_blocks for all
  using (
    exists (
      select 1 from pages p
      where p.id = content_blocks.page_id and is_site_member(p.site_id)
    )
  )
  with check (
    exists (
      select 1 from pages p
      where p.id = content_blocks.page_id and is_site_member(p.site_id)
    )
  );

-- ---------- ASSETS ----------
create policy "public can read asset metadata"
  on assets for select
  using (true);

create policy "members can manage their site's assets"
  on assets for all
  using (is_site_member(site_id))
  with check (is_site_member(site_id));
