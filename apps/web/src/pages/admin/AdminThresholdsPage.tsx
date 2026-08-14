import { useCallback, useEffect, useState } from "react";
import type { ScoringThreshold, ThresholdAuditEntry } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { userHasPermission } from "@/lib/auth";
import {
  fetchCollection,
  fetchContentDocument,
  updateCollectionItem,
} from "@/lib/content-api";

type ThresholdDraft = {
  levelName: string;
  minValue: string;
  maxValue: string;
  description: string;
};

function toDraft(row: ScoringThreshold): ThresholdDraft {
  return {
    levelName: row.levelName,
    minValue: row.minValue == null ? "" : String(row.minValue),
    maxValue: row.maxValue == null ? "" : String(row.maxValue),
    description: row.description,
  };
}

function parseBound(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid number: ${raw}`);
  }
  return value;
}

export function AdminThresholdsPage() {
  const canEdit = userHasPermission("canEditThresholds");
  const [rows, setRows] = useState<ScoringThreshold[]>([]);
  const [audit, setAudit] = useState<ThresholdAuditEntry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ThresholdDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const { document } = await fetchContentDocument();
      setRows(document.scoringThresholds);
      setAudit(document.thresholdAuditLog);
      const nextDrafts: Record<string, ThresholdDraft> = {};
      for (const row of document.scoringThresholds) {
        nextDrafts[row.id] = toDraft(row);
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load thresholds");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveRow(id: string) {
    if (!canEdit) return;
    const draft = drafts[id];
    if (!draft) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await updateCollectionItem<ScoringThreshold>("scoringThresholds", id, {
        levelName: draft.levelName,
        minValue: parseBound(draft.minValue),
        maxValue: parseBound(draft.maxValue),
        description: draft.description,
        isProvisional: true,
      });
      setMessage(`Saved ${id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function refreshAuditOnly() {
    try {
      const result = await fetchCollection<ThresholdAuditEntry>(
        "thresholdAuditLog",
      );
      setAudit(result.items);
    } catch {
      /* ignore — full reload covers this */
    }
  }

  useEffect(() => {
    void refreshAuditOnly();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Admin only"
        title="Scoring thresholds"
        description="Provisional §4.3 values — editable without a code release. Scorers must read these rows, never hard-coded bounds."
      />

      {!canEdit ? (
        <p className="mb-4 rounded-lg border border-border bg-warn-soft px-4 py-3 text-sm text-fixture">
          You can view thresholds, but only admins can edit.
        </p>
      ) : null}

      {error ? (
        <p
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-lg border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
          {message}
          {busy ? " · Working…" : ""}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Dimension</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Max</th>
              <th className="px-4 py-3">Notes</th>
              {canEdit ? <th className="px-4 py-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const draft = drafts[row.id] ?? toDraft(row);
              return (
                <tr key={row.id} className="border-b border-border/70 align-top">
                  <td className="px-4 py-3 capitalize">{row.dimension}</td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <input
                        className="w-28 rounded border border-input px-2 py-1"
                        value={draft.levelName}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...draft, levelName: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      row.levelName
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <input
                        className="w-20 rounded border border-input px-2 py-1"
                        value={draft.minValue}
                        placeholder="—"
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...draft, minValue: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      (row.minValue ?? "—")
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <input
                        className="w-20 rounded border border-input px-2 py-1"
                        value={draft.maxValue}
                        placeholder="—"
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...draft, maxValue: e.target.value },
                          }))
                        }
                      />
                    ) : (
                      (row.maxValue ?? "—")
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <textarea
                        className="min-h-16 w-full min-w-[180px] rounded border border-input px-2 py-1"
                        value={draft.description}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...draft,
                              description: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {row.description}
                      </span>
                    )}
                  </td>
                  {canEdit ? (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                        onClick={() => void saveRow(row.id)}
                        disabled={busy}
                      >
                        Save
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Threshold audit log
        </h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No threshold changes yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {audit.slice(0, 20).map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm"
              >
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.changedAt).toLocaleString()} ·{" "}
                  {entry.changedByRole} · {entry.thresholdId}
                </p>
                <p className="mt-1">
                  {entry.before.levelName} [{entry.before.minValue ?? "—"}–
                  {entry.before.maxValue ?? "—"}] → {entry.after.levelName} [
                  {entry.after.minValue ?? "—"}–{entry.after.maxValue ?? "—"}]
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
