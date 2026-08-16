// cms-admin/assets/js/supabase-client.js
// Single shared Supabase client, loaded as an ES module (no build tooling needed).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
