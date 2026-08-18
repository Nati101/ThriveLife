import { DEV_ROLE_COOKIE, getSessionUser } from "@/lib/auth";
import { dispatchStaticRequest } from "@/lib/static-backend";

export type ApiError = Error & {
  status?: number;
  payload?: unknown;
};

let liveApi: boolean | null = null;
let liveProbe: Promise<boolean> | null = null;

function healthUrl(): string {
  return "/api/health";
}

async function probeLiveApi(): Promise<boolean> {
  if (liveApi !== null) return liveApi;
  if (liveProbe) return liveProbe;
  liveProbe = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const res = await fetch(healthUrl(), {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("json")) {
        liveApi = false;
        return false;
      }
      const data = (await res.json()) as { ok?: boolean };
      liveApi = data.ok === true;
      return liveApi;
    } catch {
      liveApi = false;
      return false;
    } finally {
      clearTimeout(timer);
      liveProbe = null;
    }
  })();
  return liveProbe;
}

export function isStaticHost(): boolean {
  return liveApi === false;
}

export function resetLiveApiProbe(): void {
  liveApi = null;
  liveProbe = null;
}

function withHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const user = getSessionUser();
  headers.set("x-thrivelife-role", user.role);
  headers.set("x-thrivelife-tz", Intl.DateTimeFormat().resolvedOptions().timeZone);
  if (typeof document !== "undefined" && !document.cookie.includes(`${DEV_ROLE_COOKIE}=`)) {
    document.cookie = `${DEV_ROLE_COOKIE}=${encodeURIComponent(user.role)}; path=/; SameSite=Lax`;
  }
  return headers;
}

function throwApiError(status: number, data: { error?: string; message?: string }): never {
  const err = new Error(data.message ?? data.error ?? `Request failed (${status})`) as ApiError;
  err.status = status;
  err.payload = data;
  throw err;
}

function parseBody(init?: RequestInit): unknown {
  if (init?.body == null) return undefined;
  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body) as unknown;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function fromStatic<T>(path: string, init?: RequestInit): T {
  const user = getSessionUser();
  const result = dispatchStaticRequest({
    method: (init?.method ?? "GET").toUpperCase(),
    path,
    body: parseBody(init),
    userId: user.id,
    role: user.role,
  });
  if (result.status === 204) return { skipped: true } as T;
  if (result.status >= 400) {
    throwApiError(result.status, result.json);
  }
  return result.json as T;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const live = await probeLiveApi();
  if (!live) return fromStatic<T>(path, init);

  try {
    const res = await fetch(path, {
      ...init,
      headers: withHeaders(init),
      credentials: "same-origin",
    });
    if (res.status === 204) return { skipped: true } as T;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      liveApi = false;
      return fromStatic<T>(path, init);
    }
    const data = (await res.json()) as T & { error?: string; message?: string };
    if (!res.ok) throwApiError(res.status, data);
    return data;
  } catch (err) {
    if ((err as ApiError).status) throw err;
    liveApi = false;
    return fromStatic<T>(path, init);
  }
}
