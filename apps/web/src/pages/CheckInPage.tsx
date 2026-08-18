import { useEffect, useState } from "react";
import {
  CHECK_IN_COMPLETION_LABELS,
  DRIVING_MODES,
  FIXTURE_BATTERIES,
  RECHARGE_DURATION_TIERS,
  RESTART_RAIL_MESSAGE,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { fetchRestartRail, postRestartRail, saveCheckIn } from "@/lib/member-api";

export function CheckInPage() {
  const [mode, setMode] = useState("");
  const [batteryId, setBatteryId] = useState("");
  const [recharge, setRecharge] = useState("");
  const [completion, setCompletion] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<string | null>(null);

  useEffect(() => {
    void fetchRestartRail()
      .then((row) => {
        setMetrics(
          `Returns: ${row.metrics.successfulReturns} · Plan B uses: ${row.metrics.planBUsage} · 4-of-7: ${row.metrics.fourOfSeven.completedCount}/${row.metrics.fourOfSeven.windowSize}`,
        );
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
      setMessage(
        completion === "not_today" ? result.restartMessage : "Saved. That is enough for today.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Daily loop"
        title="Daily Check-In"
        description="Under 30 seconds. Four questions + optional note. Notes stay text-only — no classification."
      />

      <form className="max-w-lg space-y-6 rounded-xl border border-border bg-white p-5 shadow-sm" onSubmit={(e) => void onSubmit(e)}>
        <fieldset>
          <legend className="text-sm font-semibold text-gray-800">
            1. What mode are you in today?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...DRIVING_MODES, "unsure"].map((value) => (
              <label
                key={value}
                className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm capitalize has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
              >
                <input
                  type="radio"
                  name="mode"
                  value={value}
                  className="sr-only"
                  checked={mode === value}
                  onChange={() => setMode(value)}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-gray-800">
            2. Which battery needs the most support?
          </legend>
          <select
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={batteryId}
            onChange={(e) => setBatteryId(e.target.value)}
            required
          >
            <option value="" disabled>
              Choose a battery
            </option>
            {FIXTURE_BATTERIES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-gray-800">
            3. What recharge version fits today?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...RECHARGE_DURATION_TIERS.filter((t) => t !== "60s"), "plan_b"].map(
              (tier) => (
                <label
                  key={tier}
                  className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                >
                  <input
                    type="radio"
                    name="recharge"
                    value={tier}
                    className="sr-only"
                    checked={recharge === tier}
                    onChange={() => setRecharge(tier)}
                  />
                  {tier === "plan_b" ? "Plan B" : tier}
                </label>
              ),
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-gray-800">
            4. Did you complete it?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(CHECK_IN_COMPLETION_LABELS).map(([value, label]) => (
              <label
                key={value}
                className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
              >
                <input
                  type="radio"
                  name="completion"
                  value={value}
                  className="sr-only"
                  checked={completion === value}
                  onChange={() => setCompletion(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="font-semibold text-gray-800">
            Optional: What helped or drained you today?
          </span>
          <textarea
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-foreground">{message}</p> : null}
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Save check-in
        </button>
      </form>

      {completion === "not_today" || message === RESTART_RAIL_MESSAGE ? (
        <section className="mt-6 max-w-lg rounded-xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-800">{RESTART_RAIL_MESSAGE}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm"
              onClick={() => void postRestartRail("do_2_minutes_now")}
            >
              Do 2 minutes now
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm"
              onClick={() => void postRestartRail("use_plan_b")}
            >
              Use Plan B
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-2 text-sm"
              onClick={() => void postRestartRail("schedule_next_return")}
            >
              Schedule my next return
            </button>
          </div>
        </section>
      ) : null}

      {metrics ? (
        <p className="mt-4 text-xs text-muted-foreground">{metrics}</p>
      ) : null}
      <div className="mt-8">
        <SupportFooter />
      </div>
    </div>
  );
}
