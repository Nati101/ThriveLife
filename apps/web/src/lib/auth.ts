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

const DEMO_USER_KEY = "thrivelife.demo.user.v1";

/**
 * Auth path:
 * - Production: Supabase Auth when VITE keys exist.
 * - Static / Pages demo: localStorage demo account (persists across reloads).
 * - Local/dev: cookie role at /dev/role so RBAC can be tested without cloud.
 */
export const AUTH_PROVIDER_PATH = "supabase_auth" as const;

export type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  ageVerified: boolean;
  /** True when using cookie/localStorage identity (not Supabase). */
  isStub: boolean;
  /** True when the user explicitly continued as a demo account. */
  isDemo: boolean;
};

type StoredDemoUser = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  ageVerified: boolean;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function readStoredDemo(): StoredDemoUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDemoUser>;
    if (!parsed.id || !parsed.email || !parsed.displayName) return null;
    const role = parsed.role && isRole(parsed.role) ? parsed.role : "user";
    return {
      id: parsed.id,
      displayName: parsed.displayName,
      email: parsed.email,
      role,
      ageVerified: parsed.ageVerified !== false,
    };
  } catch {
    return null;
  }
}

function writeCookieRole(role: Role): void {
  if (typeof document === "undefined") return;
  document.cookie = `${DEV_ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; SameSite=Lax; max-age=31536000`;
}

export function getSessionUser(): SessionUser {
  const stored = readStoredDemo();
  const cookieRaw = readCookie(DEV_ROLE_COOKIE);
  const cookieRole = cookieRaw && isRole(cookieRaw) ? cookieRaw : null;

  if (stored) {
    return {
      ...stored,
      role: cookieRole ?? stored.role,
      isStub: true,
      isDemo: true,
    };
  }

  const role: Role = cookieRole ?? "user";
  return {
    id: "stub-user-local",
    displayName: "Local Pilot User",
    email: "local@thrivelife.dev",
    role,
    ageVerified: true,
    isStub: true,
    isDemo: false,
  };
}

/** Persist a demo identity for GitHub Pages / static hosts. */
export function continueAsDemoAccount(options?: {
  displayName?: string;
  email?: string;
  role?: Role;
}): SessionUser {
  const role = options?.role && isRole(options.role) ? options.role : "user";
  const user: StoredDemoUser = {
    id: "demo-user-local",
    displayName: options?.displayName?.trim() || "Demo Member",
    email: options?.email?.trim() || "demo@thrivelife.local",
    role,
    ageVerified: true,
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  }
  writeCookieRole(role);
  return { ...user, isStub: true, isDemo: true };
}

export function clearDemoAccount(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(DEMO_USER_KEY);
  }
}

export function setDevRole(role: Role): void {
  writeCookieRole(role);
  const stored = readStoredDemo();
  if (stored && typeof localStorage !== "undefined") {
    localStorage.setItem(
      DEMO_USER_KEY,
      JSON.stringify({ ...stored, role }),
    );
  }
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
