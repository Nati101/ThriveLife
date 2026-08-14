/**
 * Table-driven assessment scoring tests (spec §§4–6).
 * Run: npm run test -w @thrivelife/shared
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BATTERY_IDS,
  FIXTURE_ALL_ITEMS,
  FIXTURE_CONSTRUCTS,
  FIXTURE_SCORING_THRESHOLDS,
  assertInstrumentWriteAllowed,
  bandForDimensionScore,
  canCompareNumericResults,
  computeSuggestedMode,
  isFullAssessmentLocked,
  meanDimensionScore,
  overchargeRulesFromThresholds,
  recommendBatteryFromScan,
  resolveBatteryState,
  scoreDrainCheck,
  scoreFullAssessment,
  type DimensionBand,
  type ItemAnswerMap,
} from "./index";

describe("meanDimensionScore / missing data", () => {
  it("requires 2 of 3 (or configured minimum)", () => {
    assert.equal(meanDimensionScore([2, null, null], 2), "insufficient_data");
    assert.equal(meanDimensionScore([2, 4, null], 2), 3);
    assert.equal(meanDimensionScore([null, null], 2), "insufficient_data");
    assert.equal(meanDimensionScore([1, 3], 2), 2);
  });

  it("never imputes null as midpoint", () => {
    assert.equal(meanDimensionScore([4, null, null], 2), "insufficient_data");
  });
});

describe("bandForDimensionScore reads thresholds", () => {
  it("classifies capacity from config rows", () => {
    assert.equal(
      bandForDimensionScore(1.5, "capacity", FIXTURE_SCORING_THRESHOLDS),
      "low",
    );
    assert.equal(
      bandForDimensionScore(2.5, "capacity", FIXTURE_SCORING_THRESHOLDS),
      "moderate",
    );
    assert.equal(
      bandForDimensionScore(3.2, "capacity", FIXTURE_SCORING_THRESHOLDS),
      "strong",
    );
  });

  it("classifies strain rising/elevated from config", () => {
    assert.equal(
      bandForDimensionScore(1.0, "strain", FIXTURE_SCORING_THRESHOLDS),
      "low",
    );
    assert.equal(
      bandForDimensionScore(2.0, "strain", FIXTURE_SCORING_THRESHOLDS),
      "rising",
    );
    assert.equal(
      bandForDimensionScore(3.0, "strain", FIXTURE_SCORING_THRESHOLDS),
      "elevated",
    );
  });
});

describe("battery state matrix §4.4", () => {
  const cases: Array<{
    capacity: DimensionBand;
    strain: DimensionBand;
    recharge: DimensionBand;
    expected: ReturnType<typeof resolveBatteryState>;
  }> = [
    { capacity: "strong", strain: "low", recharge: "low", expected: "well_charged" },
    { capacity: "strong", strain: "low", recharge: "strong", expected: "well_charged" },
    {
      capacity: "strong",
      strain: "rising",
      recharge: "strong",
      expected: "strained_but_functioning",
    },
    {
      capacity: "strong",
      strain: "elevated",
      recharge: "low",
      expected: "strained_but_functioning",
    },
    { capacity: "moderate", strain: "low", recharge: "low", expected: "steady" },
    { capacity: "moderate", strain: "rising", recharge: "moderate", expected: "steady" },
    { capacity: "moderate", strain: "rising", recharge: "strong", expected: "steady" },
    {
      capacity: "moderate",
      strain: "rising",
      recharge: "low",
      expected: "strained_but_functioning",
    },
    {
      capacity: "moderate",
      strain: "elevated",
      recharge: "strong",
      expected: "strained_but_functioning",
    },
    { capacity: "low", strain: "low", recharge: "strong", expected: "steady" },
    { capacity: "low", strain: "rising", recharge: "strong", expected: "low" },
    { capacity: "low", strain: "elevated", recharge: "low", expected: "low" },
  ];

  for (const row of cases) {
    it(`${row.capacity}/${row.strain}/${row.recharge} → ${row.expected}`, () => {
      assert.equal(
        resolveBatteryState(row.capacity, row.strain, row.recharge),
        row.expected,
      );
    });
  }
});

function fillFullAnswers(
  builder: (batteryId: string, dimension: string, n: number) => number | null,
): ItemAnswerMap {
  const answers: ItemAnswerMap = {};
  for (const batteryId of BATTERY_IDS) {
    for (const n of [1, 2, 3]) {
      answers[`fixture_full_${batteryId}_capacity_${n}`] = builder(
        batteryId,
        "capacity",
        n,
      );
      answers[`fixture_full_${batteryId}_strain_${n}`] = builder(
        batteryId,
        "strain",
        n,
      );
    }
    for (const n of [1, 2]) {
      answers[`fixture_full_${batteryId}_recharge_${n}`] = builder(
        batteryId,
        "recharge",
        n,
      );
    }
  }
  return answers;
}

describe("scoreFullAssessment", () => {
  it("marks insufficient_data when <2 items answered", () => {
    const answers = fillFullAnswers(() => 3);
    answers.fixture_full_physical_capacity_2 = null;
    answers.fixture_full_physical_capacity_3 = null;
    const result = scoreFullAssessment({
      items: FIXTURE_ALL_ITEMS,
      constructs: FIXTURE_CONSTRUCTS,
      thresholds: FIXTURE_SCORING_THRESHOLDS,
      answers,
    });
    const physical = result.batteryResults.find((r) => r.batteryId === "physical");
    assert.equal(physical?.capacity.status, "insufficient_data");
    assert.equal(physical?.batteryState, null);
    assert.ok(result.incompleteBatteryIds.includes("physical"));
  });

  it("computes overcharge when all four conditions hold", () => {
    const answers = fillFullAnswers((batteryId, dimension) => {
      if (batteryId === "work_daily_purpose" && dimension === "capacity") return 4;
      if (
        ["physical", "relational", "spiritual", "daily_rhythms"].includes(
          batteryId,
        ) &&
        dimension === "capacity"
      ) {
        return 1;
      }
      if (dimension === "strain") return 3;
      if (dimension === "recharge") return 2;
      return 2;
    });
    answers.fixture_full_work_daily_purpose_strain_3 = 4;

    const result = scoreFullAssessment({
      items: FIXTURE_ALL_ITEMS,
      constructs: FIXTURE_CONSTRUCTS,
      thresholds: FIXTURE_SCORING_THRESHOLDS,
      answers,
      overchargeRules: overchargeRulesFromThresholds(FIXTURE_SCORING_THRESHOLDS),
    });
    assert.equal(result.overcharge.isFlagged, true);
    assert.ok(result.overcharge.contributingBatteries.includes("work_daily_purpose"));
  });

  it("does not flag healthy high work engagement without difficulty stopping", () => {
    const answers = fillFullAnswers((batteryId, dimension) => {
      if (batteryId === "work_daily_purpose" && dimension === "capacity") return 4;
      if (
        ["physical", "relational"].includes(batteryId) &&
        dimension === "capacity"
      ) {
        return 1;
      }
      if (dimension === "strain") return 3;
      return 2;
    });
    answers.fixture_full_work_daily_purpose_strain_3 = 1;

    const result = scoreFullAssessment({
      items: FIXTURE_ALL_ITEMS,
      constructs: FIXTURE_CONSTRUCTS,
      thresholds: FIXTURE_SCORING_THRESHOLDS,
      answers,
    });
    assert.equal(result.overcharge.isFlagged, false);
    assert.equal(
      result.overcharge.conditions.find((c) => c.id === 4)?.passed,
      false,
    );
  });
});

describe("suggested mode signal-count boundaries", () => {
  it("maps 0–1 / 2–3 / 4+ batteries", () => {
    const none = fillFullAnswers((_b, dimension) =>
      dimension === "strain" ? 1 : 2,
    );
    assert.equal(
      computeSuggestedMode(FIXTURE_ALL_ITEMS, FIXTURE_CONSTRUCTS, none).mode,
      "green",
    );

    const two = fillFullAnswers((batteryId, dimension) => {
      if (
        dimension === "strain" &&
        (batteryId === "physical" || batteryId === "mental")
      ) {
        return 3;
      }
      return dimension === "strain" ? 1 : 2;
    });
    assert.equal(
      computeSuggestedMode(FIXTURE_ALL_ITEMS, FIXTURE_CONSTRUCTS, two).signalCount,
      2,
    );
    assert.equal(
      computeSuggestedMode(FIXTURE_ALL_ITEMS, FIXTURE_CONSTRUCTS, two).mode,
      "yellow",
    );

    const four = fillFullAnswers((batteryId, dimension) => {
      if (
        dimension === "strain" &&
        ["physical", "mental", "emotional", "relational"].includes(batteryId)
      ) {
        return 4;
      }
      return dimension === "strain" ? 0 : 2;
    });
    assert.equal(
      computeSuggestedMode(FIXTURE_ALL_ITEMS, FIXTURE_CONSTRUCTS, four).mode,
      "red",
    );
  });
});

describe("14-day Full Assessment lockout", () => {
  it("blocks when fewer than 14 days since last completion", () => {
    const locked = isFullAssessmentLocked(
      "2026-08-01T12:00:00.000Z",
      "2026-08-10T12:00:00.000Z",
    );
    assert.equal(locked.locked, true);
    assert.equal(locked.daysSince, 9);
    assert.ok(locked.message?.includes("9 days ago"));
  });

  it("allows at or after 14 days", () => {
    const open = isFullAssessmentLocked(
      "2026-08-01T12:00:00.000Z",
      "2026-08-15T12:00:00.000Z",
    );
    assert.equal(open.locked, false);
  });
});

describe("authority write boundaries", () => {
  it("DRAIN cannot write battery rings; Scan cannot write Full Assessment states", () => {
    assert.equal(
      assertInstrumentWriteAllowed("drain_check", "battery_rings"),
      false,
    );
    assert.equal(
      assertInstrumentWriteAllowed("battery_scan", "battery_rings"),
      false,
    );
    assert.equal(
      assertInstrumentWriteAllowed("full_assessment", "battery_rings"),
      true,
    );
    assert.equal(
      assertInstrumentWriteAllowed("battery_scan", "scan_markers"),
      true,
    );
  });
});

describe("version compare + helpers", () => {
  it("blocks cross-version numeric compare", () => {
    assert.equal(canCompareNumericResults(1, 1), true);
    assert.equal(canCompareNumericResults(1, 2), false);
  });

  it("scores DRAIN without battery state writes", () => {
    const drain = scoreDrainCheck({ a: 2, b: 1, c: 0 });
    assert.equal(drain.totalScore, 3);
    assert.equal(drain.interventionTriggered, true);
  });

  it("recommends most depleted Scan battery", () => {
    assert.equal(
      recommendBatteryFromScan({
        physical: "low",
        mental: "full",
        emotional: "steady",
      }),
      "physical",
    );
  });
});
