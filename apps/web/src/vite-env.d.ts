/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
  /** Invite code for Joel / content owners (embedded in client bundle). */
  readonly VITE_CONTENT_INVITE_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
