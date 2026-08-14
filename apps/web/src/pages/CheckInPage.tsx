import {
  CHECK_IN_COMPLETION_LABELS,
  DRIVING_MODES,
  FIXTURE_BATTERIES,
  RECHARGE_DURATION_TIERS,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";

export function CheckInPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Daily loop"
        title="Daily Check-In"
        description="Target under 30 seconds. Four questions + optional note. Notes are text-only in V1 — no NLP."
      />

      <form className="max-w-lg space-y-6 rounded-xl border border-border bg-white p-5 shadow-sm">
        <fieldset>
          <legend className="text-sm font-semibold text-gray-800">
            1. What mode are you in today?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...DRIVING_MODES, "unsure"].map((mode) => (
              <label
                key={mode}
                className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm capitalize has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
              >
                <input
                  type="radio"
                  name="mode"
                  value={mode}
                  className="sr-only"
                  disabled
                />
                {mode}
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
            disabled
            defaultValue=""
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
            3. Recharge version
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
                    disabled
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
                  disabled
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-sm text-muted-foreground">
          Persistence and Restart Rail arrive in Phase 5. Controls are disabled
          until the data model is wired.
        </p>
      </form>
    </div>
  );
}
