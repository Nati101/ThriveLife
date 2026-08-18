import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
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
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { ErrorState, LoadingState } from "@/components/ui/states";
import {
  BatteryIcon,
  BatteryStateBadge,
  ScanMarkerBadge,
} from "@/components/BatteryVisual";

function bandLabel(status: string, band?: string): string {
  if (status !== "ok" || !band) return "Not enough answers";
  return band.replaceAll("_", " ");
}

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
  const lastItem = index >= items.length - 1 && items.length > 0;
  const progressPct = items.length ? ((index + 1) / items.length) * 100 : 0;

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
        <LoadingState label="Loading instrument…" />
      </div>
    );
  }

  if (error && !bootstrap) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        <ErrorState message={error} />
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
        <p className="mb-6 text-sm text-muted-foreground">
          {bootstrap.instrument.completionSecondsHint} · {items.length} questions
        </p>
      ) : null}

      {locked ? (
        <Card className="border-amber-200 bg-warn-soft text-fixture">
          <p className="font-semibold">Full Assessment not available yet</p>
          <p className="mt-2 text-sm">{bootstrap?.eligibility?.message}</p>
          <Link
            to="/check-in"
            className={`${buttonClassName({ size: "sm" })} mt-4`}
          >
            Go to daily check-in
          </Link>
        </Card>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      {!session && !locked ? (
        <Card className="max-w-xl space-y-4">
          {instrumentId === "full_assessment" ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Think about the <strong className="font-semibold text-gray-800">past two weeks</strong>.
              Use N/A when an item does not apply — it is stored as missing, never as
              a middle score.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving} onClick={() => void begin(false)}>
              {bootstrap?.inProgressSessionId ? "Resume session" : "Start"}
            </Button>
            {bootstrap?.inProgressSessionId ? (
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => void begin(true)}
              >
                Start fresh
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {session && currentItem ? (
        <div className="mt-2 max-w-2xl space-y-4">
          <ProgressBar
            value={progressPct}
            label={`Question ${index + 1} of ${items.length}`}
          />
          <Card className="p-6">
            {currentItem.batteryId ? (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <BatteryIcon
                  name={batteryById.get(currentItem.batteryId)?.icon}
                  className="h-4 w-4"
                />
                {batteryById.get(currentItem.batteryId)?.name ?? currentItem.batteryId}
              </p>
            ) : null}
            <p className="mt-3 text-lg leading-relaxed text-gray-800">
              {currentItem.wording}
            </p>

            {followUps[currentItem.id] ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Would you say it&apos;s closer to Low or Steady?
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["low", "steady"] as const).map((level) => (
                    <Button
                      key={level}
                      variant="outline"
                      disabled={saving}
                      onClick={() => void chooseFollowUp(currentItem, level)}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
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
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-2">
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
                        className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                          highlighted
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-white hover:bg-gray-100"
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
                    className="min-h-11 rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground"
                  >
                    Skip
                  </button>
                ) : null}
              </div>
            )}
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={index === 0 || saving}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
            <Button
              variant="outline"
              disabled={lastItem || saving}
              onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            >
              Next
            </Button>
            <Button
              disabled={saving}
              className="ml-auto"
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
            >
              Complete
            </Button>
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
        description="Scan markers and Full Assessment states stay separate. Nothing is averaged."
      />

      {instrumentId === "drain_check" ? (
        <Card>
          <CardTitle>Right-now drain</CardTitle>
          <p className="mt-3 text-3xl font-bold text-gray-800">
            {String(
              summary.totalScore ??
                (result.drain as { totalScore?: number } | undefined)?.totalScore ??
                "—",
            )}
          </p>
          <CardDescription>
            Intervention this session:{" "}
            {summary.interventionTriggered ||
            (result.drain as { interventionTriggered?: boolean })?.interventionTriggered
              ? "yes"
              : "no"}
            . DRAIN Check does not write battery states.
          </CardDescription>
        </Card>
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
        <Card>
          <CardTitle>This week’s mode</CardTitle>
          <p className="mt-3 text-2xl font-semibold capitalize text-gray-800">
            {String(
              summary.declaredMode ??
                (result.mode as { declaredMode?: string })?.declaredMode ??
                "—",
            )}
          </p>
          <CardDescription>
            Suggested (advisory):{" "}
            {summary.suggestedMode
              ? DRIVING_MODE_LABELS[
                  summary.suggestedMode as keyof typeof DRIVING_MODE_LABELS
                ]
              : "None yet — complete a Full Assessment to compute a suggestion."}
          </CardDescription>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link to="/dashboard" className={buttonClassName()}>
          Open dashboard
        </Link>
        <Button variant="outline" onClick={onAgain}>
          Run again
        </Button>
        <Link
          to="/assessments"
          className={buttonClassName({ variant: "ghost" })}
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
  const recommendedName = scan.recommendedBatteryId
    ? (batteryById.get(scan.recommendedBatteryId)?.name ?? scan.recommendedBatteryId)
    : null;
  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-primary">
        <CardTitle>Today’s recommended battery</CardTitle>
        <p className="mt-2 text-xl font-semibold text-gray-800">
          {recommendedName ?? "None — add a few ratings to get a match."}
        </p>
      </Card>
      <ul className="grid gap-3 sm:grid-cols-2">
        {Object.entries(scan.ratings ?? {}).map(([id, level]) => {
          const battery = batteryById.get(id);
          return (
            <li key={id}>
              <Card className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BatteryIcon name={battery?.icon} />
                  <p className="font-semibold text-gray-800">
                    {battery?.name ?? id}
                  </p>
                </div>
                <ScanMarkerBadge
                  value={
                    level === "low" || level === "steady" || level === "full"
                      ? level
                      : null
                  }
                />
              </Card>
            </li>
          );
        })}
      </ul>
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
  const incomplete =
    (scored.incompleteBatteryIds ??
      (summary.incompleteBatteryIds as string[] | undefined) ??
      []) as string[];

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>
          {scored.dashboardComplete
            ? "Seven-battery dashboard is ready"
            : "Partial results"}
        </CardTitle>
        <CardDescription>
          {scored.dashboardComplete
            ? "States come from Capacity, Strain, and Recharge Skill — never averaged."
            : `Still open: ${
                incomplete
                  .map((id) => batteryById.get(id)?.name ?? id)
                  .join(", ") || "none"
              }`}
        </CardDescription>
        <p className="mt-3 text-sm text-muted-foreground">
          Suggested driving mode (advisory):{" "}
          <strong className="font-semibold text-gray-800">
            {scored.suggestedMode
              ? DRIVING_MODE_LABELS[
                  scored.suggestedMode as keyof typeof DRIVING_MODE_LABELS
                ]
              : String(summary.suggestedMode ?? "—")}
          </strong>
        </p>
      </Card>

      <ul className="grid gap-3 sm:grid-cols-2">
        {(
          scored.batteryResults ??
          (summary.batteryResults as typeof scored.batteryResults) ??
          []
        ).map((row) => {
          const battery = batteryById.get(row.batteryId);
          return (
            <li key={row.batteryId}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <BatteryIcon name={battery?.icon} />
                    <p className="font-semibold text-gray-800">
                      {battery?.name ?? row.batteryId}
                    </p>
                  </div>
                  <BatteryStateBadge state={row.batteryState} />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <dt className="font-medium text-gray-700">Capacity</dt>
                    <dd className="capitalize">
                      {bandLabel(row.capacity.status, row.capacity.band)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Strain</dt>
                    <dd className="capitalize">
                      {bandLabel(row.strain.status, row.strain.band)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Recharge</dt>
                    <dd className="capitalize">
                      {bandLabel(row.recharge.status, row.recharge.band)}
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          );
        })}
      </ul>

      {overcharge?.isFlagged && !dismissed ? (
        <Card>
          <p className="text-sm leading-relaxed text-foreground">
            {overcharge.message ??
              "Your results may suggest that one area is being sustained by drawing heavily from other batteries."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Contributing:{" "}
            {overcharge.contributingBatteries
              .map((id) => batteryById.get(id)?.name ?? id)
              .join(", ")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void onDismissOvercharge()}
          >
            Dismiss observation
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
