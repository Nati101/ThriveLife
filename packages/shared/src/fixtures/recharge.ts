import { BATTERY_IDS, type BatteryId } from "../batteries";
import type { DrivingMode } from "../driving-mode";
import type { RechargeAction, RechargeDurationTier } from "../recharge";
import type { ScoringThreshold } from "../scoring";
import type { RecommendationLookup } from "../recommendations";
import { DRIVING_MODE_BEHAVIOR } from "../driving-mode";
import { RECHARGE_DURATION_MINUTES } from "../recharge";

const TIERS: RechargeDurationTier[] = ["60s", "2min", "5min", "10min"];
const MODES: DrivingMode[] = ["green", "yellow", "red"];

function planBFor(batteryId: BatteryId, tier: RechargeDurationTier): string {
  return `[FIXTURE] Plan B (${tier}, ${batteryId.replaceAll("_", " ")}): four slow breaths or one tiny next step. That counts as complete.`;
}

function planAFor(batteryId: BatteryId, tier: RechargeDurationTier): string {
  return `[FIXTURE] Plan A (${tier}, ${batteryId.replaceAll("_", " ")}): a concrete recharge matched to this battery. Leave the app when done.`;
}

export const FIXTURE_RECHARGE_ACTIONS: RechargeAction[] = BATTERY_IDS.flatMap(
  (batteryId) =>
    TIERS.map((tier) => ({
      id: `fixture_recharge_${batteryId}_${tier}`,
      batteryId,
      signalId: `fixture_signal_${batteryId}_body`,
      durationTier: tier,
      modeSuitability: MODES.filter((mode) => RECHARGE_DURATION_MINUTES[tier] <= DRIVING_MODE_BEHAVIOR[mode].durationCeilingMinutes),
      instructions: `[FIXTURE] ${tier} recharge for ${batteryId.replaceAll("_", " ")}.`,
      planAText: planAFor(batteryId, tier),
      planBText: planBFor(batteryId, tier),
      accessibilityVariations:
        "[FIXTURE] Seated option; no equipment required.",
      healthCaution:
        batteryId === "physical"
          ? "[FIXTURE] Skip movement if it would aggravate a current injury."
          : null,
      chapterSource: null,
      workflowStatus: "published",
      isFixture: true,
    })),
);

export const FIXTURE_RECOMMENDATION_LOOKUPS: RecommendationLookup[] = (() => {
  const rows: RecommendationLookup[] = [];
  let order = 0;
  for (const batteryId of BATTERY_IDS) {
    for (const mode of MODES) {
      const allowed = TIERS.filter(
        (tier) =>
          RECHARGE_DURATION_MINUTES[tier] <=
          DRIVING_MODE_BEHAVIOR[mode].durationCeilingMinutes,
      );
      const preferred = allowed[allowed.length - 1] ?? "60s";
      order += 10;
      rows.push({
        id: `fixture_lookup_${batteryId}_${mode}_${preferred}`,
        batteryId,
        signalId: `fixture_signal_${batteryId}_body`,
        mode,
        durationTier: preferred,
        timeOfDay: "any",
        rechargeActionId: `fixture_recharge_${batteryId}_${preferred}`,
        sortOrder: order,
        workflowStatus: "published",
        isFixture: true,
      });
    }
  }
  return rows;
})();

/**
 * FIXTURE provisional thresholds from spec §4.3.
 * Admin-editable ScoringThreshold rows — never hard-code in scorers.
 */
export const FIXTURE_SCORING_THRESHOLDS: ScoringThreshold[] = [
  {
    id: "fixture_capacity_low",
    dimension: "capacity",
    levelName: "Low",
    minValue: null,
    maxValue: 1.999,
    description: "Provisional: Capacity < 2.0",
    isProvisional: true,
  },
  {
    id: "fixture_capacity_moderate",
    dimension: "capacity",
    levelName: "Moderate",
    minValue: 2.0,
    maxValue: 2.99,
    description: "Provisional: Capacity 2.0–2.99",
    isProvisional: true,
  },
  {
    id: "fixture_capacity_strong",
    dimension: "capacity",
    levelName: "Strong",
    minValue: 3.0,
    maxValue: null,
    description: "Provisional: Capacity ≥ 3.0",
    isProvisional: true,
  },
  {
    id: "fixture_recharge_low",
    dimension: "recharge",
    levelName: "Low",
    minValue: null,
    maxValue: 1.499,
    description: "Provisional: Recharge Skill < 1.5",
    isProvisional: true,
  },
  {
    id: "fixture_recharge_moderate",
    dimension: "recharge",
    levelName: "Moderate",
    minValue: 1.5,
    maxValue: 2.49,
    description: "Provisional: Recharge Skill 1.5–2.49",
    isProvisional: true,
  },
  {
    id: "fixture_recharge_strong",
    dimension: "recharge",
    levelName: "Strong",
    minValue: 2.5,
    maxValue: null,
    description: "Provisional: Recharge Skill ≥ 2.5",
    isProvisional: true,
  },
  {
    id: "fixture_strain_low",
    dimension: "strain",
    levelName: "Low",
    minValue: null,
    maxValue: 1.499,
    description: "Provisional: Strain < 1.5",
    isProvisional: true,
  },
  {
    id: "fixture_strain_rising",
    dimension: "strain",
    levelName: "Rising",
    minValue: 1.5,
    maxValue: 2.49,
    description: "Provisional: Strain 1.5–2.49",
    isProvisional: true,
  },
  {
    id: "fixture_strain_elevated",
    dimension: "strain",
    levelName: "Elevated",
    minValue: 2.5,
    maxValue: null,
    description: "Provisional: Strain ≥ 2.5",
    isProvisional: true,
  },
];
