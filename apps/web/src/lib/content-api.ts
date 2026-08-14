import type {
  AssessmentItem,
  Construct,
  ContentDocument,
  ContentSummary,
  RechargeAction,
  ResponseScale,
  ScoringThreshold,
  ThresholdAuditEntry,
} from "@thrivelife/shared";
import { DEV_ROLE_COOKIE, getSessionUser } from "@/lib/auth";

export type ContentApiError = {
  error: string;
  message?: string;
};

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const role = getSessionUser().role;
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // Cookie is sent same-origin; also set header fallback for clarity in stubs
  if (!document.cookie.includes(`${DEV_ROLE_COOKIE}=`)) {
    document.cookie = `${DEV_ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; SameSite=Lax`;
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const data = (await res.json()) as T | ContentApiError;
  if (!res.ok) {
    const err = data as ContentApiError;
    throw new Error(err.message ?? err.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export function fetchContentDocument() {
  return apiFetch<{ summary: ContentSummary; document: ContentDocument }>(
    "/api/content",
  );
}

export function fetchContentSummary() {
  return apiFetch<ContentSummary>("/api/content/summary");
}

export function resetContentStore() {
  return apiFetch<{ ok: boolean; summary: ContentSummary; message: string }>(
    "/api/content/reset",
    { method: "POST" },
  );
}

export function fetchCollection<T>(collection: string) {
  return apiFetch<{ items: T[] }>(`/api/content/${collection}`);
}

export function createCollectionItem<T>(collection: string, body: unknown) {
  return apiFetch<{ item: T }>(`/api/content/${collection}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCollectionItem<T>(
  collection: string,
  id: string,
  body: unknown,
) {
  return apiFetch<{ item: T }>(`/api/content/${collection}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteCollectionItem(collection: string, id: string) {
  return apiFetch<{ ok: boolean; softDeleted?: boolean; message?: string }>(
    `/api/content/${collection}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function fetchConstructWithVariants(id: string) {
  return apiFetch<{
    item: Construct;
    timeframeVariants: {
      moment: AssessmentItem[];
      twoWeek: AssessmentItem[];
    };
  }>(`/api/content/constructs/${encodeURIComponent(id)}`);
}

export type {
  AssessmentItem,
  Construct,
  ContentDocument,
  ContentSummary,
  RechargeAction,
  ResponseScale,
  ScoringThreshold,
  ThresholdAuditEntry,
};
