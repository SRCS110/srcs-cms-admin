# Deployment Guide — SRCS CMS

Covers taking `cms-admin` and each client's `site-template` clone from local
files to a live URL on Vercel, backed by GitHub and Supabase, with domains
routed through Cloudflare. For initial data-model setup, see `SETUP.md`.

## Prerequisites

- GitHub account/org for repos
- Vercel account, linked to that GitHub account/org
- Supabase project already created, with `schema.sql`, `policies.sql`, and
  `storage-buckets.sql` run (see `SETUP.md` steps 1–2)
- Cloudflare access for any client domain you'll be pointing at Vercel

---

## Part A — Deploy `cms-admin` (once)

### A1. Push to GitHub

```bash
cd cms-admin
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-org>/srcs-cms-admin.git
git push -u origin main
```

### A2. Configure before deploying

Edit `assets/js/config.js` and set:

```js
export const SUPABASE_URL = "https://<project-ref>.supabase.co";
export const SUPABASE_ANON_KEY = "<anon-public-key>";
```

Commit and push this change. The anon key is safe in a public repo — it's
meant to be exposed client-side; RLS policies are the actual security
boundary.

### A3. Import into Vercel

1. Vercel dashboard → **Add New → Project** → import the
   `srcs-cms-admin` repo.
2. Framework preset: **Other**. There is no build command and no install
   command — leave both blank. Output directory: leave as root (`.`).
3. No environment variables are required (config lives in `config.js`).
4. Click **Deploy**.
5. Once live, open the URL and confirm you can log in with the Supabase
   user you created in `SETUP.md` step 2.

### A4. Redeploys

Every `git push` to `main` triggers an automatic redeploy — no manual step.
Since content edits happen through Supabase (not through this repo), you'll
only push here when changing the admin app's code itself.

---

## Part B — Deploy a client site (repeat per client)

### B1. Provision the site record first

In `cms-admin`, go to **+ New site**, create the site, and copy the
**Site ID** it returns. You need this before configuring the repo.

### B2. Clone the template into a new repo

```bash
cp -r site-template <client-slug>-site
cd <client-slug>-site
rm -rf .git
git init
```

### B3. Configure the site

Edit `site.config.json`:

```json
{
  "SITE_ID": "<uuid-from-B1>",
  "SUPABASE_URL": "https://<project-ref>.supabase.co",
  "SUPABASE_ANON_KEY": "<anon-public-key>"
}
```

### B4. Push to GitHub

```bash
git add .
git commit -m "Initial site: <client name>"
git branch -M main
git remote add origin https://github.com/<your-org>/<client-slug>-site.git
git push -u origin main
```

### B5. Import into Vercel

1. **Add New → Project** → import `<client-slug>-site`.
2. Framework preset: **Other**, no build/install commands, root output.
3. Deploy. You'll get a `*.vercel.app` URL to confirm the site loads and
   pulls content (check the browser console for `cms-loader` errors if
   text doesn't appear — usually a `SITE_ID` or RLS mismatch).

### B6. Attach the client's login

Back in `cms-admin` → that site → **Site settings → Team members** → add
the client's Supabase user UID with role `editor`.

---

## Part C — Point a custom domain at the site (via Cloudflare)

1. In Vercel: open the client's project → **Settings → Domains** → **Add**
   → enter the domain, e.g. `acmeroofing.com` (and `www.acmeroofing.com`
   if needed).
2. Vercel shows the exact DNS record(s) to add — typically:
   - Apex domain: an `A` record to Vercel's IP (currently `76.76.21.21`,
     but always use the value Vercel displays, it can change)
   - `www` subdomain: a `CNAME` to `cname.vercel-dns.com`
3. In Cloudflare DNS for that domain, add the record(s) exactly as shown.
   - Set the Cloudflare proxy status to **DNS only** (grey cloud) unless
     you've confirmed Vercel's SSL works fine behind Cloudflare's proxy —
     DNS-only avoids cert/redirect conflicts on first setup.
4. Back in Vercel, wait for the domain status to flip to **Valid
   Configuration** (usually a few minutes, can take longer for propagation).
5. Vercel auto-issues an SSL certificate once DNS resolves correctly.
6. Optional: once confirmed working, you can switch Cloudflare's proxy to
   **Proxied** (orange cloud) for Cloudflare's CDN/WAF — verify the site
   still loads over HTTPS afterward.

---

## Part D — Ongoing operations

**Content changes (day-to-day):** no deployment involved — clients edit
through `cms-admin`, changes are live on next page load. Nothing to
redeploy.

**HTML/CSS/JS changes to a client site:** edit the site's repo, commit,
push to `main` → Vercel redeploys automatically (~30–60 sec for a static
site).

**Rollback a bad deploy:** Vercel project → **Deployments** tab → find the
last good deployment → **⋯ → Promote to Production**. This is instant and
doesn't require a git revert first (though you should still fix and push
the underlying commit).

**Preview deployments:** any push to a non-`main` branch, or a pull
request, gets its own preview URL automatically — useful for a client to
review a redesign before it goes live. Point `SITE_ID` at a staging site
row if you want previews to show different content than production.

**Adding a page to a live client site:** requires a code push (new `.html`
file) — see `SETUP.md` §7. This is the one content operation that isn't
instant; everything else (editing existing pages/blocks/assets) is.

**Environment/config changes** (rotating the Supabase anon key, changing
`SITE_ID`): edit the relevant file (`config.js` or `site.config.json`),
commit, push — triggers a redeploy same as any code change.

---

## Checklist: new client, start to finish

1. [ ] Create Supabase Auth user for the client, copy their UID
2. [ ] `cms-admin` → **+ New site** → copy Site ID
3. [ ] Clone `site-template` → new repo → set `site.config.json`
4. [ ] Push repo → import to Vercel → deploy → confirm content loads
5. [ ] `cms-admin` → Site settings → attach client's user UID
6. [ ] Vercel → add custom domain → add DNS record in Cloudflare
7. [ ] Confirm HTTPS is live on the custom domain
8. [ ] Hand off `cms-admin` login URL + credentials to the client
