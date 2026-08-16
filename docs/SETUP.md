# SRCS CMS — Setup Guide

Multi-tenant CMS: one admin panel + one Supabase backend manages content and
assets for many client websites. Client sites are pure HTML/CSS/JS with no
build step; they fetch their content from Supabase at runtime, so publishing
a change is instant — no rebuild or redeploy.

## Architecture

- **`cms-admin/`** — the admin panel your team and clients log into. One
  GitHub repo, one Vercel project. Manages every site from one place.
- **`site-template/`** — starter template for each client website. Clone it
  fresh per client into its own GitHub repo and Vercel project.
- **`supabase/`** — SQL that defines the shared backend: tables, RLS
  policies, storage bucket.

```
sites (1) ──< pages (many) ──< content_blocks (many)
  │
  └──< site_users (many)   -- who can edit which site
  └──< assets (many)       -- uploaded files, metadata + storage path
```

---

## 1. Create the Supabase project

1. Go to supabase.com → New project. Pick a region close to your clients.
2. Once provisioned, open **SQL Editor** and run, in order:
   - `supabase/schema.sql`
   - `supabase/policies.sql`
   - `supabase/storage-buckets.sql`
3. (Optional) Run `supabase/seed.sql` for one demo site — replace
   `<YOUR_AUTH_USER_UUID>` first (see step 2).
4. In **Project Settings → API**, copy the **Project URL** and **anon
   public key**. You'll paste these into both repos below. Never expose the
   **service_role** key in either repo.
5. In **Authentication → Providers**, email/password is enabled by default —
   that's all client logins need.

## 2. Create your own login (and each client's)

1. **Authentication → Users → Add user** — create a login for yourself and
   for each client contact. Set a password (or send a magic link).
2. Copy each user's **UID** — you'll attach it to a site in the admin panel
   under Site Settings → Team members.

## 3. Deploy `cms-admin` to Vercel

1. Push the `cms-admin/` folder to its own GitHub repo.
2. In `cms-admin/assets/js/config.js`, set `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` from step 1. Commit — the anon key is safe to
   commit, it's public by design; RLS is the real security boundary.
3. In Vercel: **New Project → Import** the repo. Framework preset:
   **Other** (static site, no build command, no output directory needed —
   root is served as-is).
4. Deploy. Visit the URL, log in with the account from step 2.

## 4. Provision your first client site

1. In the admin panel: **+ New site** → enter a slug and client name →
   Create. Copy the **Site ID** shown after creation.
2. Clone `site-template/` into a new folder/repo for this client.
3. Edit `site.config.json` in that clone:
   - `SITE_ID` — paste the Site ID from step 1
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` — same values as `cms-admin`
4. Push the clone to its own GitHub repo.
5. In Vercel: **New Project → Import** that repo, framework preset
   **Other**, deploy.
6. Back in the admin panel → Site Settings → Team members: attach the
   client's user UID (from step 2) with role `editor` (or `admin`).

## 5. Point the client's domain at Vercel via Cloudflare

1. In Vercel, open the site's project → **Settings → Domains** → add the
   client's domain (e.g. `acmeroofing.com`).
2. In Cloudflare DNS for that domain, add the CNAME/A record Vercel
   displays. Keep proxy status as directed by Vercel's instructions (Vercel
   generally expects DNS-only or its own recommended proxy setting — follow
   what the Vercel domain screen tells you for that record).
3. Wait for DNS propagation and certificate issuance (usually minutes).

## 6. Day-to-day content editing (what clients do)

1. Client logs into `cms-admin` with their email/password.
2. **Dashboard** → Open their site.
3. **Content** → pick a page, edit each block, **Save**. Changes are live
   immediately — the site pulls fresh content on every page load, no
   redeploy needed.
4. **Assets** → upload images/files. Copy a file's URL to paste into a
   content block, or reference it by setting an `image`-type block through
   the content editor once you wire an asset picker (v1 ships URL copy;
   swap in an asset-picker dropdown later if needed).
5. **Site settings** → update site name, domain, or team members.

## 7. Adding a new page to a client site

Content is schema-driven, so a "page" only shows up in the editor once it
exists as a row in `pages` for that site, and the HTML file must exist in
the repo with matching `data-cms-block` attributes.

1. In `cms-admin` → Content → "+ Add a new page", enter the slug (must
   match the `.html` filename minus extension, e.g. `services` →
   `services.html`).
2. In the client's site repo, duplicate `about.html` as `services.html`,
   update the visible copy and `data-cms-block="..."` keys as needed.
3. Add matching content blocks for each `data-cms-block` key via the
   Content editor's "Add a new block" form.
4. Push the new HTML file — Vercel redeploys automatically on push (this
   is the only step that needs a redeploy; block edits after this don't).
5. Add a nav link to the new page across the site's HTML files.

## Notes and known limitations (v1 scaffold)

- **Header/footer/nav blocks are per-page**, not global — a block like
  `site_name` or `footer_text` must have a row under every page that uses
  it (copy the same block_key into each page). A shared "layout" table is
  a natural next step if you want one edit to update every page.
- **Image blocks** need an `asset_id` set on the `content_blocks` row
  pointing at an uploaded asset. The current content editor doesn't have
  an asset picker UI yet — set `asset_id` via Supabase Table Editor for
  now, or extend `content-editor.js` to add one.
- **`contact_email` in `contact.html`** updates the visible text via the
  `text` block type but not the `mailto:` href — treat `url`-type blocks
  separately if you need the href editable too.
- All client-site pages are publicly readable via RLS (`published = true`)
  with no login required — that's intentional, it's how visitors see the
  site. Only the `cms-admin` login gates editing.
