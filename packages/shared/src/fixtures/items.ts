import { BATTERY_IDS } from "../batteries";
import type { AssessmentItem, Construct } from "../instruments";

/**
 * FIXTURE content — clearly labeled placeholders.
 * Do not treat wording as clinical claims or ship as Joel-authored copy.
 */

export const FIXTURE_CONSTRUCTS: Construct[] = [
  {
    id: "construct_driving_mode",
    batteryId: "work_daily_purpose",
    dimension: "mode",
    subconstruct: null,
    definition:
      "[FIXTURE] User-declared Driving Mode construct for Weekly Mode Check.",
    bookChapterRef: null,
    workflowStatus: "published",
    isFixture: true,
  },
  ...BATTERY_IDS.flatMap((batteryId) => [
    {
      id: `construct_${batteryId}_capacity`,
      batteryId,
      dimension: "capacity" as const,
      subconstruct: null,
      definition: `[FIXTURE] Capacity construct for ${batteryId}`,
      bookChapterRef: null,
      workflowStatus: "published" as const,
      isFixture: true,
    },
    {
      id: `construct_${batteryId}_strain`,
      batteryId,
      dimension: "strain" as const,
      subconstruct: null,
      definition: `[FIXTURE] Strain construct for ${batteryId} — DRAIN Check uses the moment variant of this construct.`,
      bookChapterRef: null,
      workflowStatus: "published" as const,
      isFixture: true,
    },
    {
      id: `construct_${batteryId}_recharge`,
      batteryId,
      dimension: "recharge" as const,
      subconstruct: null,
      definition: `[FIXTURE] Recharge Skill construct for ${batteryId}`,
      bookChapterRef: null,
      workflowStatus: "published" as const,
      isFixture: true,
    },
  ]),
];

/**
 * DRAIN items are Strain constructs at timeframe=moment (spec §3.3).
 * Same construct_id as Full Assessment Strain items; wording differs by instrument.
 */
const DRAIN_STRAIN_VARIANTS: Array<{
  wording: string;
  batteryId: (typeof BATTERY_IDS)[number];
}> = [
  {
    wording: "Demands feel higher than what I can currently hold",
    batteryId: "work_daily_purpose",
  },
  {
    wording: "I am putting off things that usually feel manageable",
    batteryId: "daily_rhythms",
  },
  {
    wording: "I am reaching for quick relief that does not restore capacity",
    batteryId: "physical",
  },
  {
    wording: "My transitions between tasks feel jagged or rushed",
    batteryId: "daily_rhythms",
  },
  {
    wording: "Rest is hard to start or hard to leave",
    batteryId: "physical",
  },
  {
    wording: "I feel pulled in more directions than I can track",
    batteryId: "mental",
  },
  {
    wording: "Small decisions feel heavier than they should",
    batteryId: "mental",
  },
  {
    wording: "I notice irritation rising faster than usual",
    batteryId: "emotional",
  },
  {
    wording: "Connection feels effortful or thin right now",
    batteryId: "relational",
  },
  {
    wording: "My inner compass feels hard to hear in this moment",
    batteryId: "spiritual",
  },
];

export const FIXTURE_DRAIN_ITEMS: AssessmentItem[] = DRAIN_STRAIN_VARIANTS.map(
  (row, index) => ({
    id: `fixture_drain_${index + 1}`,
    constructId: `construct_${row.batteryId}_strain`,
    instrumentId: "drain_check",
    batteryId: row.batteryId,
    timeframe: "moment",
    wording: `[FIXTURE] ${row.wording}`,
    responseScaleId: "scale_drain_yes_somewhat_no",
    scoringDirection: "higher_is_more_strain",
    version: 1,
    active: true,
    workflowStatus: "published",
    isFixture: true,
  }),
);

export const FIXTURE_SCAN_ITEMS: AssessmentItem[] = BATTERY_IDS.map(
  (batteryId) => ({
    id: `fixture_scan_${batteryId}`,
    constructId: `construct_${batteryId}_capacity`,
    instrumentId: "battery_scan",
    batteryId,
    timeframe: "moment",
    wording: `[FIXTURE] Right now, how would you rate your ${batteryId.replaceAll("_", " ")} battery?`,
    responseScaleId: "scale_scan_level",
    scoringDirection: null,
    version: 1,
    active: true,
    isFixture: true,
  }),
);

/** 8 items × 7 batteries = 56; Cap×3, Strain×3, Recharge×2 (spec §3.1). */
export const FIXTURE_FULL_ASSESSMENT_ITEMS: AssessmentItem[] = BATTERY_IDS.flatMap(
  (batteryId) => {
    const capacity = [1, 2, 3].map((n) => ({
      id: `fixture_full_${batteryId}_capacity_${n}`,
      constructId: `construct_${batteryId}_capacity`,
      instrumentId: "full_assessment" as const,
      batteryId,
      timeframe: "two_week" as const,
      wording: `[FIXTURE] Over the past two weeks, ${batteryId.replaceAll("_", " ")} capacity item ${n}`,
      responseScaleId: "scale_frequency_0_4",
      scoringDirection: "higher_is_more_capacity" as const,
      version: 1,
      active: true,
      isFixture: true,
    }));
    const strain = [1, 2, 3].map((n) => {
      const isDifficultyStopping =
        batteryId === "work_daily_purpose" && n === 3;
      return {
        id: `fixture_full_${batteryId}_strain_${n}`,
        constructId: `construct_${batteryId}_strain`,
        instrumentId: "full_assessment" as const,
        batteryId,
        timeframe: "two_week" as const,
        wording: isDifficultyStopping
          ? "[FIXTURE] Over the past two weeks, I have had difficulty stopping work even when depleted"
          : `[FIXTURE] Over the past two weeks, ${batteryId.replaceAll("_", " ")} strain item ${n}`,
        responseScaleId: "scale_frequency_0_4",
        scoringDirection: "higher_is_more_strain" as const,
        version: 1,
        active: true,
        isFixture: true,
      };
    });
    const recharge = [1, 2].map((n) => ({
      id: `fixture_full_${batteryId}_recharge_${n}`,
      constructId: `construct_${batteryId}_recharge`,
      instrumentId: "full_assessment" as const,
      batteryId,
      timeframe: "two_week" as const,
      wording: `[FIXTURE] Over the past two weeks, ${batteryId.replaceAll("_", " ")} recharge skill item ${n}`,
      responseScaleId: "scale_frequency_0_4",
      scoringDirection: "higher_is_more_skill" as const,
      version: 1,
      active: true,
      isFixture: true,
    }));
    return [...capacity, ...strain, ...recharge];
  },
);

export const FIXTURE_WEEKLY_MODE_ITEM: AssessmentItem = {
  id: "fixture_weekly_mode_1",
  constructId: "construct_driving_mode",
  instrumentId: "weekly_mode_check",
  batteryId: null,
  timeframe: "moment",
  wording: "[FIXTURE] What Driving Mode best describes your week right now?",
  responseScaleId: "scale_driving_mode",
  scoringDirection: null,
  version: 1,
  active: true,
  isFixture: true,
};

export const FIXTURE_ALL_ITEMS: AssessmentItem[] = [
  ...FIXTURE_DRAIN_ITEMS,
  ...FIXTURE_SCAN_ITEMS,
  ...FIXTURE_FULL_ASSESSMENT_ITEMS,
  FIXTURE_WEEKLY_MODE_ITEM,
];
