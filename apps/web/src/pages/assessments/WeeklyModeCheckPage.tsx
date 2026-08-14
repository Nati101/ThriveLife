import {
  DRIVING_MODE_BEHAVIOR,
  FIXTURE_WEEKLY_MODE_ITEM,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";

export function WeeklyModeCheckPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Weekly Mode Check"
        title="Declare this week’s Driving Mode"
        description="User-declared mode is authoritative (stale after 7 days). Suggested mode is advisory only."
      />
      <section className="max-w-lg rounded-xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs text-fixture">Fixture item</p>
        <p className="mt-2 text-sm text-foreground">
          {FIXTURE_WEEKLY_MODE_ITEM.wording}
        </p>
        <div className="mt-4 space-y-3">
          {Object.values(DRIVING_MODE_BEHAVIOR).map((mode) => (
            <div
              key={mode.mode}
              className="rounded-lg border border-border px-3 py-2"
            >
              <p className="text-sm font-semibold capitalize text-gray-800">
                {mode.mode}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode.meaning} · ceiling {mode.durationCeilingMinutes} min
                {mode.planBDefault ? " · Plan B default" : ""}
              </p>
            </div>
          ))}
          <div className="rounded-lg border border-border px-3 py-2">
            <p className="text-sm font-semibold text-gray-800">Unsure</p>
            <p className="text-xs text-muted-foreground">
              Interaction with previous declared mode TBD (QUESTIONS.md #23).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
