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
import { apiFetch } from "@/lib/api-fetch";

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
