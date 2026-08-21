import { supabaseConfigured } from "@/lib/supabase";

/**
 * Real-user mode: cloud Auth required, demo tools hidden, no static localStorage API.
 * Opt out for local fixture demos with VITE_ALLOW_DEMO_AUTH=true.
 */
export function isCloudAuthRequired(): boolean {
  if (import.meta.env.VITE_ALLOW_DEMO_AUTH === "true") return false;
  return Boolean(import.meta.env.PROD && supabaseConfigured);
}

/** Content invite codes (Joel) — demo/staging only, not production cloud. */
export function isContentInviteAllowed(): boolean {
  if (import.meta.env.VITE_ALLOW_CONTENT_INVITE === "true") return true;
  return !isCloudAuthRequired();
}
