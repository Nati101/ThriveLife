import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Target } from "lucide-react";
import { fetchDashboard } from "@/lib/member-api";
import { SupportFooter } from "@/components/SupportFooter";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button-styles";
import { ErrorState, LoadingState } from "@/components/ui/states";
import {
  BatteryIcon,
  BatteryStateBadge,
  ScanMarkerBadge,
} from "@/components/BatteryVisual";
import type { BatteryState } from "@thrivelife/shared";

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

function durationCopy(tier: string) {
  switch (tier) {
    case "60s":
      return "About 1 minute";
    case "2min":
      return "About 2 minutes";
    case "5min":
      return "About 5 minutes";
    case "10min":
      return "About 10 minutes";
    default:
      return tier;
  }
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
    return <ErrorState message={error} />;
  }
  if (!data) {
    return <LoadingState label="Loading dashboard…" />;
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
    icon?: string;
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
  const preferredIsB = elements.todayRecharge.preferredPlan === "plan_b";
  const modeValue = authority.declaredDrivingMode.value;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{getGreeting()}.</h1>
          <p className="mt-1 text-muted-foreground">
            Notice, match, respond — then leave the app and re-enter your day.
          </p>
        </div>
        <Link to="/check-in" className={buttonClassName()}>
          Log a check-in
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Five things that matter today
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Battery rings come from the Full Assessment. Today’s markers come from
          the Battery Scan. They are never averaged.
        </p>
      </div>

      {reminders?.due && reminders.due.length > 0 ? (
        <Card>
          <CardTitle className="text-lg">Full Assessment is still optional</CardTitle>
          <CardDescription>
            You skipped it during onboarding. About nine minutes fills in the
            seven-battery dashboard. Nothing is lost if today is not the day.
          </CardDescription>
          <Link
            to="/assessments/full-assessment"
            className={`${buttonClassName({ size: "sm" })} mt-4`}
          >
            Take Full Assessment
          </Link>
        </Card>
      ) : null}

      {authority.conflictNote ? (
        <Card>
          <p className="text-sm leading-relaxed text-foreground">
            {authority.conflictNote}
          </p>
        </Card>
      ) : null}

      {escalation.message ? (
        <Card>
          <CardTitle className="text-lg">Extra support, if you want it</CardTitle>
          <CardDescription>{escalation.message}</CardDescription>
          <Link to="/support" className={`${buttonClassName({ variant: "outline", size: "sm" })} mt-4`}>
            Find support
          </Link>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Most depleted
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-800">
            {elements.mostDepletedBatteryId
              ? names[elements.mostDepletedBatteryId]
              : "Take the Full Assessment to see this."}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Stabilizing start
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-800">
            {elements.mostStabilizingBatteryId
              ? names[elements.mostStabilizingBatteryId]
              : "Physical or Daily Rhythms when those read Low."}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Strongest support
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-800">
            {elements.strongestSupportBatteryId
              ? names[elements.strongestSupportBatteryId]
              : "Appears after a Full Assessment with stable capacity and recharge skill."}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Overcharge flag
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {authority.overchargeFlag.value?.isFlagged
              ? "Your results may suggest that one area is being sustained by drawing heavily from other batteries."
              : "No overcharge observation on the latest Full Assessment."}
          </p>
        </Card>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Today’s recharge — one action
        </CardTitle>
        {elements.todayRecharge.action ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              {durationCopy(elements.todayRecharge.action.durationTier)}
              {elements.todayRecharge.batteryId
                ? ` · ${names[elements.todayRecharge.batteryId] ?? ""}`
                : ""}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-lg border p-4 ${
                  preferredIsB
                    ? "border-border bg-gray-50"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Plan A{preferredIsB ? "" : " · suggested"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-800">
                  {elements.todayRecharge.action.planAText}
                </p>
              </div>
              <div
                className={`rounded-lg border p-4 ${
                  preferredIsB
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-gray-50"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Plan B{preferredIsB ? " · suggested" : ""} · counts as complete
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-800">
                  {elements.todayRecharge.action.planBText}
                </p>
              </div>
            </div>
            {elements.todayRecharge.action.healthCaution ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {elements.todayRecharge.action.healthCaution}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {elements.todayRecharge.prompt ??
              "Complete a Battery Scan to match a recharge."}
          </p>
        )}
        <div className="mt-4">
          <Link
            to="/assessments/battery-scan"
            className={buttonClassName({ variant: "outline" })}
          >
            Battery Scan
          </Link>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-gray-700">Life Batteries</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {batteries.map((battery) => {
            const ring = authority.batteryRings.find((r) => r.batteryId === battery.id);
            const marker = authority.scanMarkers.find((m) => m.batteryId === battery.id);
            return (
              <li key={battery.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <BatteryIcon name={battery.icon} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{battery.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {battery.thinkOfItAs}
                        </p>
                      </div>
                    </div>
                    <BatteryStateBadge state={ring?.value ?? null} />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    Today’s scan
                    <ScanMarkerBadge value={marker?.value ?? null} />
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        Driving mode this week:{" "}
        <span className="font-medium capitalize text-gray-800">
          {modeValue ?? "not declared"}
        </span>
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/progress"
          className={buttonClassName({ variant: "outline", size: "sm" })}
        >
          Two-chart progress
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/tune-up"
          className={buttonClassName({ variant: "outline", size: "sm" })}
        >
          One Battery Tune-Up
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <SupportFooter note={copy.safety?.body} />
    </div>
  );
}
