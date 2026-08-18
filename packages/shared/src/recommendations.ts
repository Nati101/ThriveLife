/**
 * Rule-based recommendation lookup (spec §8.1–8.2).
 * Table: battery × signal × mode × time → action. Not hardcoded conditionals.
 */

import type { BatteryId } from "./batteries";
import type { DrivingMode } from "./driving-mode";
import { DRIVING_MODE_BEHAVIOR } from "./driving-mode";
import type { RechargeAction, RechargeDurationTier } from "./recharge";
import { RECHARGE_DURATION_MINUTES } from "./recharge";
import type { WorkflowStatus } from "./workflow";
import { isPublishedForEngine } from "./workflow";

export type RecommendationTimeOfDay = "any" | "morning" | "afternoon" | "evening";

export type RecommendationLookup = {
  id: string;
  batteryId: BatteryId;
  signalId: string | null;
  mode: DrivingMode;
  durationTier: RechargeDurationTier;
  timeOfDay: RecommendationTimeOfDay;
  rechargeActionId: string;
  sortOrder: number;
  workflowStatus: WorkflowStatus;
  isFixture: boolean;
};

export type RecommendationSource =
  | "drain_check"
  | "battery_scan"
  | "full_assessment"
  | "prompt_scan";

export type RecommendationPriorityInput = {
  drainCompletedThisSession: boolean;
  scanSetAt: string | null;
  scanRecommendedBatteryId: BatteryId | null;
  fullAssessmentCompletedAt: string | null;
  fullMostDepletedBatteryId: BatteryId | null;
  nowIso?: string;
  scanStaleAfterHours?: number;
  fullStaleAfterDays?: number;
};

export type RecommendationPick = {
  source: RecommendationSource;
  batteryId: BatteryId | null;
  lookup: RecommendationLookup | null;
  action: RechargeAction | null;
  preferredPlan: "plan_a" | "plan_b";
  availableMinutes: number;
  prompt: string | null;
};

const SCAN_STALE_H = 18;
const FULL_STALE_D = 90;

function hoursBetween(earlier: string, later: string): number {
  return (Date.parse(later) - Date.parse(earlier)) / (60 * 60 * 1000);
}

function daysBetween(earlier: string, later: string): number {
  return hoursBetween(earlier, later) / 24;
}

export function durationWithinModeCeiling(
  tier: RechargeDurationTier,
  mode: DrivingMode,
): boolean {
  return RECHARGE_DURATION_MINUTES[tier] <= DRIVING_MODE_BEHAVIOR[mode].durationCeilingMinutes;
}

export function resolveRecommendationSource(
  input: RecommendationPriorityInput,
): { source: RecommendationSource; batteryId: BatteryId | null; prompt: string | null } {
  const now = input.nowIso ?? new Date().toISOString();
  if (input.drainCompletedThisSession) {
    return {
      source: "drain_check",
      batteryId: input.scanRecommendedBatteryId ?? input.fullMostDepletedBatteryId,
      prompt: null,
    };
  }
  const scanFresh =
    input.scanSetAt != null &&
    hoursBetween(input.scanSetAt, now) <= (input.scanStaleAfterHours ?? SCAN_STALE_H);
  if (scanFresh && input.scanRecommendedBatteryId) {
    return {
      source: "battery_scan",
      batteryId: input.scanRecommendedBatteryId,
      prompt: null,
    };
  }
  const faFresh =
    input.fullAssessmentCompletedAt != null &&
    daysBetween(input.fullAssessmentCompletedAt, now) <=
      (input.fullStaleAfterDays ?? FULL_STALE_D);
  if (faFresh && input.fullMostDepletedBatteryId) {
    return {
      source: "full_assessment",
      batteryId: input.fullMostDepletedBatteryId,
      prompt: null,
    };
  }
  return {
    source: "prompt_scan",
    batteryId: null,
    prompt: "Complete today’s Battery Scan to match a recharge.",
  };
}

export function lookupRecommendation(input: {
  lookups: RecommendationLookup[];
  actions: RechargeAction[];
  batteryId: BatteryId;
  mode: DrivingMode;
  signalId?: string | null;
  timeOfDay?: RecommendationTimeOfDay;
}): { lookup: RecommendationLookup; action: RechargeAction } | null {
  const timeOfDay = input.timeOfDay ?? "any";
  const rows = input.lookups
    .filter(
      (row) =>
        isPublishedForEngine(row.workflowStatus) &&
        row.batteryId === input.batteryId &&
        row.mode === input.mode &&
        durationWithinModeCeiling(row.durationTier, input.mode),
    )
    .sort((a, b) => {
      const signalScore = (row: RecommendationLookup) => {
        if (input.signalId && row.signalId === input.signalId) return 0;
        if (row.signalId == null) return 1;
        return 2;
      };
      const timeScore = (row: RecommendationLookup) => {
        if (row.timeOfDay === timeOfDay) return 0;
        if (row.timeOfDay === "any") return 1;
        return 2;
      };
      const bySignal = signalScore(a) - signalScore(b);
      if (bySignal !== 0) return bySignal;
      const byTime = timeScore(a) - timeScore(b);
      if (byTime !== 0) return byTime;
      return a.sortOrder - b.sortOrder;
    });

  for (const lookup of rows) {
    const action = input.actions.find((a) => a.id === lookup.rechargeActionId);
    if (action) return { lookup, action };
  }
  return null;
}

export function pickTodayRecharge(input: {
  lookups: RecommendationLookup[];
  actions: RechargeAction[];
  mode: DrivingMode;
  priority: RecommendationPriorityInput;
  signalId?: string | null;
  timeOfDay?: RecommendationTimeOfDay;
}): RecommendationPick {
  const resolved = resolveRecommendationSource(input.priority);
  const availableMinutes = DRIVING_MODE_BEHAVIOR[input.mode].durationCeilingMinutes;
  const preferredPlan: "plan_a" | "plan_b" = DRIVING_MODE_BEHAVIOR[input.mode].planBDefault
    ? "plan_b"
    : "plan_a";

  if (!resolved.batteryId) {
    return {
      source: resolved.source,
      batteryId: null,
      lookup: null,
      action: null,
      preferredPlan,
      availableMinutes,
      prompt: resolved.prompt,
    };
  }

  const match = lookupRecommendation({
    lookups: input.lookups,
    actions: input.actions,
    batteryId: resolved.batteryId,
    mode: input.mode,
    signalId: input.signalId,
    timeOfDay: input.timeOfDay,
  });

  return {
    source: resolved.source,
    batteryId: resolved.batteryId,
    lookup: match?.lookup ?? null,
    action: match?.action ?? null,
    preferredPlan,
    availableMinutes,
    prompt: match ? null : "No published lookup row matches this battery and mode yet.",
  };
}

export function rechargeMenuForMode(
  actions: RechargeAction[],
  mode: DrivingMode,
  batteryId?: BatteryId,
): RechargeAction[] {
  return actions.filter((action) => {
    if (batteryId && action.batteryId !== batteryId) return false;
    if (!action.modeSuitability.includes(mode)) return false;
    return durationWithinModeCeiling(action.durationTier, mode);
  });
}
