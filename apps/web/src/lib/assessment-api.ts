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
import { apiFetch } from "@/lib/api-fetch";

export type AssessmentApiError = {
  error: string;
  message?: string;
  locked?: boolean;
  daysSince?: number | null;
};

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
