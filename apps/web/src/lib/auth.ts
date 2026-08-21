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
const CLOUD_SESSION_KEY = "thrivelife.cloud.session.v1";

/**
 * Auth path:
 * - Production: Supabase Auth when VITE keys exist.
 * - Static / Pages demo: localStorage demo account (persists across reloads).
 * - Local/dev: cookie role at /dev/role so RBAC can be tested without cloud.
 *
 * Unauthenticated visitors see the public landing + login only — not the app shell.
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

type StoredCloudSession = {
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

function readCloudSession(): StoredCloudSession | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLOUD_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCloudSession>;
    if (!parsed.id || !parsed.email) return null;
    const role = parsed.role && isRole(parsed.role) ? parsed.role : "user";
    return {
      id: parsed.id,
      displayName: parsed.displayName?.trim() || parsed.email.split("@")[0] || "Member",
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

/** True only after demo continue or cloud sign-in — not the anonymous stub. */
export function isAuthenticated(): boolean {
  return readStoredDemo() !== null || readCloudSession() !== null;
}

/**
 * Active session user when signed in.
 * When signed out, returns a read-only anonymous stub for rare callers —
 * prefer `isAuthenticated()` + `RequireAuth` for UI gates.
 */
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

  const cloud = readCloudSession();
  if (cloud) {
    return {
      ...cloud,
      role: cookieRole ?? cloud.role,
      isStub: false,
      isDemo: false,
    };
  }

  const role: Role = cookieRole ?? "user";
  return {
    id: "stub-user-local",
    displayName: "Guest",
    email: "guest@thrivelife.local",
    role,
    ageVerified: false,
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
    localStorage.removeItem(CLOUD_SESSION_KEY);
  }
  writeCookieRole(role);
  return { ...user, isStub: true, isDemo: true };
}

/** Record a cloud (Supabase) sign-in for sync session gates. */
export function setCloudSession(options: {
  id: string;
  email: string;
  displayName?: string;
  role?: Role;
}): SessionUser {
  const role = options.role && isRole(options.role) ? options.role : "user";
  const user: StoredCloudSession = {
    id: options.id,
    email: options.email.trim(),
    displayName:
      options.displayName?.trim() ||
      options.email.trim().split("@")[0] ||
      "Member",
    role,
    ageVerified: true,
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(user));
    localStorage.removeItem(DEMO_USER_KEY);
  }
  writeCookieRole(role);
  return { ...user, isStub: false, isDemo: false };
}

export function clearDemoAccount(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(DEMO_USER_KEY);
  }
}

export function clearCloudSession(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(CLOUD_SESSION_KEY);
  }
}

/** Full sign-out for demo + cloud markers (and local role cookie reset to user). */
export function signOutLocal(): void {
  clearDemoAccount();
  clearCloudSession();
  writeCookieRole("user");
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
  const cloud = readCloudSession();
  if (cloud && typeof localStorage !== "undefined") {
    localStorage.setItem(
      CLOUD_SESSION_KEY,
      JSON.stringify({ ...cloud, role }),
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
