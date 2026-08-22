import type { Role } from "./roles";

/**
 * Emails that receive admin on signup (profiles.role + app_metadata.role).
 * Keep in sync with private.is_bootstrap_admin_email in Supabase migrations.
 */
export const BOOTSTRAP_ADMIN_EMAILS = [
  "japukalo@gmail.com",
  "n.solomon1512@gmail.com",
] as const;

export type BootstrapAdminEmail = (typeof BOOTSTRAP_ADMIN_EMAILS)[number];

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (BOOTSTRAP_ADMIN_EMAILS as readonly string[]).includes(
    email.trim().toLowerCase(),
  );
}

export function bootstrapRoleForEmail(
  email: string | null | undefined,
  fallback: Role = "user",
): Role {
  return isBootstrapAdminEmail(email) ? "admin" : fallback;
}
