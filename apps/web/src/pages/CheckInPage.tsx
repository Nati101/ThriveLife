import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CHECK_IN_COMPLETION_LABELS,
  DRIVING_MODES,
  RECHARGE_DURATION_TIERS,
  RESTART_RAIL_MESSAGE,
  type BatteryDefinition,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { fetchDashboard, fetchRestartRail, postRestartRail, saveCheckIn } from "@/lib/member-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChoiceChip } from "@/components/ui/choice";
import { Select, Textarea, labelClassName } from "@/components/ui/field";
import { buttonClassName } from "@/components/ui/button-styles";
import { useToast } from "@/components/Toast";
import { friendlyError } from "@/lib/friendly-error";

function durationLabel(tier: string) {
  switch (tier) {
    case "60s":
      return "60 seconds";
    case "2min":
      return "2 minutes";
    case "5min":
      return "5 minutes";
    case "10min":
      return "10 minutes";
    case "plan_b":
      return "Plan B";
    default:
      return tier;
  }
}

export function CheckInPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [recharge, setRecharge] = useState("");
  const [completion, setCompletion] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    successfulReturns: number;
    planBUsage: number;
    fourOfSeven: { completedCount: number; windowSize: number };
  } | null>(null);
  const [batteries, setBatteries] = useState<BatteryDefinition[]>([]);
  const ready = Boolean(mode && batteryId && recharge && completion);

  useEffect(() => {
    void fetchRestartRail()
      .then((row) => setMetrics(row.metrics))
      .catch(() => undefined);
    void fetchDashboard()
      .then((row) => {
        const list = row.batteries as BatteryDefinition[] | undefined;
        if (Array.isArray(list) && list.length > 0) setBatteries(list);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await saveCheckIn({
        mode,
        batteryId,
        rechargeSelected: recharge,
        completion,
        note: note.trim() || null,
      });
      const nextMessage =
        completion === "not_today"
          ? result.restartMessage
          : "Saved. That is enough for today.";
      setMessage(nextMessage);
      toast(nextMessage);
    } catch (err) {
      setError(friendlyError(err, "Could not save check-in"));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Daily loop"
        title="Daily Check-In"
        description="Under 30 seconds. Four questions plus an optional note. Notes stay text-only."
      />

      <form className="max-w-lg space-y-6" onSubmit={(e) => void onSubmit(e)}>
        <Card>
          <fieldset>
            <legend className={labelClassName}>1. What mode are you in today?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...DRIVING_MODES, "unsure"].map((value) => (
                <ChoiceChip
                  key={value}
                  type="radio"
                  name="mode"
                  value={value}
                  selected={mode === value}
                  onChange={() => setMode(value)}
                >
                  <span className="capitalize">{value}</span>
                </ChoiceChip>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card>
          <fieldset>
            <legend className={labelClassName}>
              2. Which battery needs the most support?
            </legend>
            {batteries.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading batteries…</p>
            ) : (
              <Select
                className="mt-2"
                value={batteryId}
                onChange={(e) => setBatteryId(e.target.value)}
                required
                aria-label="Which battery needs the most support?"
              >
                <option value="" disabled>
                  Choose a battery
                </option>
                {batteries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            )}
          </fieldset>
        </Card>

        <Card>
          <fieldset>
            <legend className={labelClassName}>
              3. What recharge version fits today?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...RECHARGE_DURATION_TIERS.filter((t) => t !== "60s"), "plan_b"].map(
                (tier) => (
                  <ChoiceChip
                    key={tier}
                    type="radio"
                    name="recharge"
                    value={tier}
                    selected={recharge === tier}
                    onChange={() => setRecharge(tier)}
                  >
                    {durationLabel(tier)}
                  </ChoiceChip>
                ),
              )}
            </div>
          </fieldset>
        </Card>

        <Card>
          <fieldset>
            <legend className={labelClassName}>4. Did you complete it?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(CHECK_IN_COMPLETION_LABELS).map(([value, label]) => (
                <ChoiceChip
                  key={value}
                  type="radio"
                  name="completion"
                  value={value}
                  selected={completion === value}
                  onChange={() => setCompletion(value)}
                >
                  {label}
                </ChoiceChip>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card>
          <label className="block">
            <span className={labelClassName}>
              Optional: What helped or drained you today?
            </span>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
          </label>
        </Card>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? (
          <p className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground">
            {message}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!ready}>
            Save check-in
          </Button>
          {message ? (
            <Link to="/dashboard" className={buttonClassName({ variant: "outline" })}>
              Back to dashboard
            </Link>
          ) : null}
        </div>
      </form>

      {completion === "not_today" || message === RESTART_RAIL_MESSAGE ? (
        <Card className="mt-6 max-w-lg">
          <h2 className="text-lg font-semibold text-gray-800">{RESTART_RAIL_MESSAGE}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void postRestartRail("do_2_minutes_now")}
            >
              Do 2 minutes now
            </Button>
            <Button variant="outline" onClick={() => void postRestartRail("use_plan_b")}>
              Use Plan B
            </Button>
            <Button
              variant="outline"
              onClick={() => void postRestartRail("schedule_next_return")}
            >
              Schedule my next return
            </Button>
          </div>
        </Card>
      ) : null}

      {metrics ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Returns {metrics.successfulReturns} · Plan B uses {metrics.planBUsage} ·{" "}
          {metrics.fourOfSeven.completedCount} of {metrics.fourOfSeven.windowSize} days
        </p>
      ) : null}
      <div className="mt-8">
        <SupportFooter />
      </div>
    </div>
  );
}
