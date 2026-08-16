// cms-admin/assets/js/site-settings.js
import { supabase } from "./supabase-client.js";
import { getActiveSiteId } from "./auth.js";
import { el, qs, toast } from "./utils.js";

const siteId = getActiveSiteId();
if (!siteId) window.location.href = "/dashboard.html";

async function loadSite() {
  const { data: site, error } = await supabase.from("sites").select("*").eq("id", siteId).single();
  if (error) return toast(error.message, true);
  qs("#site-name").value = site.name;
  qs("#site-domain").value = site.domain || "";
  qs("#site-slug").value = site.slug;
  qs("#site-status").value = site.status;
}

qs("#settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { error } = await supabase.from("sites").update({
    name: qs("#site-name").value,
    domain: qs("#site-domain").value,
    status: qs("#site-status").value,
  }).eq("id", siteId);
  if (error) return toast(error.message, true);
  toast("Saved");
});

async function loadMembers() {
  const list = qs("#member-list");
  list.innerHTML = "";
  const { data: members, error } = await supabase
    .from("site_users")
    .select("id, role, user_id")
    .eq("site_id", siteId);
  if (error) return toast(error.message, true);
  for (const m of members) {
    const row = el("div", { class: "row", style: "justify-content:space-between;margin-bottom:8px;" });
    row.appendChild(el("span", { class: "muted", text: `${m.user_id} — ${m.role}` }));
    const removeBtn = el("button", { class: "danger", text: "Remove" });
    removeBtn.addEventListener("click", async () => {
      if (!confirm("Remove this member?")) return;
      await supabase.from("site_users").delete().eq("id", m.id);
      loadMembers();
    });
    row.appendChild(removeBtn);
    list.appendChild(row);
  }
}

qs("#invite-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  toast("Invite the client via Supabase Dashboard > Authentication, then paste their User UID below to link them to this site.");
});

qs("#add-member-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = qs("#member-user-id").value.trim();
  const role = qs("#member-role").value;
  if (!userId) return;
  const { error } = await supabase.from("site_users").insert({ site_id: siteId, user_id: userId, role });
  if (error) return toast(error.message, true);
  qs("#member-user-id").value = "";
  loadMembers();
});

loadSite();
loadMembers();
