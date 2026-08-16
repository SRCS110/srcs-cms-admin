-- ============================================================
-- Sync Race Studios CMS — Core Schema
-- Multi-tenant: one Supabase project serves every client site.
-- Run in Supabase SQL Editor after creating the project.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- SITES ----------
-- One row per client website (one Vercel project each, cloned from site-template)
create table if not exists sites (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,               -- used as SITE_ID in site.config.json
  name          text not null,                       -- e.g. "Acme Roofing"
  domain        text,                                -- production domain, e.g. acmeroofing.com
  vercel_project text,                                -- vercel project name, for reference
  status        text not null default 'active' check (status in ('active','paused','archived')),
  created_at    timestamptz not null default now()
);

-- ---------- SITE_USERS ----------
-- Which client logins can manage which sites, and at what role
create table if not exists site_users (
  id          uuid primary key default uuid_generate_v4(),
  site_id     uuid not null references sites(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'editor' check (role in ('owner','admin','editor')),
  created_at  timestamptz not null default now(),
  unique (site_id, user_id)
);

-- ---------- PAGES ----------
-- One row per HTML page on a client site (e.g. index.html, about.html)
create table if not exists pages (
  id          uuid primary key default uuid_generate_v4(),
  site_id     uuid not null references sites(id) on delete cascade,
  slug        text not null,                         -- 'index', 'about', 'contact'
  title       text not null default '',
  meta_description text default '',
  published   boolean not null default true,
  updated_at  timestamptz not null default now(),
  unique (site_id, slug)
);

-- ---------- CONTENT_BLOCKS ----------
-- Editable regions inside a page. cms-loader.js matches these to
-- [data-cms-block="key"] elements in the page's HTML at runtime.
create table if not exists content_blocks (
  id          uuid primary key default uuid_generate_v4(),
  page_id     uuid not null references pages(id) on delete cascade,
  block_key   text not null,                         -- 'hero_heading', 'hero_body', 'cta_button_text'
  block_type  text not null default 'text' check (block_type in ('text','richtext','image','url')),
  content     text default '',                        -- text/richtext/url value
  asset_id    uuid references assets(id),              -- set when block_type = 'image'
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now(),
  unique (page_id, block_key)
);

-- ---------- ASSETS ----------
-- Metadata for files in the Supabase Storage "assets" bucket.
-- Actual binary lives in storage at: assets/{site_id}/{filename}
create table if not exists assets (
  id            uuid primary key default uuid_generate_v4(),
  site_id       uuid not null references sites(id) on delete cascade,
  storage_path  text not null,                        -- '{site_id}/hero.jpg'
  file_name     text not null,
  mime_type     text,
  size_bytes    bigint,
  alt_text      text default '',
  uploaded_by   uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- assets.id is referenced by content_blocks above; add FK now that assets exists
alter table content_blocks
  drop constraint if exists content_blocks_asset_id_fkey;
alter table content_blocks
  add constraint content_blocks_asset_id_fkey
  foreign key (asset_id) references assets(id) on delete set null;

create index if not exists idx_pages_site on pages(site_id);
create index if not exists idx_blocks_page on content_blocks(page_id);
create index if not exists idx_assets_site on assets(site_id);
create index if not exists idx_site_users_user on site_users(user_id);
