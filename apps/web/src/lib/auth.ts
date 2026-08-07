import {
  ROLES,
  ROLE_PERMISSIONS,
  canAccessContentTools,
  hasPermission,
  isRole,
  type Permission,
  type Role,
} from "@thrivelife/shared";

/** Cookie name for local role switching until real auth is wired. */
export const DEV_ROLE_COOKIE = "tl_dev_role";

/**
 * Auth path (later):
 * - Prefer aligning with Base44 auth once the client exports their app, OR
 * - Clerk / Auth.js for a standalone ThriveLife backend
 *
 * Hosting note: prefer Canada region for assessment data (PIPA/PIPEDA).
 */
export const AUTH_PROVIDER_PATH = "pending_base44_or_clerk" as const;

export type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  ageVerified: boolean;
  isStub: true;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function getSessionUser(): SessionUser {
  const raw = readCookie(DEV_ROLE_COOKIE);
  const role: Role = raw && isRole(raw) ? raw : "user";

  return {
    id: "stub-user-local",
    displayName: "Local Pilot User",
    email: "local@thrivelife.dev",
    role,
    ageVerified: true,
    isStub: true,
  };
}

export function setDevRole(role: Role): void {
  document.cookie = `${DEV_ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; SameSite=Lax`;
}

export function roleLabel(role: Role): string {
  return ROLE_PERMISSIONS[role].label;
}

export function userHasPermission(permission: Permission): boolean {
  return hasPermission(getSessionUser().role, permission);
}

export function userCanAccessContentTools(): boolean {
  return canAccessContentTools(getSessionUser().role);
}

export { ROLES, ROLE_PERMISSIONS };
