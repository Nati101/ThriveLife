import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BATTERY_STATE_LABELS,
  DRIVING_MODE_LABELS,
  type AssessmentItem,
  type AssessmentResponse,
  type AssessmentSession,
  type BatteryDefinition,
  type BatteryState,
  type InstrumentId,
  type ResponseScale,
} from "@thrivelife/shared";
import {
  completeAssessmentSession,
  dismissOvercharge,
  fetchInstrumentBootstrap,
  saveAssessmentResponses,
  startAssessmentSession,
  type InstrumentBootstrap,
} from "@/lib/assessment-api";
import { PageHeader } from "@/components/PageHeader";

type AnswerValue = number | string | null;

function scaleOptions(scale: ResponseScale | undefined): Array<{
  value: AnswerValue;
  label: string;
  isMissing: boolean;
}> {
  if (!scale) return [];
  if (scale.storedType === "integer" && scale.minValue != null && scale.maxValue != null) {
    const options: Array<{ value: AnswerValue; label: string; isMissing: boolean }> =
      [];
    for (let n = scale.minValue; n <= scale.maxValue; n += 1) {
      const label = scale.labels[n] ?? String(n);
      options.push({ value: n, label, isMissing: false });
    }
    // Trailing N/A label if present beyond max
    if (scale.labels.length > scale.maxValue - scale.minValue + 1) {
      const naLabel = scale.labels[scale.labels.length - 1] ?? "N/A";
      options.push({ value: null, label: naLabel, isMissing: true });
    }
    return options;
  }
  return scale.labels.map((label) => {
    const lower = label.toLowerCase();
    const isMissing = lower === "unsure" || lower === "n/a" || lower === "na";
    return {
      value: isMissing ? null : lower,
      label,
      isMissing,
    };
  });
}

function answerKey(responses: AssessmentResponse[], itemId: string): AnswerValue | undefined {
  const row = responses.find((r) => r.itemId === itemId);
  if (!row) return undefined;
  if (row.skipped) return null;
  return row.answer;
}

export function InstrumentSessionView({
  instrumentId,
  title,
  description,
  eyebrow,
}: {
  instrumentId: InstrumentId;
  title: string;
  description: string;
  eyebrow: string;
}) {
  const [bootstrap, setBootstrap] = useState<InstrumentBootstrap | null>(null);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [followUps, setFollowUps] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const data = await fetchInstrumentBootstrap(instrumentId);
        if (cancelled) return;
        setBootstrap(data);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load instrument");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instrumentId]);

  const scaleById = useMemo(() => {
    const map = new Map<string, ResponseScale>();
    for (const scale of bootstrap?.scales ?? []) map.set(scale.id, scale);
    return map;
  }, [bootstrap]);

  const batteryById = useMemo(() => {
    const map = new Map<string, BatteryDefinition>();
    for (const battery of bootstrap?.batteries ?? []) map.set(battery.id, battery);
    return map;
  }, [bootstrap]);

  const items = bootstrap?.items ?? [];
  const currentItem = items[index] ?? null;
  const locked =
    instrumentId === "full_assessment" && bootstrap?.eligibility?.locked === true;

  async function begin(forceNew = false) {
    try {
      setSaving(true);
      setError(null);
      setResult(null);
      const started = await startAssessmentSession(instrumentId, { forceNew });
      setSession(started.session);
      setResponses(started.responses);
      setIndex(0);
      setFollowUps({});
    } catch (err) {
      const payload = (err as { payload?: { message?: string; error?: string } })
        .payload;
      setError(
        payload?.message ??
          (err instanceof Error ? err.message : "Could not start session"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function persistAnswer(
    itemId: string,
    answer: AnswerValue,
    skipped = false,
  ) {
    if (!session) return;
    setSaving(true);
    try {
      const saved = await saveAssessmentResponses(session.id, [
        { itemId, answer, skipped },
      ]);
      setResponses(saved.responses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function chooseAnswer(item: AssessmentItem, answer: AnswerValue) {
    // Battery Scan Unsure → follow-up
    if (
      instrumentId === "battery_scan" &&
      answer === null &&
      !item.id.endsWith("__followup")
    ) {
      await persistAnswer(item.id, null, false);
      setFollowUps((prev) => ({ ...prev, [item.id]: true }));
      return;
    }
    await persistAnswer(item.id, answer, answer === null);
    if (instrumentId === "battery_scan" && item.id.endsWith("__followup")) {
      // done with follow-up
    } else {
      setFollowUps((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
    if (index < items.length - 1) setIndex((i) => i + 1);
  }

  async function chooseFollowUp(baseItem: AssessmentItem, level: "low" | "steady") {
    await persistAnswer(`${baseItem.id}__followup`, level, false);
    setFollowUps((prev) => {
      const next = { ...prev };
      delete next[baseItem.id];
      return next;
    });
    if (index < items.length - 1) setIndex((i) => i + 1);
  }

  async function finish(extra?: Record<string, unknown>) {
    if (!session) return;
    setSaving(true);
    try {
      const completed = await completeAssessmentSession(session.id, extra);
      setResult(completed);
      setSession((completed.session as AssessmentSession) ?? session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Complete failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        <p className="text-sm text-muted-foreground">Loading instrument from store…</p>
      </div>
    );
  }

  if (error && !bootstrap) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (result) {
    return (
      <ResultsPanel
        instrumentId={instrumentId}
        result={result}
        batteryById={batteryById}
        onDismissOvercharge={async () => {
          const sess = result.session as AssessmentSession | undefined;
          if (!sess) return;
          await dismissOvercharge(sess.id);
          setResult((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              overchargeDismissed: true,
            };
          });
        }}
        onAgain={() => {
          setResult(null);
          setSession(null);
          setResponses([]);
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      {bootstrap?.instrument ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {bootstrap.instrument.completionSecondsHint} ·{" "}
          {items.length} active items from content store · authority:{" "}
          {bootstrap.instrument.dashboardAuthority}
        </p>
      ) : null}

      {locked ? (
        <div className="rounded-xl border border-amber-200 bg-warn-soft p-4 text-sm text-fixture">
          <p className="font-medium">Full Assessment not available yet</p>
          <p className="mt-2">{bootstrap?.eligibility?.message}</p>
          <Link
            to="/check-in"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Go to daily check-in
          </Link>
        </div>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      {!session && !locked ? (
        <div className="space-y-3">
          {instrumentId === "full_assessment" ? (
            <p className="text-sm text-muted-foreground">
              Instructions: think about the <strong>past two weeks</strong>. Answer
              with the number + word label. Use N/A when an item does not apply —
              N/A is stored as missing, never as a middle score.
            </p>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void begin(false)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {bootstrap?.inProgressSessionId ? "Resume session" : "Start"}
          </button>
          {bootstrap?.inProgressSessionId ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void begin(true)}
              className="ml-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-50"
            >
              Start fresh
            </button>
          ) : null}
        </div>
      ) : null}

      {session && currentItem ? (
        <div className="mt-6 max-w-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Item {index + 1} of {items.length}
            </span>
            <span>Session {session.id.slice(-8)}</span>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
            {currentItem.isFixture ? (
              <p className="text-xs text-fixture">Fixture item — not clinical wording</p>
            ) : null}
            {currentItem.batteryId ? (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {batteryById.get(currentItem.batteryId)?.name ?? currentItem.batteryId}
              </p>
            ) : null}
            <p className="mt-2 text-base text-foreground">{currentItem.wording}</p>

            {followUps[currentItem.id] ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Would you say it&apos;s closer to Low or Steady?
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["low", "steady"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={saving}
                      onClick={() => void chooseFollowUp(currentItem, level)}
                      className="rounded-lg border border-border px-3 py-2 text-sm capitalize hover:bg-gray-50"
                    >
                      {level}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      void persistAnswer(currentItem.id, null, true);
                      setFollowUps((prev) => {
                        const next = { ...prev };
                        delete next[currentItem.id];
                        return next;
                      });
                      if (index < items.length - 1) setIndex((i) => i + 1);
                    }}
                    className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    Skip (missing)
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {scaleOptions(scaleById.get(currentItem.responseScaleId)).map(
                  (opt) => {
                    const selected = answerKey(responses, currentItem.id);
                    const highlighted =
                      selected !== undefined && selected === opt.value;
                    return (
                      <button
                        key={`${opt.label}-${String(opt.value)}`}
                        type="button"
                        disabled={saving}
                        onClick={() => void chooseAnswer(currentItem, opt.value)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          highlighted
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  },
                )}
                {instrumentId !== "weekly_mode_check" ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void chooseAnswer(currentItem, null)}
                    className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    Skip
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={index === 0 || saving}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={index >= items.length - 1 || saving}
              onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
              className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (instrumentId === "weekly_mode_check" && currentItem) {
                  const ans = answerKey(responses, currentItem.id);
                  void finish({
                    declaredMode:
                      typeof ans === "string" ? ans : ans === null ? "unsure" : ans,
                  });
                } else {
                  void finish();
                }
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Complete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultsPanel({
  instrumentId,
  result,
  batteryById,
  onDismissOvercharge,
  onAgain,
}: {
  instrumentId: InstrumentId;
  result: Record<string, unknown>;
  batteryById: Map<string, BatteryDefinition>;
  onDismissOvercharge: () => Promise<void>;
  onAgain: () => void;
}) {
  const session = result.session as AssessmentSession | undefined;
  const summary = (session?.resultSummary ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Results"
        title={`${eyebrowTitle(instrumentId)} complete`}
        description="Persisted to local sessions.json for stub user. Scan and Full Assessment stay separate."
      />

      {instrumentId === "drain_check" ? (
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm text-foreground">
            Total DRAIN score:{" "}
            <strong>
              {String(
                summary.totalScore ??
                  (result.drain as { totalScore?: number } | undefined)
                    ?.totalScore,
              )}
            </strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Intervention priority this session:{" "}
            {String(
              summary.interventionTriggered ??
                (result.drain as { interventionTriggered?: boolean })?.interventionTriggered,
            )}
          </p>
          <p className="mt-3 text-xs text-fixture">
            DRAIN Check does not write battery states.
          </p>
        </div>
      ) : null}

      {instrumentId === "battery_scan" ? (
        <ScanResults result={result} summary={summary} batteryById={batteryById} />
      ) : null}

      {instrumentId === "full_assessment" ? (
        <FullResults
          result={result}
          summary={summary}
          batteryById={batteryById}
          onDismissOvercharge={onDismissOvercharge}
        />
      ) : null}

      {instrumentId === "weekly_mode_check" ? (
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm">
            Declared mode:{" "}
            <strong className="capitalize">
              {String(summary.declaredMode ?? (result.mode as { declaredMode?: string })?.declaredMode)}
            </strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Suggested (advisory):{" "}
            {summary.suggestedMode
              ? DRIVING_MODE_LABELS[summary.suggestedMode as keyof typeof DRIVING_MODE_LABELS]
              : "None yet — complete a Full Assessment to compute signal-count suggestion."}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAgain}
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          Run again
        </button>
        <Link
          to="/dashboard"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Dashboard (Phase 4 stub)
        </Link>
        <Link
          to="/assessments"
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground"
        >
          All instruments
        </Link>
      </div>
    </div>
  );
}

function eyebrowTitle(id: InstrumentId): string {
  switch (id) {
    case "drain_check":
      return "DRAIN Check";
    case "battery_scan":
      return "Battery Scan";
    case "full_assessment":
      return "Full Assessment";
    case "weekly_mode_check":
      return "Weekly Mode Check";
  }
}

function ScanResults({
  result,
  summary,
  batteryById,
}: {
  result: Record<string, unknown>;
  summary: Record<string, unknown>;
  batteryById: Map<string, BatteryDefinition>;
}) {
  const scan = (result.scan ?? summary) as {
    ratings?: Record<string, string | null>;
    recommendedBatteryId?: string | null;
  };
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-foreground">
        Today&apos;s recommended battery:{" "}
        {scan.recommendedBatteryId
          ? (batteryById.get(scan.recommendedBatteryId)?.name ??
            scan.recommendedBatteryId)
          : "None (insufficient ratings)"}
      </p>
      <ul className="mt-4 space-y-2">
        {Object.entries(scan.ratings ?? {}).map(([id, level]) => (
          <li key={id} className="flex justify-between text-sm">
            <span>{batteryById.get(id)?.name ?? id}</span>
            <span className="capitalize text-muted-foreground">
              {level ?? "missing"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-fixture">
        Scan markers stale after 18h. Does not overwrite Full Assessment states.
      </p>
    </div>
  );
}

function FullResults({
  result,
  summary,
  batteryById,
  onDismissOvercharge,
}: {
  result: Record<string, unknown>;
  summary: Record<string, unknown>;
  batteryById: Map<string, BatteryDefinition>;
  onDismissOvercharge: () => Promise<void>;
}) {
  const scored = (result.scored ?? summary) as {
    batteryResults?: Array<{
      batteryId: string;
      batteryState: BatteryState | null;
      capacity: { status: string; score?: number; band?: string };
      strain: { status: string; score?: number; band?: string };
      recharge: { status: string; score?: number; band?: string };
    }>;
    dashboardComplete?: boolean;
    incompleteBatteryIds?: string[];
    overcharge?: {
      isFlagged: boolean;
      contributingBatteries: string[];
      message?: string | null;
    };
    suggestedMode?: string;
    signalCount?: number;
  };

  const overcharge =
    scored.overcharge ??
    (summary.overcharge as typeof scored.overcharge | undefined);
  const dismissed = Boolean(result.overchargeDismissed);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {scored.dashboardComplete
            ? "Full dashboard (≥5 batteries resolved)."
            : `Partial results — incomplete: ${(scored.incompleteBatteryIds ?? summary.incompleteBatteryIds as string[] | undefined ?? []).map((id) => batteryById.get(id)?.name ?? id).join(", ") || "none"}`}
        </p>
        <p className="mt-2 text-sm">
          Suggested Driving Mode (advisory):{" "}
          <strong>
            {scored.suggestedMode
              ? DRIVING_MODE_LABELS[
                  scored.suggestedMode as keyof typeof DRIVING_MODE_LABELS
                ]
              : String(summary.suggestedMode ?? "—")}
          </strong>{" "}
          · signal count {String(scored.signalCount ?? summary.signalCount ?? "—")}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {(scored.batteryResults ?? (summary.batteryResults as typeof scored.batteryResults) ?? []).map(
          (row) => (
            <li
              key={row.batteryId}
              className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-gray-800">
                  {batteryById.get(row.batteryId)?.name ?? row.batteryId}
                </p>
                <span className="text-xs text-muted-foreground">
                  {row.batteryState
                    ? BATTERY_STATE_LABELS[row.batteryState]
                    : "insufficient_data"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Cap{" "}
                {row.capacity.status === "ok"
                  ? `${row.capacity.score?.toFixed(2)} (${row.capacity.band})`
                  : "insufficient_data"}{" "}
                · Strain{" "}
                {row.strain.status === "ok"
                  ? `${row.strain.score?.toFixed(2)} (${row.strain.band})`
                  : "insufficient_data"}{" "}
                · Recharge{" "}
                {row.recharge.status === "ok"
                  ? `${row.recharge.score?.toFixed(2)} (${row.recharge.band})`
                  : "insufficient_data"}
              </p>
            </li>
          ),
        )}
      </ul>

      {overcharge?.isFlagged && !dismissed ? (
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm text-foreground">
            {overcharge.message ??
              "Your results may suggest that one area is being sustained by drawing heavily from other batteries."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Contributing:{" "}
            {overcharge.contributingBatteries
              .map((id) => batteryById.get(id)?.name ?? id)
              .join(", ")}
          </p>
          <button
            type="button"
            onClick={() => void onDismissOvercharge()}
            className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm"
          >
            Dismiss observation
          </button>
        </div>
      ) : null}
    </div>
  );
}
