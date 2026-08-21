/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
  /** Invite code for Joel / content owners (embedded in client bundle). */
  readonly VITE_CONTENT_INVITE_CODE?: string;
  /** When "true", keep demo auth even in production builds. */
  readonly VITE_ALLOW_DEMO_AUTH?: string;
  /** When "true", show content invite UI even if cloud auth is required. */
  readonly VITE_ALLOW_CONTENT_INVITE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
