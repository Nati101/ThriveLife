import { useCallback, useEffect, useState } from "react";
import type { ContentCopy, RecommendationLookup } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { getSessionUser, userHasPermission } from "@/lib/auth";
import {
  createCollectionItem,
  fetchContentDocument,
  postContentWorkflow,
  updateCollectionItem,
} from "@/lib/content-api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";

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
      {error ? <ErrorState message={error} /> : null}
      <h2 className="mb-3 text-lg font-semibold text-gray-800">Copy</h2>
      <ul className="mb-8 space-y-3">
        {copy.map((row) => (
          <li key={row.id}>
            <Card>
              <p className="text-xs uppercase text-muted-foreground">
                {row.kind} · {row.workflowStatus} · {row.key}
              </p>
              <p className="mt-1 font-semibold text-gray-800">{row.title}</p>
              <Textarea
                className="mt-2"
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
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    void postContentWorkflow("contentCopy", row.id, "publish").then(
                      () => load(),
                    );
                  }}
                >
                  Publish
                </Button>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
      {canDraft ? (
        <Button
          className="mb-8"
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
        </Button>
      ) : null}

      <CardTitle className="mb-3">Lookup table</CardTitle>
      <p className="mb-3 text-sm text-muted-foreground">
        {lookups.length} rows (battery × mode × duration → action). Reorder via
        sortOrder.
      </p>
      <ul className="space-y-2 text-sm">
        {lookups.slice(0, 24).map((row) => (
          <li key={row.id}>
            <Card className="px-3 py-2">
              {row.batteryId} · {row.mode} · {row.durationTier} → {row.rechargeActionId}{" "}
              ({row.workflowStatus})
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
