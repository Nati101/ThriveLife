import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabaseConfigured = Boolean(url && key);

export function getSupabase(): SupabaseClient<Database> | null {
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** One identity store: Supabase Auth. Roles live in profiles + app_metadata — never user_metadata. */
export const AUTH_PROVIDER = "supabase_auth" as const;
