// cms-admin/assets/js/config.js
//
// No build step, so config is a plain JS file rather than a bundled .env.
// The Supabase ANON key is safe to expose in client-side code — it is
// designed to be public. Real security comes from the RLS policies in
// supabase/policies.sql. Never put the SERVICE ROLE key here.
//
// Replace these two values with your project's, then leave this file
// as-is in the repo (it's fine to commit).

export const SUPABASE_URL = "https://jderjlkdxbvlsfrzvcfd.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZXJqbGtkeGJ2bHNmcnp2Y2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MTgwMjEsImV4cCI6MjEwMjQ5NDAyMX0.Xw8vURuI3nu_qO57Hpx6O3zVXxLqkmF-ZWM2mCRAQQM";
