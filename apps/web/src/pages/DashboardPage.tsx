import { Link } from "react-router-dom";
import {
  BATTERY_STATE_LABELS,
  FIXTURE_BATTERIES,
  FIXTURE_RECHARGE_ACTIONS,
  type BatteryState,
} from "@thrivelife/shared";
import { Target, ArrowRight } from "lucide-react";
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function DashboardPage() {
  const focus = FIXTURE_RECHARGE_ACTIONS[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {getGreeting()}!
        </h1>
        <p className="text-muted-foreground">
          Here’s your wellness summary for today.
        </p>
      </div>

      <PageHeader
        eyebrow="Dashboard"
        title="Seven-battery overview"
        description="Five elements from spec §8 will live here. Rings use Full Assessment authority; Scan markers stay separate — never merged."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PlaceholderPanel title="Most depleted (fixture)">
          Physical — lowest capacity reading in this placeholder snapshot.
        </PlaceholderPanel>
        <section className="rounded-xl border border-border border-l-4 border-l-primary bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Target className="h-5 w-5 text-primary" />
            Today’s recharge (fixture)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {focus.planAText}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{focus.planBText}</p>
          <p className="mt-2 text-xs text-fixture">
            Plan B counts as full success.
          </p>
        </section>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {FIXTURE_BATTERIES.map((battery) => {
          const state = FIXTURE_STATES[battery.id];
          return (
            <li
              key={battery.id}
              className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-gray-800">{battery.name}</p>
                <span className="text-xs text-muted-foreground">
                  {state ? BATTERY_STATE_LABELS[state] : "Missing"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {battery.covers}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/check-in"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 font-medium text-foreground transition hover:bg-gray-100"
        >
          Daily Check-In
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/assessments"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 font-medium text-foreground transition hover:bg-gray-100"
        >
          Assessments
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
