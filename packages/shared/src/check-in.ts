/**
 * Daily Check-In + Restart Rail (spec §7.2, §7.5).
 * Never tracks streak loss, failed-day counts, or social rankings.
 */

import type { BatteryId } from "./batteries";
import type { DrivingModeOrUnsure } from "./driving-mode";
import type { CheckInCompletion } from "./scoring";

export const RESTART_RAIL_MESSAGE = "Nothing is lost. Practice the return.";

export const RESTART_RAIL_ACTIONS = [
  "do_2_minutes_now",
  "use_plan_b",
  "schedule_next_return",
] as const;

export type RestartRailAction = (typeof RESTART_RAIL_ACTIONS)[number];

export type DailyCheckInRow = {
  id: string;
  userId: string;
  mode: DrivingModeOrUnsure;
  batteryId: BatteryId;
  rechargeSelected: string | null;
  completion: CheckInCompletion;
  note: string | null;
  date: string;
  timezone: string;
};

export type RestartRailEvent = {
  id: string;
  userId: string;
  missedAt: string;
  returnedAt: string | null;
  action: RestartRailAction | null;
  usedPlanB: boolean;
};

export function localDateKey(iso: string, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(iso));
}

export function minutesToReturn(missedAt: string, returnedAt: string): number {
  return Math.max(0, Math.round((Date.parse(returnedAt) - Date.parse(missedAt)) / 60000));
}

export function fourOfSevenConsistency(
  completions: CheckInCompletion[],
): { completedCount: number; windowSize: number; consistent: boolean } {
  const window = completions.slice(-7);
  const completedCount = window.filter((c) => c === "yes" || c === "partly" || c === "changed").length;
  return {
    completedCount,
    windowSize: window.length,
    consistent: completedCount >= 4,
  };
}

export type RestartRailMetrics = {
  successfulReturns: number;
  planBUsage: number;
  averageMinutesToReturn: number | null;
  fourOfSeven: ReturnType<typeof fourOfSevenConsistency>;
};

export function summarizeRestartRail(
  events: RestartRailEvent[],
  recentCompletions: CheckInCompletion[],
): RestartRailMetrics {
  const returned = events.filter((e) => e.returnedAt);
  const minutes = returned.map((e) => minutesToReturn(e.missedAt, e.returnedAt!));
  return {
    successfulReturns: returned.length,
    planBUsage: events.filter((e) => e.usedPlanB).length,
    averageMinutesToReturn:
      minutes.length === 0
        ? null
        : Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length),
    fourOfSeven: fourOfSevenConsistency(recentCompletions),
  };
}

export const TUNE_UP_SUPPORT_ACTIONS = [
  "prepare_environment",
  "tell_trusted_person",
  "visible_cue",
  "reduce_friction",
  "schedule_rest",
  "move_phone",
  "prepare_food_water",
  "block_time",
] as const;

export type TuneUpSupportAction = (typeof TUNE_UP_SUPPORT_ACTIONS)[number];

export const TUNE_UP_REVIEW_CHOICES = [
  "continue",
  "deepen",
  "simplify",
  "switch",
  "maintenance",
] as const;

export type TuneUpReviewChoice = (typeof TUNE_UP_REVIEW_CHOICES)[number];
