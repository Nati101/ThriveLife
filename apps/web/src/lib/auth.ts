import {
  ROLES,
  ROLE_PERMISSIONS,
  canAccessContentTools,
  hasPermission,
  isBootstrapAdminEmail,
  isRole,
  type Permission,
  type Role,
} from "@thrivelife/shared";
import {
  CONTENT_ACCESS_COOKIE,
  DEV_ROLE_COOKIE,
  expectedContentInviteCodeFromEnv,
  matchesContentInviteCode,
} from "@/lib/content-invite";
import { getSupabase } from "@/lib/supabase";

export { DEV_ROLE_COOKIE, CONTENT_ACCESS_COOKIE };

const DEMO_USER_KEY = "thrivelife.demo.user.v1";
const CLOUD_SESSION_KEY = "thrivelife.cloud.session.v1";

/**
 * Auth path:
 * - Production: Supabase Auth when VITE keys exist.
 * - Static / Pages demo: localStorage demo account (member = user only).
 * - Content owner (Joel): invite code → admin + content-access cookie.
 * - Local/dev: /dev/role for RBAC testing.
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
  /** Joel / content contributor via invite — full content tools. */
  isContentOwner: boolean;
};

type StoredDemoUser = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  ageVerified: boolean;
  contentOwner?: boolean;
};

type StoredCloudSession = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  ageVerified: boolean;
  contentOwner?: boolean;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax; max-age=31536000`;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; SameSite=Lax; max-age=0`;
}

function hasContentAccess(): boolean {
  return readCookie(CONTENT_ACCESS_COOKIE) === "1";
}

function grantContentAccess(): void {
  writeCookie(CONTENT_ACCESS_COOKIE, "1");
}

function revokeContentAccess(): void {
  clearCookie(CONTENT_ACCESS_COOKIE);
}

function writeCookieRole(role: Role): void {
  writeCookie(DEV_ROLE_COOKIE, role);
}

/** Client expected invite (Pages-safe; override via VITE_CONTENT_INVITE_CODE). */
export function expectedClientInviteCode(): string {
  return expectedContentInviteCodeFromEnv(
    import.meta.env.VITE_CONTENT_INVITE_CODE,
    null,
  );
}

export function inviteCodeMatches(code: string): boolean {
  return matchesContentInviteCode(
    code,
    import.meta.env.VITE_CONTENT_INVITE_CODE,
    null,
  );
}

/**
 * Elevated roles:
 * - DEV / content-invite: allowed
 * - Trusted cloud session (profiles.role from Supabase): allowed
 * - Demo without invite: demoted to user (no self-admin)
 */
function sanitizeRole(
  role: Role,
  opts: { contentOwner?: boolean; trustedCloud?: boolean } = {},
): Role {
  if (!canAccessContentTools(role)) return role;
  if (
    import.meta.env.DEV ||
    opts.contentOwner ||
    opts.trustedCloud ||
    hasContentAccess()
  ) {
    return role;
  }
  return "user";
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
      contentOwner: parsed.contentOwner === true,
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
      displayName:
        parsed.displayName?.trim() || parsed.email.split("@")[0] || "Member",
      email: parsed.email,
      role,
      ageVerified: parsed.ageVerified !== false,
      contentOwner: parsed.contentOwner === true,
    };
  } catch {
    return null;
  }
}

/** True only after demo continue or cloud sign-in — not the anonymous stub. */
export function isAuthenticated(): boolean {
  return readStoredDemo() !== null || readCloudSession() !== null;
}

export function getSessionUser(): SessionUser {
  const stored = readStoredDemo();
  const cookieRaw = readCookie(DEV_ROLE_COOKIE);
  const cookieRole = cookieRaw && isRole(cookieRaw) ? cookieRaw : null;

  if (stored) {
    const contentOwner = stored.contentOwner === true;
    const role = sanitizeRole(cookieRole ?? stored.role, { contentOwner });
    return {
      ...stored,
      role,
      isStub: true,
      isDemo: true,
      isContentOwner: contentOwner,
    };
  }

  const cloud = readCloudSession();
  if (cloud) {
    const contentOwner = cloud.contentOwner === true;
    // Prefer profile role from cloud session; cookie may lag behind.
    const role = sanitizeRole(cloud.role, {
      contentOwner,
      trustedCloud: true,
    });
    return {
      ...cloud,
      role,
      isStub: false,
      isDemo: false,
      isContentOwner: contentOwner,
    };
  }

  const role = sanitizeRole(cookieRole ?? "user", {});
  return {
    id: "stub-user-local",
    displayName: "Guest",
    email: "guest@thrivelife.local",
    role,
    ageVerified: false,
    isStub: true,
    isDemo: false,
    isContentOwner: false,
  };
}

/** Member demo — always `user` outside DEV (no self-admin). */
export function continueAsDemoAccount(options?: {
  displayName?: string;
  email?: string;
  role?: Role;
  id?: string;
}): SessionUser {
  let role: Role =
    options?.role && isRole(options.role) ? options.role : "user";
  if (!import.meta.env.DEV && canAccessContentTools(role)) {
    role = "user";
  }
  const user: StoredDemoUser = {
    id: options?.id?.trim() || "demo-user-local",
    displayName: options?.displayName?.trim() || "Demo Member",
    email: options?.email?.trim() || "demo@thrivelife.local",
    role,
    ageVerified: true,
    contentOwner: false,
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    localStorage.removeItem(CLOUD_SESSION_KEY);
  }
  revokeContentAccess();
  writeCookieRole(role);
  return {
    ...user,
    isStub: true,
    isDemo: true,
    isContentOwner: false,
  };
}

/**
 * Joel / content contributor: invite → admin with draft + publish + thresholds.
 * Opens /admin content library after redeem.
 */
export function redeemContentInvite(options: {
  code: string;
  displayName?: string;
}): SessionUser | null {
  if (!inviteCodeMatches(options.code)) return null;
  const user: StoredDemoUser = {
    id: "content-owner-joel",
    displayName: options.displayName?.trim() || "Joel (Content)",
    email: "joel@thrivelife.local",
    role: "admin",
    ageVerified: true,
    contentOwner: true,
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    localStorage.removeItem(CLOUD_SESSION_KEY);
  }
  grantContentAccess();
  writeCookieRole("admin");
  return {
    ...user,
    isStub: true,
    isDemo: true,
    isContentOwner: true,
  };
}

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
    role: sanitizeRole(role, { trustedCloud: true }),
    ageVerified: true,
    contentOwner: false,
  };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(user));
    localStorage.removeItem(DEMO_USER_KEY);
  }
  writeCookieRole(user.role);
  return {
    ...user,
    isStub: false,
    isDemo: false,
    isContentOwner: false,
  };
}

/**
 * After Supabase sign-in: load profiles.role (never user_metadata) into session.
 */
export async function syncSessionFromSupabase(): Promise<SessionUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session?.user) return null;

  const user = session.user;
  let role: Role = "user";
  let displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Member";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, email, age_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    if (profile.role && isRole(profile.role)) role = profile.role;
    if (profile.display_name?.trim()) displayName = profile.display_name.trim();
  } else {
    const appRole = (user.app_metadata?.role as string | undefined) ?? "";
    if (isRole(appRole)) role = appRole;
  }

  if (isBootstrapAdminEmail(user.email ?? profile?.email) && role !== "admin") {
    role = "admin";
  }

  return setCloudSession({
    id: user.id,
    email: user.email ?? profile?.email ?? "member@thrivelife.local",
    displayName,
    role,
  });
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

export function signOutLocal(): void {
  clearDemoAccount();
  clearCloudSession();
  revokeContentAccess();
  writeCookieRole("user");
}

export function setDevRole(role: Role): void {
  const contentOwner =
    readStoredDemo()?.contentOwner === true ||
    readCloudSession()?.contentOwner === true ||
    hasContentAccess();
  const trustedCloud = readCloudSession() !== null;
  const next = sanitizeRole(role, { contentOwner, trustedCloud });
  writeCookieRole(next);
  const stored = readStoredDemo();
  if (stored && typeof localStorage !== "undefined") {
    localStorage.setItem(
      DEMO_USER_KEY,
      JSON.stringify({ ...stored, role: next }),
    );
  }
  const cloud = readCloudSession();
  if (cloud && typeof localStorage !== "undefined") {
    localStorage.setItem(
      CLOUD_SESSION_KEY,
      JSON.stringify({ ...cloud, role: next }),
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
