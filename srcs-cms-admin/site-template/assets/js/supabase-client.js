// site-template/assets/js/supabase-client.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let clientPromise = null;
let configPromise = null;

export function getConfig() {
  if (!configPromise) {
    configPromise = fetch("/site.config.json").then(r => r.json());
  }
  return configPromise;
}

export async function getSupabase() {
  if (!clientPromise) {
    clientPromise = getConfig().then(cfg => createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY));
  }
  return clientPromise;
}
