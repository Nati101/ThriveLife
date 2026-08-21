/**
 * Resolve caller identity for /api handlers.
 * Production: Supabase JWT (Authorization Bearer) → user id + profiles.role.
 * Dev/test: optional x-thrivelife-* headers / cookies (never in strict production).
 */

import { createClient } from "@supabase/supabase-js";
import { canAccessContentTools, isRole, type Role } from "@thrivelife/shared";
import type { IncomingMessage } from "node:http";
import {
  CONTENT_ACCESS_COOKIE,
  DEV_ROLE_COOKIE,
  headerString,
  parseCookies,
  STUB_USER_EMAIL,
  STUB_USER_ID,
} from "./http.ts";

export type RequestIdentity = {
  userId: string;
  email: string;
  role: Role;
  displayName: string;
  /** jwt = verified Supabase user; fallback = trusted only outside production. */
  source: "jwt" | "fallback" | "anonymous";
  /** True when role came from JWT/profile or an explicit header/cookie. */
  explicitRole: boolean;
};

const identityCache = new WeakMap<IncomingMessage, RequestIdentity>();

function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    ""
  );
}

function supabaseAnonKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

/** When true, header/cookie identity is rejected for protected routes. */
export function requireJwtAuth(): boolean {
  if (process.env.TL_ALLOW_DEV_HEADERS === "1") return false;
  if (process.env.TL_REQUIRE_JWT === "1") return true;
  return process.env.NODE_ENV === "production";
}

function allowElevatedFallback(req: IncomingMessage): boolean {
  const cookies = parseCookies(req);
  if (cookies[CONTENT_ACCESS_COOKIE] === "1") return true;
  if (process.env.TL_ALLOW_DEV_ROLES === "1") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

function bearerToken(req: IncomingMessage): string | null {
  const auth = headerString(req, "authorization");
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match?.[1]?.trim() || null;
}

async function resolveFromJwt(token: string): Promise<RequestIdentity | null> {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const user = data.user;
  let role: Role = "user";
  let displayName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Member";

  const authed = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile } = await authed
    .from("profiles")
    .select("role, display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    if (profile.role && isRole(profile.role)) role = profile.role;
    if (profile.display_name?.trim()) displayName = profile.display_name.trim();
  } else {
    const appRole = (user.app_metadata?.role as string | undefined) ?? "";
    if (isRole(appRole)) role = appRole;
  }

  return {
    userId: user.id,
    email: user.email ?? profile?.email ?? STUB_USER_EMAIL,
    role,
    displayName,
    source: "jwt",
    explicitRole: true,
  };
}

function resolveFallback(req: IncomingMessage): RequestIdentity {
  const cookies = parseCookies(req);
  const rawRole =
    headerString(req, "x-thrivelife-role") ?? cookies[DEV_ROLE_COOKIE];
  const explicitRole = Boolean(rawRole && isRole(rawRole));
  let role: Role =
    rawRole && isRole(rawRole) ? rawRole : "user";
  if (canAccessContentTools(role) && !allowElevatedFallback(req)) {
    role = "user";
  }
  const userId =
    headerString(req, "x-thrivelife-user") ?? STUB_USER_ID;
  const email =
    headerString(req, "x-thrivelife-email") ?? STUB_USER_EMAIL;
  const hasUserHeader = Boolean(headerString(req, "x-thrivelife-user"));
  return {
    userId,
    email,
    role,
    displayName: "Local user",
    source:
      userId === STUB_USER_ID && !hasUserHeader && !explicitRole
        ? "anonymous"
        : "fallback",
    explicitRole,
  };
}

export async function resolveRequestIdentity(
  req: IncomingMessage,
): Promise<RequestIdentity> {
  const cached = identityCache.get(req);
  if (cached) return cached;

  const token = bearerToken(req);
  if (token) {
    const fromJwt = await resolveFromJwt(token);
    if (fromJwt) {
      identityCache.set(req, fromJwt);
      return fromJwt;
    }
  }

  const identity = resolveFallback(req);
  identityCache.set(req, identity);
  return identity;
}

/** Clear cache between tests if needed. */
export function clearIdentityCache(req: IncomingMessage): void {
  identityCache.delete(req);
}
