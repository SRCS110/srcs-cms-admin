// cms-admin/assets/js/auth.js
import { supabase } from "./supabase-client.js";

export async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "/index.html";
    return null;
  }
  return session;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
}

// Returns every site (id, slug, name) the logged-in user belongs to.
export async function getMySites() {
  const { data, error } = await supabase
    .from("site_users")
    .select("role, sites ( id, slug, name, domain, status )")
    .order("role");
  if (error) throw error;
  return data;
}

export function getActiveSiteId() {
  return localStorage.getItem("srcs_active_site_id");
}

export function setActiveSiteId(siteId) {
  localStorage.setItem("srcs_active_site_id", siteId);
}
