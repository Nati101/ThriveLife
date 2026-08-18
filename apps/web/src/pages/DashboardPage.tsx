import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BATTERY_STATE_LABELS,
  type BatteryState,
} from "@thrivelife/shared";
import { Target, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { fetchDashboard } from "@/lib/member-api";
import { SupportFooter } from "@/components/SupportFooter";

type Ring = {
  batteryId: string;
  status: string;
  value: BatteryState | null;
};

type Marker = {
  batteryId: string;
  status: string;
  value: "low" | "steady" | "full" | null;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDashboard()
      .then((row) => setData(row))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load dashboard"),
      );
  }, []);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  }

  const authority = data.authority as {
    batteryRings: Ring[];
    scanMarkers: Marker[];
    conflictNote: string | null;
    declaredDrivingMode: { status: string; value: string | null };
    overchargeFlag: {
      value: { isFlagged: boolean; contributingBatteries: string[] } | null;
    };
  };
  const batteries = data.batteries as Array<{
    id: string;
    name: string;
    thinkOfItAs: string;
  }>;
  const names = data.batteryNames as Record<string, string>;
  const elements = data.elements as {
    mostDepletedBatteryId: string | null;
    mostStabilizingBatteryId: string | null;
    strongestSupportBatteryId: string | null;
    todayRecharge: {
      action: {
        planAText: string;
        planBText: string;
        durationTier: string;
        healthCaution: string | null;
      } | null;
      preferredPlan: "plan_a" | "plan_b";
      prompt: string | null;
      source: string;
      batteryId: string | null;
    };
  };
  const escalation = data.escalation as { tier: 1 | 2 | null; message: string | null };
  const copy = data.copy as { safety?: { body: string } | null };
  const reminders = data.reminders as { due?: string[] } | undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{getGreeting()}.</h1>
        <p className="text-muted-foreground">
          Notice, match, respond — then leave the app and re-enter your day.
        </p>
      </div>

      <PageHeader
        eyebrow="Dashboard"
        title="Five things that matter today"
        description="Battery rings come from the Full Assessment. Today’s markers come from the Battery Scan. They are never averaged."
      />

      {reminders?.due && reminders.due.length > 0 ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-800">
            Full Assessment is still optional
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You skipped it during onboarding. About nine minutes fills in the
            seven-battery dashboard. Nothing is lost if today is not the day.
          </p>
          <Link
            to="/assessments/full-assessment"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Take Full Assessment
          </Link>
        </section>
      ) : null}

      {authority.conflictNote ? (
        <p className="rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground">
          {authority.conflictNote}
        </p>
      ) : null}

      {escalation.message ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-800">
            Extra support, if you want it
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {escalation.message}
          </p>
          <Link
            to="/support"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Find support
          </Link>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Most depleted
          </h2>
          <p className="mt-2 text-xl font-semibold text-gray-800">
            {elements.mostDepletedBatteryId
              ? names[elements.mostDepletedBatteryId]
              : "Take the Full Assessment to see this."}
          </p>
        </section>
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Stabilizing start
          </h2>
          <p className="mt-2 text-xl font-semibold text-gray-800">
            {elements.mostStabilizingBatteryId
              ? names[elements.mostStabilizingBatteryId]
              : "Physical or Daily Rhythms when those read Low."}
          </p>
        </section>
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Strongest support
          </h2>
          <p className="mt-2 text-xl font-semibold text-gray-800">
            {elements.strongestSupportBatteryId
              ? names[elements.strongestSupportBatteryId]
              : "Appears after a Full Assessment with stable capacity + recharge skill."}
          </p>
        </section>
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Overcharge flag
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {authority.overchargeFlag.value?.isFlagged
              ? "Your results may suggest that one area is being sustained by drawing heavily from other batteries."
              : "No overcharge observation on the latest Full Assessment."}
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-border border-l-4 border-l-primary bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
          <Target className="h-5 w-5 text-primary" />
          Today’s recharge — one action
        </h2>
        {elements.todayRecharge.action ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {elements.todayRecharge.preferredPlan === "plan_b"
                ? elements.todayRecharge.action.planBText
                : elements.todayRecharge.action.planAText}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Plan B (counts as complete success): {elements.todayRecharge.action.planBText}
            </p>
            {elements.todayRecharge.action.healthCaution ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {elements.todayRecharge.action.healthCaution}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Source: {elements.todayRecharge.source.replaceAll("_", " ")} · Mode ceiling
              applies. When you finish, leave the app.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {elements.todayRecharge.prompt ?? "Complete a Battery Scan to match a recharge."}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/check-in"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Log a check-in
          </Link>
          <Link
            to="/assessments/battery-scan"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
          >
            Battery Scan
          </Link>
        </div>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2">
        {batteries.map((battery) => {
          const ring = authority.batteryRings.find((r) => r.batteryId === battery.id);
          const marker = authority.scanMarkers.find((m) => m.batteryId === battery.id);
          return (
            <li
              key={battery.id}
              className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-gray-800">{battery.name}</p>
                <span className="text-xs text-muted-foreground">
                  {ring?.value ? BATTERY_STATE_LABELS[ring.value] : "No Full Assessment state"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{battery.thinkOfItAs}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Today’s scan marker:{" "}
                {marker?.value ? marker.value : "none (complete a Scan)"}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Driving mode: {authority.declaredDrivingMode.value ?? "not declared this week"} (
        {authority.declaredDrivingMode.status}).
      </p>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/progress"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 font-medium"
        >
          Two-chart progress
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/tune-up"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 font-medium"
        >
          One Battery Tune-Up
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <SupportFooter note={copy.safety?.body} />
    </div>
  );
}
