import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INSTRUMENT_IDS,
  RECHARGE_DURATION_TIERS,
  type AssessmentItem,
  type Construct,
  type ContentSummary,
  type InstrumentId,
  type RechargeAction,
  type ResponseScale,
  type ScoringDirection,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { getSessionUser, userHasPermission } from "@/lib/auth";
import {
  createCollectionItem,
  deleteCollectionItem,
  fetchContentDocument,
  fetchConstructWithVariants,
  resetContentStore,
  updateCollectionItem,
} from "@/lib/content-api";

type TabId = "overview" | "constructs" | "items" | "recharge" | "scales";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "constructs", label: "Constructs" },
  { id: "items", label: "Items" },
  { id: "recharge", label: "Recharge" },
  { id: "scales", label: "Scales" },
];

export function AdminContentPage() {
  const canDraft = userHasPermission("canDraftContent");
  const canReset = userHasPermission("canEditThresholds");
  const [tab, setTab] = useState<TabId>("overview");
  const [summary, setSummary] = useState<ContentSummary | null>(null);
  const [constructs, setConstructs] = useState<Construct[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [rechargeActions, setRechargeActions] = useState<RechargeAction[]>([]);
  const [scales, setScales] = useState<ResponseScale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedConstructId, setSelectedConstructId] = useState<string | null>(
    null,
  );
  const [variants, setVariants] = useState<{
    moment: AssessmentItem[];
    twoWeek: AssessmentItem[];
  } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState("");
  const [constructDraft, setConstructDraft] = useState("");
  const [rechargeDraftId, setRechargeDraftId] = useState<string | null>(null);
  const [rechargeDraft, setRechargeDraft] = useState({
    instructions: "",
    planAText: "",
    planBText: "",
  });

  const load = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const { summary: nextSummary, document } = await fetchContentDocument();
      setSummary(nextSummary);
      setConstructs(document.constructs);
      setItems(document.items);
      setRechargeActions(document.rechargeActions);
      setScales(document.responseScales);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeItems = useMemo(
    () => items.filter((item) => item.active),
    [items],
  );
  const inactiveCount = items.length - activeItems.length;

  async function selectConstruct(id: string) {
    setSelectedConstructId(id);
    setError(null);
    try {
      const result = await fetchConstructWithVariants(id);
      setVariants(result.timeframeVariants);
      setConstructDraft(result.item.definition);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load construct");
    }
  }

  async function saveConstructDefinition() {
    if (!selectedConstructId || !canDraft) return;
    setBusy(true);
    setError(null);
    try {
      await updateCollectionItem<Construct>("constructs", selectedConstructId, {
        definition: constructDraft,
        isFixture: false,
      });
      await load();
      await selectConstruct(selectedConstructId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveItemWording(item: AssessmentItem) {
    if (!canDraft) return;
    setBusy(true);
    setError(null);
    try {
      await updateCollectionItem<AssessmentItem>("items", item.id, {
        wording: itemDraft,
      });
      setEditingItemId(null);
      await load();
      if (selectedConstructId) await selectConstruct(selectedConstructId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleItemActive(item: AssessmentItem) {
    if (!canDraft) return;
    setBusy(true);
    setError(null);
    try {
      if (item.active) {
        await deleteCollectionItem("items", item.id);
      } else {
        await updateCollectionItem<AssessmentItem>("items", item.id, {
          active: true,
        });
      }
      await load();
      if (selectedConstructId) await selectConstruct(selectedConstructId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function addItem() {
    if (!canDraft) return;
    setBusy(true);
    setError(null);
    try {
      const constructId =
        selectedConstructId ?? constructs[0]?.id ?? "construct_physical_capacity";
      await createCollectionItem<AssessmentItem>("items", {
        constructId,
        instrumentId: "full_assessment" satisfies InstrumentId,
        batteryId: constructs.find((c) => c.id === constructId)?.batteryId ?? null,
        timeframe: "two_week",
        wording: "[DRAFT] New assessment item",
        responseScaleId: scales[0]?.id ?? "scale_frequency_0_4",
        scoringDirection: "higher_is_more_capacity" satisfies ScoringDirection,
        version: 1,
        active: true,
      });
      await load();
      setTab("items");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveRecharge(action: RechargeAction) {
    if (!canDraft) return;
    setBusy(true);
    setError(null);
    try {
      await updateCollectionItem<RechargeAction>("rechargeActions", action.id, {
        ...rechargeDraft,
        isFixture: false,
      });
      setRechargeDraftId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function addRecharge() {
    if (!canDraft) return;
    setBusy(true);
    setError(null);
    try {
      await createCollectionItem<RechargeAction>("rechargeActions", {
        batteryId: "physical",
        durationTier: RECHARGE_DURATION_TIERS[1],
        modeSuitability: ["green", "yellow", "red"],
        instructions: "[DRAFT] New recharge instructions",
        planAText: "[DRAFT] Plan A",
        planBText: "[DRAFT] Plan B",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function addScale() {
    if (!canDraft) return;
    setBusy(true);
    setError(null);
    try {
      await createCollectionItem<ResponseScale>("responseScales", {
        name: "New response scale",
        labels: ["0", "1", "2", "3", "4"],
        storedType: "integer",
        minValue: 0,
        maxValue: 4,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!canReset) return;
    if (
      !window.confirm(
        "Reset content store to shared fixtures? Local edits will be lost.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetContentStore();
      setSelectedConstructId(null);
      setVariants(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  const role = getSessionUser().role;

  return (
    <div>
      <PageHeader
        eyebrow="Editor / reviewer / admin"
        title="Content library"
        description="CRUD against the local content store (seeded from fixtures). Changes persist across refresh — no code release required."
      />

      {error ? (
        <p
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === entry.id
                ? "bg-primary text-primary-foreground"
                : "bg-white text-muted-foreground shadow-sm ring-1 ring-border hover:text-foreground"
            }`}
          >
            {entry.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Role: {role}
          {busy ? " · Saving…" : ""}
        </span>
      </div>

      {tab === "overview" ? (
        <section className="space-y-6">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Batteries", summary?.batteries ?? "—"],
                ["Constructs", summary?.constructs ?? "—"],
                ["Instruments", summary?.instruments ?? "—"],
                ["Items (active)", activeItems.length],
                ["Items (inactive)", inactiveCount],
                ["Recharge actions", summary?.rechargeActions ?? "—"],
                ["Response scales", summary?.responseScales ?? "—"],
                ["Thresholds", summary?.scoringThresholds ?? "—"],
              ] as const
            ).map(([label, count]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
              >
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-2xl font-bold text-gray-800">{count}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-muted-foreground">
            Store updated{" "}
            {summary?.updatedAt
              ? new Date(summary.updatedAt).toLocaleString()
              : "—"}
            . Seeded{" "}
            {summary?.seededAt
              ? new Date(summary.seededAt).toLocaleString()
              : "—"}
            .
          </p>
          {canReset ? (
            <button
              type="button"
              onClick={() => void handleReset()}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Reset to fixtures (admin)
            </button>
          ) : null}
          {!canDraft ? (
            <p className="text-sm text-muted-foreground">
              Read-only for this role. Switch to editor/reviewer/admin to edit.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "constructs" ? (
        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <ul className="max-h-[70vh] space-y-1 overflow-auto rounded-xl border border-border bg-white p-2 shadow-sm">
            {constructs.map((construct) => (
              <li key={construct.id}>
                <button
                  type="button"
                  onClick={() => void selectConstruct(construct.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selectedConstructId === construct.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium">{construct.dimension}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {construct.batteryId}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            {selectedConstructId && variants ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedConstructId}
                </h2>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">
                    Definition
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-input px-3 py-2"
                    value={constructDraft}
                    disabled={!canDraft}
                    onChange={(e) => setConstructDraft(e.target.value)}
                  />
                </label>
                {canDraft ? (
                  <button
                    type="button"
                    onClick={() => void saveConstructDefinition()}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Save definition
                  </button>
                ) : null}
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Moment timeframe variants
                  </h3>
                  <ItemVariantList items={variants.moment} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Two-week timeframe variants
                  </h3>
                  <ItemVariantList items={variants.twoWeek} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a construct to edit its definition and see all timeframe
                item variants together.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {tab === "items" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {canDraft ? (
              <button
                type="button"
                onClick={() => void addItem()}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Add item
              </button>
            ) : null}
            <p className="self-center text-xs text-muted-foreground">
              Instruments: {INSTRUMENT_IDS.join(", ")}. Deactivate keeps history.
            </p>
          </div>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.instrumentId} · v{item.version} ·{" "}
                      {item.timeframe}
                      {!item.active ? " · inactive" : ""}
                      {item.isFixture ? (
                        <>
                          {" "}
                          · <span className="text-fixture">[FIXTURE]</span>
                        </>
                      ) : null}
                    </p>
                    {editingItemId === item.id ? (
                      <textarea
                        className="mt-2 min-h-20 w-full min-w-[280px] rounded-lg border border-input px-3 py-2 text-sm"
                        value={itemDraft}
                        onChange={(e) => setItemDraft(e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-800">{item.wording}</p>
                    )}
                  </div>
                  {canDraft ? (
                    <div className="flex flex-wrap gap-2">
                      {editingItemId === item.id ? (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                            onClick={() => void saveItemWording(item)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-border px-2 py-1 text-xs"
                            onClick={() => setEditingItemId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg border border-border px-2 py-1 text-xs"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setItemDraft(item.wording);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-xs"
                        onClick={() => void toggleItemActive(item)}
                      >
                        {item.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "recharge" ? (
        <section className="space-y-4">
          {canDraft ? (
            <button
              type="button"
              onClick={() => void addRecharge()}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Add recharge action
            </button>
          ) : null}
          <ul className="space-y-3">
            {rechargeActions.map((action) => (
              <li
                key={action.id}
                className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-xs text-muted-foreground">
                  {action.batteryId} · {action.durationTier} · modes{" "}
                  {action.modeSuitability.join(", ")}
                  {action.isFixture ? (
                    <>
                      {" "}
                      · <span className="text-fixture">[FIXTURE]</span>
                    </>
                  ) : null}
                </p>
                {rechargeDraftId === action.id ? (
                  <div className="mt-2 space-y-2">
                    {(
                      [
                        ["instructions", "Instructions"],
                        ["planAText", "Plan A"],
                        ["planBText", "Plan B"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="block text-sm">
                        <span className="mb-1 block text-muted-foreground">
                          {label}
                        </span>
                        <textarea
                          className="min-h-16 w-full rounded-lg border border-input px-3 py-2"
                          value={rechargeDraft[key]}
                          onChange={(e) =>
                            setRechargeDraft((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </label>
                    ))}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                        onClick={() => void saveRecharge(action)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-3 py-1.5 text-sm"
                        onClick={() => setRechargeDraftId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1 text-sm">
                    <p>{action.instructions}</p>
                    <p className="text-muted-foreground">A: {action.planAText}</p>
                    <p className="text-muted-foreground">B: {action.planBText}</p>
                    {canDraft ? (
                      <button
                        type="button"
                        className="mt-2 rounded-lg border border-border px-2 py-1 text-xs"
                        onClick={() => {
                          setRechargeDraftId(action.id);
                          setRechargeDraft({
                            instructions: action.instructions,
                            planAText: action.planAText,
                            planBText: action.planBText,
                          });
                        }}
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "scales" ? (
        <section className="space-y-4">
          {canDraft ? (
            <button
              type="button"
              onClick={() => void addScale()}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Add response scale
            </button>
          ) : null}
          <ul className="space-y-2">
            {scales.map((scale) => (
              <li
                key={scale.id}
                className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
              >
                <p className="font-medium text-gray-800">{scale.name}</p>
                <p className="text-xs text-muted-foreground">
                  {scale.id} · {scale.storedType} · {scale.minValue ?? "—"}–
                  {scale.maxValue ?? "—"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {scale.labels.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ItemVariantList({ items }: { items: AssessmentItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No items for this timeframe.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-border/80 bg-gray-50 px-3 py-2 text-sm"
        >
          <span className="text-xs text-muted-foreground">
            {item.instrumentId} · v{item.version}
            {!item.active ? " · inactive" : ""}
          </span>
          <p className="mt-0.5">{item.wording}</p>
        </li>
      ))}
    </ul>
  );
}
