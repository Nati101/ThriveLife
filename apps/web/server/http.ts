/**
 * Shared HTTP helpers for Vite /api middleware.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { canAccessContentTools, isRole, type Role } from "@thrivelife/shared";
import { CONTENT_ACCESS_COOKIE, DEV_ROLE_COOKIE } from "./content-invite.ts";

export { DEV_ROLE_COOKIE, CONTENT_ACCESS_COOKIE };
export const STUB_USER_ID = "stub-user-local";
export const STUB_USER_EMAIL = "local@thrivelife.dev";

export type JsonBody =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export function sendJson(res: ServerResponse, status: number, body: JsonBody): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

export function headerString(
  req: IncomingMessage,
  name: string,
): string | null {
  const raw = req.headers[name];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw[0]?.trim()) return raw[0].trim();
  return null;
}

function allowElevatedRoles(req: IncomingMessage): boolean {
  const cookies = parseCookies(req);
  if (cookies[CONTENT_ACCESS_COOKIE] === "1") return true;
  if (process.env.TL_ALLOW_DEV_ROLES === "1") return true;
  // Vite `npm run dev` is not production; allow local RBAC testing.
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export function roleFromRequest(req: IncomingMessage): Role | null {
  const raw =
    headerString(req, "x-thrivelife-role") ?? parseCookies(req)[DEV_ROLE_COOKIE];
  if (!raw || !isRole(raw)) return null;
  if (canAccessContentTools(raw) && !allowElevatedRoles(req)) {
    return "user";
  }
  return raw;
}

export function userIdFromRequest(req: IncomingMessage): string {
  return headerString(req, "x-thrivelife-user") ?? STUB_USER_ID;
}

export function emailFromRequest(req: IncomingMessage): string {
  return headerString(req, "x-thrivelife-email") ?? STUB_USER_EMAIL;
}

export function timezoneFromRequest(req: IncomingMessage): string {
  return headerString(req, "x-thrivelife-tz") ?? "America/Edmonton";
}

export function clientKey(req: IncomingMessage): string {
  const forwarded = headerString(req, "x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.socket?.remoteAddress || "local";
  return `${ip}:${userIdFromRequest(req)}`;
}

export async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { _value: parsed };
  } catch {
    return { _parseError: true };
  }
}
