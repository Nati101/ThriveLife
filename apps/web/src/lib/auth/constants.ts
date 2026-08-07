/** Cookie name for local role switching until Clerk (or Auth.js) is wired. */
export const DEV_ROLE_COOKIE = "tl_dev_role";

/**
 * Auth path (Phase 9):
 * - Intended provider: Clerk (email + OAuth, simple RBAC metadata)
 * - Alternative: Auth.js if we prefer self-hosted sessions on Postgres
 * - Until then: stub session + DEV_ROLE_COOKIE for local RBAC gates
 *
 * Hosting note: prefer a Canada region for assessment data (Alberta PIPA / PIPEDA).
 * Confirm with Legal before beta — see docs/QUESTIONS.md.
 */
export const AUTH_PROVIDER_PATH = "clerk" as const;
