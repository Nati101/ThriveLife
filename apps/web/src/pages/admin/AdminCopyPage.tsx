import { useCallback, useEffect, useState } from "react";
import type { ContentCopy, RecommendationLookup } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { getSessionUser, userHasPermission } from "@/lib/auth";
import {
  createCollectionItem,
  fetchContentDocument,
  updateCollectionItem,
} from "@/lib/content-api";

export function AdminCopyPage() {
  const canDraft = userHasPermission("canDraftContent");
  const canPublish = userHasPermission("canPublishContent");
  const [copy, setCopy] = useState<ContentCopy[]>([]);
  const [lookups, setLookups] = useState<RecommendationLookup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { document } = await fetchContentDocument();
    setCopy(document.contentCopy);
    setLookups(document.recommendationLookups);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : "Failed"),
    );
  }, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Copy and recommendation lookups"
        description="Result / safety / notification copy and the battery × mode × time lookup table. Draft → review → publish. Signed in as stub."
      />
      <p className="mb-4 text-sm text-muted-foreground">
        {getSessionUser().role} · draft {canDraft ? "yes" : "no"} · publish{" "}
        {canPublish ? "yes" : "no"}
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <h2 className="mb-3 text-lg font-semibold">Copy</h2>
      <ul className="mb-8 space-y-3">
        {copy.map((row) => (
          <li key={row.id} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs uppercase text-muted-foreground">
              {row.kind} · {row.workflowStatus} · {row.key}
            </p>
            <p className="font-semibold">{row.title}</p>
            <textarea
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
              defaultValue={row.body}
              disabled={!canDraft}
              onBlur={(e) => {
                if (e.target.value !== row.body) {
                  void updateCollectionItem("contentCopy", row.id, {
                    body: e.target.value,
                    isFixture: false,
                  }).then(() => load());
                }
              }}
            />
            {canPublish ? (
              <button
                type="button"
                className="mt-2 rounded-lg border border-border px-3 py-1 text-xs"
                onClick={() => {
                  void fetch(
                    `/api/content/contentCopy/${encodeURIComponent(row.id)}/workflow`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "same-origin",
                      body: JSON.stringify({ action: "publish" }),
                    },
                  ).then(() => load());
                }}
              >
                Publish
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {canDraft ? (
        <button
          type="button"
          className="mb-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
          onClick={() =>
            void createCollectionItem("contentCopy", {
              kind: "result",
              key: `custom.${Date.now()}`,
              title: "New copy",
              body: "[draft]",
            }).then(() => load())
          }
        >
          Add copy row
        </button>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold">Lookup table</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {lookups.length} rows (battery × mode × duration → action). Reorder via
        sortOrder.
      </p>
      <ul className="space-y-2 text-sm">
        {lookups.slice(0, 24).map((row) => (
          <li key={row.id} className="rounded-lg border border-border bg-white px-3 py-2">
            {row.batteryId} · {row.mode} · {row.durationTier} → {row.rechargeActionId}{" "}
            ({row.workflowStatus})
          </li>
        ))}
      </ul>
    </div>
  );
}
