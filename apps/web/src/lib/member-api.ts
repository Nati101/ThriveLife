import { apiFetch } from "@/lib/api-fetch";

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
