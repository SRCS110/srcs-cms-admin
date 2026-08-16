// cms-admin/assets/js/config.js
//
// No build step, so config is a plain JS file rather than a bundled .env.
// The Supabase ANON key is safe to expose in client-side code — it is
// designed to be public. Real security comes from the RLS policies in
// supabase/policies.sql. Never put the SERVICE ROLE key here.
//
// Replace these two values with your project's, then leave this file
// as-is in the repo (it's fine to commit).

export const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";
