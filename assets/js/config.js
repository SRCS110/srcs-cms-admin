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
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYnlwc2lqY3RkZWV4Y2dlY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MTY4NzgsImV4cCI6MjEwMjQ5Mjg3OH0.CzodSr3BUl11-vrAKhjAO_lXJTzBg6Q3eD7etzZnobA";
