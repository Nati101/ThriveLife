import type {
  AssessmentItem,
  AssessmentResponse,
  AssessmentSession,
  BatteryDefinition,
  Construct,
  InstrumentDefinition,
  InstrumentId,
  ResponseScale,
} from "@thrivelife/shared";
import { getSessionUser } from "@/lib/auth";

export type AssessmentApiError = {
  error: string;
  message?: string;
  locked?: boolean;
  daysSince?: number | null;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const role = getSessionUser().role;
  headers.set("x-thrivelife-role", role);

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  const data = (await res.json()) as T | AssessmentApiError;
  if (!res.ok) {
    const err = data as AssessmentApiError;
    const error = new Error(
      err.message ?? err.error ?? `Request failed (${res.status})`,
    ) as Error & { status?: number; payload?: AssessmentApiError };
    error.status = res.status;
    error.payload = err;
    throw error;
  }
  return data as T;
}

export type InstrumentBootstrap = {
  instrument: InstrumentDefinition;
  items: AssessmentItem[];
  scales: ResponseScale[];
  batteries: BatteryDefinition[];
  constructs: Construct[];
  eligibility: {
    locked: boolean;
    daysSince: number | null;
    message: string | null;
  } | null;
  inProgressSessionId: string | null;
};

export function fetchInstrumentBootstrap(instrumentId: InstrumentId) {
  return apiFetch<InstrumentBootstrap>(
    `/api/assessments/instruments/${instrumentId}`,
  );
}

export function startAssessmentSession(
  instrumentId: InstrumentId,
  options?: { forceNew?: boolean },
) {
  return apiFetch<{
    session: AssessmentSession;
    responses: AssessmentResponse[];
    resumed: boolean;
  }>("/api/assessments/sessions", {
    method: "POST",
    body: JSON.stringify({
      instrumentId,
      forceNew: options?.forceNew ?? false,
    }),
  });
}

export function fetchAssessmentSession(sessionId: string) {
  return apiFetch<{
    session: AssessmentSession;
    responses: AssessmentResponse[];
    batteryResults: unknown[];
    overchargeFlag: unknown;
  }>(`/api/assessments/sessions/${encodeURIComponent(sessionId)}`);
}

export function saveAssessmentResponses(
  sessionId: string,
  responses: Array<{
    itemId: string;
    answer: number | string | null;
    skipped?: boolean;
  }>,
) {
  return apiFetch<{
    session: AssessmentSession;
    responses: AssessmentResponse[];
  }>(`/api/assessments/sessions/${encodeURIComponent(sessionId)}/responses`, {
    method: "PUT",
    body: JSON.stringify({ responses }),
  });
}

export function completeAssessmentSession(
  sessionId: string,
  body?: Record<string, unknown>,
) {
  return apiFetch<Record<string, unknown>>(
    `/api/assessments/sessions/${encodeURIComponent(sessionId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    },
  );
}

export function dismissOvercharge(sessionId: string) {
  return apiFetch<{ ok: boolean }>(
    `/api/assessments/sessions/${encodeURIComponent(sessionId)}/overcharge/dismiss`,
    { method: "POST", body: "{}" },
  );
}

export function fetchAuthority() {
  return apiFetch<{ authority: unknown }>("/api/assessments/me/authority");
}
