/** Recharge hierarchy and Plan A / Plan B (spec §2.6–2.7). */
export const RECHARGE_DURATION_TIERS = ["60s", "2min", "5min", "10min"] as const;

export type RechargeDurationTier = (typeof RECHARGE_DURATION_TIERS)[number];

export const RECHARGE_DURATION_MINUTES: Record<RechargeDurationTier, number> = {
  "60s": 1,
  "2min": 2,
  "5min": 5,
  "10min": 10,
};

export type PlanVariant = "plan_a" | "plan_b";

export type RechargeAction = {
  id: string;
  batteryId: string;
  signalId: string | null;
  durationTier: RechargeDurationTier;
  modeSuitability: Array<"green" | "yellow" | "red">;
  instructions: string;
  planAText: string;
  planBText: string;
  accessibilityVariations: string | null;
  healthCaution: string | null;
  chapterSource: string | null;
  workflowStatus?: import("./workflow").WorkflowStatus;
  isFixture: boolean;
};

export type RechargePlanStub = {
  id: string;
  batteryId: string;
  warningLight: string;
  planAActionId: string;
  planBActionId: string;
  cue: string;
  supportAction: string;
};

/**
 * Plan B is durability, not failure. UI must never treat it as lesser.
 */
export function planLabel(variant: PlanVariant): string {
  return variant === "plan_a" ? "Plan A" : "Plan B";
}
