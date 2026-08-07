import { Link } from "react-router-dom";
import {
  BATTERY_STATE_LABELS,
  FIXTURE_BATTERIES,
  FIXTURE_RECHARGE_ACTIONS,
  type BatteryState,
} from "@thrivelife/shared";
import { PageHeader, PlaceholderPanel } from "@/components/PageHeader";

const FIXTURE_STATES: Partial<Record<string, BatteryState>> = {
  physical: "low",
  daily_rhythms: "strained_but_functioning",
  mental: "steady",
  emotional: "steady",
  relational: "well_charged",
  spiritual: "steady",
  work_daily_purpose: "strained_but_functioning",
};

export function DashboardPage() {
  const focus = FIXTURE_RECHARGE_ACTIONS[0];

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="Seven-battery overview"
        description="Five elements from spec §8 will live here. Rings use Full Assessment authority; Scan markers stay separate — never merged."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <PlaceholderPanel title="Most depleted (fixture)">
          Physical — lowest capacity reading in this placeholder snapshot.
        </PlaceholderPanel>
        <PlaceholderPanel title="Today’s recharge (fixture)">
          <p className="mb-2">{focus.planAText}</p>
          <p>{focus.planBText}</p>
          <p className="mt-2 text-xs text-fixture">
            Plan B counts as full success.
          </p>
        </PlaceholderPanel>
      </div>

      <ul className="mb-8 grid gap-3 sm:grid-cols-2">
        {FIXTURE_BATTERIES.map((battery) => {
          const state = FIXTURE_STATES[battery.id];
          return (
            <li
              key={battery.id}
              className="rounded-xl border border-border bg-card/80 px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium text-foreground">{battery.name}</p>
                <span className="text-xs text-muted">
                  {state ? BATTERY_STATE_LABELS[state] : "Missing"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{battery.covers}</p>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/check-in"
          className="text-brand underline-offset-2 hover:underline"
        >
          Daily Check-In
        </Link>
        <Link
          to="/assessments"
          className="text-brand underline-offset-2 hover:underline"
        >
          Assessments
        </Link>
      </div>
    </div>
  );
}
