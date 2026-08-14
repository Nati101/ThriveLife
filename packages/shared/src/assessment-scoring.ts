/**
 * Full Assessment scoring (§4), overcharge (§5), suggested mode (§6.2).
 * Numeric bounds come from ScoringThreshold / OverchargeRuleConfig — never hard-code.
 */

import {
  BATTERY_IDS,
  type BatteryId,
  type BatteryState,
  type DimensionBand,
} from "./batteries";
import type { AssessmentItem, Construct } from "./instruments";
import type { ScoringThreshold } from "./scoring";
import type { DrivingMode } from "./driving-mode";

/** Dimension score when enough items answered; else insufficient_data. */
export type DimensionScoreResult =
  | { status: "ok"; score: number; band: DimensionBand }
  | { status: "insufficient_data" };

export type ScoredBatteryResult = {
  batteryId: BatteryId;
  capacity: DimensionScoreResult;
  strain: DimensionScoreResult;
  recharge: DimensionScoreResult;
  /** Null when any dimension is insufficient_data. */
  batteryState: BatteryState | null;
};

export type FullAssessmentScoreResult = {
  batteryResults: ScoredBatteryResult[];
  /** Batteries with a resolved state. */
  resolvedCount: number;
  /** True when ≥5 of 7 batteries have states (full dashboard). */
  dashboardComplete: boolean;
  incompleteBatteryIds: BatteryId[];
  overcharge: {
    isFlagged: boolean;
    contributingBatteries: BatteryId[];
    conditions: OverchargeConditionResult[];
  };
  suggestedMode: {
    mode: DrivingMode;
    signalCount: number;
    batteriesShowingSignal: BatteryId[];
  };
  /** Per-item N/A flags for pilot tracking. */
  naItemIds: string[];
};

export type OverchargeConditionResult = {
  id: 1 | 2 | 3 | 4;
  passed: boolean;
  detail: string;
};

/**
 * Structural + numeric overcharge rules. Numeric fields should be seeded from
 * admin thresholds / provisional spec values — scorer must not invent bounds.
 */
export type OverchargeRuleConfig = {
  workBatteryId: BatteryId;
  /** Condition 1: Work capacity ≥ this (typically Strong Capacity min). */
  workCapacityMin: number;
  depletedBatteryIds: BatteryId[];
  /** Condition 2: depleted capacity strictly below this (typically Capacity Low ceiling + epsilon). */
  depletedCapacityMaxExclusive: number;
  minDepletedCount: number;
  /** Condition 3: mean strain across all 7 ≥ this. */
  meanStrainMin: number;
  /** Condition 4: difficulty-stopping work strain item(s). */
  difficultyStoppingItemIds: string[];
  difficultyStoppingMinScore: number;
};

/** Signal-count → suggested mode boundaries (spec §6.2 — log for pilot). */
export type SuggestedModeRuleConfig = {
  /** Item score ≥ this counts toward "showing a signal". */
  strainItemSignalMin: number;
  /** Min strain items at signal strength (of 3) for a battery to "show a signal". */
  minStrainItemsForSignal: number;
  greenMaxSignals: number;
  yellowMaxSignals: number;
};

export const DEFAULT_OVERCHARGE_RULES: OverchargeRuleConfig = {
  workBatteryId: "work_daily_purpose",
  workCapacityMin: 3.0,
  depletedBatteryIds: [
    "physical",
    "relational",
    "spiritual",
    "daily_rhythms",
  ],
  depletedCapacityMaxExclusive: 2.0,
  minDepletedCount: 2,
  meanStrainMin: 2.0,
  difficultyStoppingItemIds: [
    "fixture_full_work_daily_purpose_strain_3",
  ],
  difficultyStoppingMinScore: 3,
};

export const DEFAULT_SUGGESTED_MODE_RULES: SuggestedModeRuleConfig = {
  strainItemSignalMin: 3,
  minStrainItemsForSignal: 2,
  greenMaxSignals: 1,
  yellowMaxSignals: 3,
};

export const FULL_ASSESSMENT_MIN_INTERVAL_DAYS = 14;
export const FULL_ASSESSMENT_DASHBOARD_MIN_BATTERIES = 5;
export const SCAN_STALE_AFTER_HOURS = 18;
export const MODE_STALE_AFTER_HOURS = 24 * 7;
export const FULL_ASSESSMENT_STALE_AFTER_DAYS = 90;

export const OVERCHARGE_APPROVED_MESSAGE =
  "Your results may suggest that one area is being sustained by drawing heavily from other batteries.";

export const OVERCHARGE_BANNED_WORDS = [
  "burnout",
  "at risk",
  "unhealthy",
  "warning",
  "workaholic",
] as const;

export const FULL_ASSESSMENT_LOCKOUT_COPY = (daysAgo: number) =>
  `Your last full assessment was ${daysAgo} days ago — it looks back over two weeks, so give it a little more time. Your daily check-ins are tracking in the meantime.`;

/** Build overcharge numeric bounds from ScoringThreshold rows where possible. */
export function overchargeRulesFromThresholds(
  thresholds: ScoringThreshold[],
  overrides: Partial<OverchargeRuleConfig> = {},
): OverchargeRuleConfig {
  const capacityStrong = thresholds.find(
    (t) =>
      t.dimension === "capacity" &&
      t.levelName.toLowerCase() === "strong" &&
      t.minValue != null,
  );
  const capacityLow = thresholds.find(
    (t) =>
      t.dimension === "capacity" &&
      t.levelName.toLowerCase() === "low" &&
      t.maxValue != null,
  );

  return {
    ...DEFAULT_OVERCHARGE_RULES,
    workCapacityMin:
      capacityStrong?.minValue ?? DEFAULT_OVERCHARGE_RULES.workCapacityMin,
    depletedCapacityMaxExclusive:
      capacityLow?.maxValue != null
        ? capacityLow.maxValue + 0.001
        : DEFAULT_OVERCHARGE_RULES.depletedCapacityMaxExclusive,
    ...overrides,
  };
}

function normalizeBandName(levelName: string): DimensionBand | null {
  const key = levelName.trim().toLowerCase();
  if (key === "low") return "low";
  if (key === "moderate") return "moderate";
  if (key === "strong") return "strong";
  if (key === "rising") return "rising";
  if (key === "elevated") return "elevated";
  return null;
}

/** Map a numeric dimension score to a band using admin thresholds. */
export function bandForDimensionScore(
  score: number,
  dimension: "capacity" | "strain" | "recharge",
  thresholds: ScoringThreshold[],
): DimensionBand | null {
  const rows = thresholds.filter((t) => t.dimension === dimension);
  for (const row of rows) {
    const minOk = row.minValue == null || score >= row.minValue;
    const maxOk = row.maxValue == null || score <= row.maxValue;
    if (minOk && maxOk) {
      return normalizeBandName(row.levelName);
    }
  }
  return null;
}

/**
 * Mean of answered numeric items. Requires minAnswered of non-null values.
 * N/A / skip / Unsure are null and never imputed as midpoint.
 */
export function meanDimensionScore(
  answers: Array<number | null | undefined>,
  minAnswered: number,
): number | "insufficient_data" {
  const values = answers.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  if (values.length < minAnswered) return "insufficient_data";
  const sum = values.reduce((acc, n) => acc + n, 0);
  return sum / values.length;
}

/**
 * Battery state matrix §4.4. Overcharge is NOT a state.
 * Recharge band only resolves the Moderate+Rising ambiguous middle.
 */
export function resolveBatteryState(
  capacity: DimensionBand,
  strain: DimensionBand,
  recharge: DimensionBand,
): BatteryState {
  if (capacity === "strong") {
    if (strain === "low") return "well_charged";
    return "strained_but_functioning";
  }

  if (capacity === "moderate") {
    if (strain === "low") return "steady";
    if (strain === "rising") {
      if (recharge === "low") return "strained_but_functioning";
      return "steady";
    }
    return "strained_but_functioning";
  }

  // capacity === "low"
  if (strain === "low") return "steady";
  return "low";
}

export type ItemAnswerMap = Record<string, number | null>;

function answersForItems(
  itemIds: string[],
  answers: ItemAnswerMap,
): Array<number | null> {
  return itemIds.map((id) => {
    if (!(id in answers)) return null;
    const value = answers[id];
    return typeof value === "number" ? value : null;
  });
}

function scoreDimension(
  itemIds: string[],
  answers: ItemAnswerMap,
  minAnswered: number,
  dimension: "capacity" | "strain" | "recharge",
  thresholds: ScoringThreshold[],
): DimensionScoreResult {
  const mean = meanDimensionScore(answersForItems(itemIds, answers), minAnswered);
  if (mean === "insufficient_data") {
    return { status: "insufficient_data" };
  }
  const band = bandForDimensionScore(mean, dimension, thresholds);
  if (!band) {
    return { status: "insufficient_data" };
  }
  return { status: "ok", score: mean, band };
}

export function itemsByBatteryDimension(
  items: AssessmentItem[],
  constructs: Construct[],
  batteryId: BatteryId,
  dimension: "capacity" | "strain" | "recharge",
): AssessmentItem[] {
  const constructIds = new Set(
    constructs
      .filter((c) => c.batteryId === batteryId && c.dimension === dimension)
      .map((c) => c.id),
  );
  return items.filter(
    (item) =>
      item.instrumentId === "full_assessment" &&
      item.active &&
      item.batteryId === batteryId &&
      constructIds.has(item.constructId),
  );
}

export function scoreFullAssessment(input: {
  items: AssessmentItem[];
  constructs: Construct[];
  thresholds: ScoringThreshold[];
  answers: ItemAnswerMap;
  overchargeRules?: OverchargeRuleConfig;
  suggestedModeRules?: SuggestedModeRuleConfig;
}): FullAssessmentScoreResult {
  const overchargeRules =
    input.overchargeRules ??
    overchargeRulesFromThresholds(input.thresholds);
  const modeRules = input.suggestedModeRules ?? DEFAULT_SUGGESTED_MODE_RULES;

  const naItemIds = input.items
    .filter((item) => item.instrumentId === "full_assessment" && item.active)
    .filter((item) => item.id in input.answers && input.answers[item.id] === null)
    .map((item) => item.id);

  const batteryResults: ScoredBatteryResult[] = BATTERY_IDS.map((batteryId) => {
    const capacityItems = itemsByBatteryDimension(
      input.items,
      input.constructs,
      batteryId,
      "capacity",
    );
    const strainItems = itemsByBatteryDimension(
      input.items,
      input.constructs,
      batteryId,
      "strain",
    );
    const rechargeItems = itemsByBatteryDimension(
      input.items,
      input.constructs,
      batteryId,
      "recharge",
    );

    const capacity = scoreDimension(
      capacityItems.map((i) => i.id),
      input.answers,
      2,
      "capacity",
      input.thresholds,
    );
    const strain = scoreDimension(
      strainItems.map((i) => i.id),
      input.answers,
      2,
      "strain",
      input.thresholds,
    );
    const recharge = scoreDimension(
      rechargeItems.map((i) => i.id),
      input.answers,
      Math.min(2, rechargeItems.length),
      "recharge",
      input.thresholds,
    );

    const batteryState =
      capacity.status === "ok" &&
      strain.status === "ok" &&
      recharge.status === "ok"
        ? resolveBatteryState(capacity.band, strain.band, recharge.band)
        : null;

    return {
      batteryId,
      capacity,
      strain,
      recharge,
      batteryState,
    };
  });

  const incompleteBatteryIds = batteryResults
    .filter((r) => r.batteryState == null)
    .map((r) => r.batteryId);
  const resolvedCount = batteryResults.length - incompleteBatteryIds.length;

  const overcharge = computeOverchargeFlag(
    batteryResults,
    input.answers,
    overchargeRules,
  );

  const suggestedMode = computeSuggestedMode(
    input.items,
    input.constructs,
    input.answers,
    modeRules,
  );

  return {
    batteryResults,
    resolvedCount,
    dashboardComplete: resolvedCount >= FULL_ASSESSMENT_DASHBOARD_MIN_BATTERIES,
    incompleteBatteryIds,
    overcharge,
    suggestedMode,
    naItemIds,
  };
}

export function computeOverchargeFlag(
  batteryResults: ScoredBatteryResult[],
  answers: ItemAnswerMap,
  rules: OverchargeRuleConfig,
): FullAssessmentScoreResult["overcharge"] {
  const byId = Object.fromEntries(
    batteryResults.map((r) => [r.batteryId, r]),
  ) as Record<BatteryId, ScoredBatteryResult>;

  const work = byId[rules.workBatteryId];
  const workCapacityOk =
    work?.capacity.status === "ok" &&
    work.capacity.score >= rules.workCapacityMin;

  const depleted = rules.depletedBatteryIds.filter((id) => {
    const row = byId[id];
    return (
      row?.capacity.status === "ok" &&
      row.capacity.score < rules.depletedCapacityMaxExclusive
    );
  });
  const depletedOk = depleted.length >= rules.minDepletedCount;

  const strainScores = batteryResults
    .map((r) => (r.strain.status === "ok" ? r.strain.score : null))
    .filter((n): n is number => n != null);
  const meanStrain =
    strainScores.length === BATTERY_IDS.length
      ? strainScores.reduce((a, b) => a + b, 0) / strainScores.length
      : null;
  const meanStrainOk =
    meanStrain != null && meanStrain >= rules.meanStrainMin;

  const difficultyStoppingOk = rules.difficultyStoppingItemIds.some((itemId) => {
    const value = answers[itemId];
    return typeof value === "number" && value >= rules.difficultyStoppingMinScore;
  });

  const conditions: OverchargeConditionResult[] = [
    {
      id: 1,
      passed: Boolean(workCapacityOk),
      detail: `Work capacity ≥ ${rules.workCapacityMin}`,
    },
    {
      id: 2,
      passed: depletedOk,
      detail: `≥${rules.minDepletedCount} depleted batteries among ${rules.depletedBatteryIds.join(", ")}`,
    },
    {
      id: 3,
      passed: Boolean(meanStrainOk),
      detail: `Mean strain ≥ ${rules.meanStrainMin}`,
    },
    {
      id: 4,
      passed: difficultyStoppingOk,
      detail: `Difficulty-stopping item ≥ ${rules.difficultyStoppingMinScore}`,
    },
  ];

  const isFlagged = conditions.every((c) => c.passed);
  const contributingBatteries = isFlagged
    ? Array.from(
        new Set<BatteryId>([rules.workBatteryId, ...depleted]),
      )
    : [];

  return { isFlagged, contributingBatteries, conditions };
}

export function computeSuggestedMode(
  items: AssessmentItem[],
  constructs: Construct[],
  answers: ItemAnswerMap,
  rules: SuggestedModeRuleConfig = DEFAULT_SUGGESTED_MODE_RULES,
): FullAssessmentScoreResult["suggestedMode"] {
  const batteriesShowingSignal: BatteryId[] = [];

  for (const batteryId of BATTERY_IDS) {
    const strainItems = itemsByBatteryDimension(
      items,
      constructs,
      batteryId,
      "strain",
    );
    const highCount = strainItems.filter((item) => {
      const value = answers[item.id];
      return typeof value === "number" && value >= rules.strainItemSignalMin;
    }).length;
    if (highCount >= rules.minStrainItemsForSignal) {
      batteriesShowingSignal.push(batteryId);
    }
  }

  const signalCount = batteriesShowingSignal.length;
  let mode: DrivingMode = "red";
  if (signalCount <= rules.greenMaxSignals) mode = "green";
  else if (signalCount <= rules.yellowMaxSignals) mode = "yellow";

  return { mode, signalCount, batteriesShowingSignal };
}

/** Days between two ISO timestamps (floor). */
export function daysBetween(earlierIso: string, laterIso: string): number {
  const a = Date.parse(earlierIso);
  const b = Date.parse(laterIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

export function isFullAssessmentLocked(
  lastCompletedAt: string | null,
  nowIso: string = new Date().toISOString(),
  minIntervalDays: number = FULL_ASSESSMENT_MIN_INTERVAL_DAYS,
): { locked: boolean; daysSince: number | null; message: string | null } {
  if (!lastCompletedAt) {
    return { locked: false, daysSince: null, message: null };
  }
  const daysSince = daysBetween(lastCompletedAt, nowIso);
  if (daysSince < minIntervalDays) {
    return {
      locked: true,
      daysSince,
      message: FULL_ASSESSMENT_LOCKOUT_COPY(daysSince),
    };
  }
  return { locked: false, daysSince, message: null };
}

/** DRAIN Check: Yes=2, Somewhat=1, No=0 — session intervention only. */
export function scoreDrainCheck(answers: ItemAnswerMap): {
  totalScore: number;
  answeredCount: number;
  /** Any elevated demand signal this session → priority-1 for recommendations. */
  interventionTriggered: boolean;
} {
  let totalScore = 0;
  let answeredCount = 0;
  for (const value of Object.values(answers)) {
    if (typeof value === "number") {
      totalScore += value;
      answeredCount += 1;
    }
  }
  return {
    totalScore,
    answeredCount,
    interventionTriggered: totalScore > 0,
  };
}

export type ScanLevel = "low" | "steady" | "full";

const SCAN_DEPLETION_RANK: Record<ScanLevel, number> = {
  low: 0,
  steady: 1,
  full: 2,
};

/** Pick today’s recommended battery from Scan ratings (most depleted answered). */
export function recommendBatteryFromScan(
  ratings: Partial<Record<BatteryId, ScanLevel | null>>,
): BatteryId | null {
  let best: BatteryId | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  for (const batteryId of BATTERY_IDS) {
    const level = ratings[batteryId];
    if (!level) continue;
    const rank = SCAN_DEPLETION_RANK[level];
    if (rank < bestRank) {
      bestRank = rank;
      best = batteryId;
    }
  }
  return best;
}

/** Guard: never compare numeric scores across different assessment item versions. */
export function canCompareNumericResults(
  versionA: number,
  versionB: number,
): boolean {
  return versionA === versionB;
}
