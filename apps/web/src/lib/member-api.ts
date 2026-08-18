async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  headers.set("x-thrivelife-tz", tz);
  const res = await fetch(path, { ...init, headers, credentials: "same-origin" });
  if (res.status === 204) return { skipped: true } as T;
  const data = (await res.json()) as T & { error?: string; message?: string };
  if (!res.ok) {
    const err = new Error(data.message ?? data.error ?? `Request failed (${res.status})`) as Error & {
      status?: number;
      payload?: unknown;
    };
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export function fetchDashboard() {
  return apiFetch<Record<string, unknown>>("/api/me/dashboard");
}

export function fetchSupport() {
  return apiFetch<{
    disclaimer: string;
    alwaysAvailable: boolean;
    scoreTriggered: boolean;
    resources: Array<{ region: string; name: string; detail: string; url: string | null }>;
  }>("/api/support");
}

export function saveCheckIn(body: Record<string, unknown>) {
  return apiFetch<{ checkIn: unknown; restartMessage: string }>("/api/me/check-ins", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchRestartRail() {
  return apiFetch<{
    message: string;
    events: unknown[];
    metrics: {
      successfulReturns: number;
      planBUsage: number;
      averageMinutesToReturn: number | null;
      fourOfSeven: { completedCount: number; windowSize: number; consistent: boolean };
    };
  }>("/api/me/restart-rail");
}

export function postRestartRail(action: string) {
  return apiFetch<{ ok: boolean; message: string }>("/api/me/restart-rail", {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export function fetchTuneUps() {
  return apiFetch<{ tuneUps: unknown[]; supportActions: string[] }>("/api/me/tune-ups");
}

export function createTuneUp(body: Record<string, unknown>) {
  return apiFetch<{ tuneUp: unknown }>("/api/me/tune-ups", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function reviewTuneUp(id: string, body: Record<string, unknown>) {
  return apiFetch<{ tuneUp: unknown }>(
    `/api/me/tune-ups/${encodeURIComponent(id)}/review`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function fetchPrivacy() {
  return apiFetch<{ settings: Record<string, unknown> }>("/api/me/privacy");
}

export function savePrivacy(body: Record<string, unknown>) {
  return apiFetch<{ settings: Record<string, unknown> }>("/api/me/privacy", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function exportMyData() {
  return apiFetch<Record<string, unknown>>("/api/me/export");
}

export function deleteMyData() {
  return apiFetch<{ ok: boolean }>("/api/me/delete", {
    method: "POST",
    body: "{}",
  });
}

export function fetchOnboarding() {
  return apiFetch<{ progress: Record<string, unknown> }>("/api/me/onboarding");
}

export function saveOnboarding(body: Record<string, unknown>) {
  return apiFetch<{ progress: Record<string, unknown> }>("/api/me/onboarding", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function acceptConsent() {
  return apiFetch<{ consent: unknown }>("/api/me/consent", {
    method: "POST",
    body: "{}",
  });
}

export function postTelemetry(body: Record<string, unknown>) {
  return apiFetch<{ ok?: boolean }>("/api/me/telemetry", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
