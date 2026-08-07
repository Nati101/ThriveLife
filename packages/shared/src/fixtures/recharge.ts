import type { RechargeAction } from "../recharge";
import type { ScoringThreshold } from "../scoring";

/**
 * FIXTURE recharge library stubs — not Joel-authored.
 * Plan B is full success; never frame as lesser.
 */
export const FIXTURE_RECHARGE_ACTIONS: RechargeAction[] = [
  {
    id: "fixture_recharge_physical_2min",
    batteryId: "physical",
    signalId: null,
    durationTier: "2min",
    modeSuitability: ["green", "yellow", "red"],
    instructions:
      "[FIXTURE] Step away from the screen and take two slow breaths while standing or sitting comfortably.",
    planAText:
      "[FIXTURE] Plan A: Drink water, stretch your shoulders, and step outside for two minutes if you can.",
    planBText:
      "[FIXTURE] Plan B: Sit or stand still for four slow breaths. That counts as complete.",
    accessibilityVariations:
      "[FIXTURE] Seated option available; no equipment required.",
    healthCaution: null,
    chapterSource: null,
    isFixture: true,
  },
  {
    id: "fixture_recharge_daily_rhythms_5min",
    batteryId: "daily_rhythms",
    signalId: null,
    durationTier: "5min",
    modeSuitability: ["green", "yellow"],
    instructions:
      "[FIXTURE] Choose one transition cue for the next block of your day and write it down.",
    planAText:
      "[FIXTURE] Plan A: Set a five-minute start/stop boundary for your next task.",
    planBText:
      "[FIXTURE] Plan B: Name the next single step out loud. Done.",
    accessibilityVariations: null,
    healthCaution: null,
    chapterSource: null,
    isFixture: true,
  },
  {
    id: "fixture_recharge_mental_60s",
    batteryId: "mental",
    signalId: null,
    durationTier: "60s",
    modeSuitability: ["green", "yellow", "red"],
    instructions:
      "[FIXTURE] Close extra tabs or mute one notification channel for one minute.",
    planAText:
      "[FIXTURE] Plan A: Clear one small decision by writing the choice on paper.",
    planBText:
      "[FIXTURE] Plan B: Pause for 60 seconds without adding a new task.",
    accessibilityVariations: null,
    healthCaution: null,
    chapterSource: null,
    isFixture: true,
  },
];

/**
 * FIXTURE provisional thresholds from spec §4.3.
 * Must move to admin-editable ScoringThreshold rows before real scoring ships.
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
