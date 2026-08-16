// cms-admin/assets/js/new-site.js
import { supabase } from "./supabase-client.js";
import { qs, toast } from "./utils.js";

const DEFAULT_PAGES = [
  { slug: "index", title: "Home" },
  { slug: "about", title: "About" },
  { slug: "contact", title: "Contact" },
];

qs("#new-site-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const slug = qs("#slug").value.trim();
  const name = qs("#name").value.trim();
  const domain = qs("#domain").value.trim();
  if (!slug || !name) return toast("Slug and name are required", true);

  const { data: { user } } = await supabase.auth.getUser();

  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .insert({ slug, name, domain: domain || null })
    .select()
    .single();
  if (siteErr) return toast(siteErr.message, true);

  const { error: memberErr } = await supabase
    .from("site_users")
    .insert({ site_id: site.id, user_id: user.id, role: "owner" });
  if (memberErr) return toast(memberErr.message, true);

  const { error: pagesErr } = await supabase
    .from("pages")
    .insert(DEFAULT_PAGES.map(p => ({ site_id: site.id, slug: p.slug, title: p.title })));
  if (pagesErr) return toast(pagesErr.message, true);

  toast(`Site "${name}" created. Now clone site-template and set SITE_ID = ${site.id}`);
  qs("#result").innerHTML = `
    <p><strong>Site ID:</strong> <code>${site.id}</code></p>
    <p>Copy this into <code>site.config.json</code> in your cloned <code>site-template</code> repo.</p>
  `;
});
