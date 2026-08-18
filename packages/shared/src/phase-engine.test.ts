/**
 * Extra scoring / recommendation / RBAC tests for Phases 2–8.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FIXTURE_ALL_ITEMS,
  FIXTURE_CONSTRUCTS,
  FIXTURE_DRAIN_ITEMS,
  FIXTURE_RECHARGE_ACTIONS,
  FIXTURE_RECOMMENDATION_LOOKUPS,
  ROLE_PERMISSIONS,
  applyWorkflowAction,
  canTransitionWorkflow,
  conflictDisplays,
  durationWithinModeCeiling,
  evaluateEscalation,
  fourOfSevenConsistency,
  hasPermission,
  lookupRecommendation,
  mostDepletedBattery,
  mostStabilizingStartingPoint,
  naRewriteFlag,
  pickTodayRecharge,
  resolveRecommendationSource,
  strongestSupportBattery,
  summarizeRestartRail,
  type BatteryResult,
} from "./index";

describe("DRAIN items are Strain moment variants", () => {
  it("links every DRAIN item to a strain construct with a two-week sibling", () => {
    for (const item of FIXTURE_DRAIN_ITEMS) {
      assert.equal(item.timeframe, "moment");
      const construct = FIXTURE_CONSTRUCTS.find((c) => c.id === item.constructId);
      assert.ok(construct, item.constructId);
      assert.equal(construct?.dimension, "strain");
      const twoWeek = FIXTURE_ALL_ITEMS.filter(
        (row) =>
          row.constructId === item.constructId && row.timeframe === "two_week",
      );
      assert.ok(twoWeek.length >= 1, `missing two-week sibling for ${item.id}`);
    }
  });
});

describe("RBAC matrix", () => {
  it("users cannot draft, review, publish, or edit thresholds", () => {
    assert.equal(hasPermission("user", "canDraftContent"), false);
    assert.equal(hasPermission("user", "canReviewContent"), false);
    assert.equal(hasPermission("user", "canPublishContent"), false);
    assert.equal(hasPermission("user", "canEditThresholds"), false);
  });

  it("editors draft only; reviewers review; admins publish + thresholds", () => {
    assert.equal(ROLE_PERMISSIONS.editor.canDraftContent, true);
    assert.equal(ROLE_PERMISSIONS.editor.canPublishContent, false);
    assert.equal(ROLE_PERMISSIONS.reviewer.canReviewContent, true);
    assert.equal(ROLE_PERMISSIONS.reviewer.canPublishContent, false);
    assert.equal(ROLE_PERMISSIONS.admin.canPublishContent, true);
    assert.equal(ROLE_PERMISSIONS.admin.canEditThresholds, true);
  });

  it("workflow transitions respect roles", () => {
    assert.equal(
      canTransitionWorkflow("draft", "publish", ROLE_PERMISSIONS.editor),
      false,
    );
    assert.equal(
      canTransitionWorkflow("draft", "publish", ROLE_PERMISSIONS.admin),
      true,
    );
    assert.equal(applyWorkflowAction("draft", "submit_review"), "in_review");
    assert.equal(applyWorkflowAction("in_review", "publish"), "published");
  });
});

describe("recommendation lookup", () => {
  it("respects Red duration ceiling (2 min)", () => {
    assert.equal(durationWithinModeCeiling("10min", "red"), false);
    assert.equal(durationWithinModeCeiling("2min", "red"), true);
    assert.equal(durationWithinModeCeiling("60s", "red"), true);
  });

  it("resolves a published lookup for physical / yellow", () => {
    const match = lookupRecommendation({
      lookups: FIXTURE_RECOMMENDATION_LOOKUPS,
      actions: FIXTURE_RECHARGE_ACTIONS,
      batteryId: "physical",
      mode: "yellow",
    });
    assert.ok(match);
    assert.ok(match && durationWithinModeCeiling(match.lookup.durationTier, "yellow"));
  });

  it("priority: DRAIN session beats stale scan", () => {
    const resolved = resolveRecommendationSource({
      drainCompletedThisSession: true,
      scanSetAt: "2020-01-01T00:00:00.000Z",
      scanRecommendedBatteryId: "mental",
      fullAssessmentCompletedAt: null,
      fullMostDepletedBatteryId: null,
      nowIso: "2026-08-18T00:00:00.000Z",
    });
    assert.equal(resolved.source, "drain_check");
  });

  it("falls back to prompt_scan", () => {
    const pick = pickTodayRecharge({
      lookups: FIXTURE_RECOMMENDATION_LOOKUPS,
      actions: FIXTURE_RECHARGE_ACTIONS,
      mode: "green",
      priority: {
        drainCompletedThisSession: false,
        scanSetAt: null,
        scanRecommendedBatteryId: null,
        fullAssessmentCompletedAt: null,
        fullMostDepletedBatteryId: null,
      },
    });
    assert.equal(pick.source, "prompt_scan");
    assert.equal(pick.action, null);
  });
});

describe("dashboard five-element helpers", () => {
  const results: BatteryResult[] = [
    {
      id: "1",
      sessionId: "s",
      batteryId: "physical",
      capacityScore: 1.0,
      strainScore: 3.5,
      rechargeScore: 1.0,
      batteryState: "low",
      computedAt: "2026-08-18T00:00:00.000Z",
    },
    {
      id: "2",
      sessionId: "s",
      batteryId: "mental",
      capacityScore: 3.5,
      strainScore: 1.0,
      rechargeScore: 3.0,
      batteryState: "well_charged",
      computedAt: "2026-08-18T00:00:00.000Z",
    },
    {
      id: "3",
      sessionId: "s",
      batteryId: "daily_rhythms",
      capacityScore: 2.2,
      strainScore: 1.2,
      rechargeScore: 2.0,
      batteryState: "steady",
      computedAt: "2026-08-18T00:00:00.000Z",
    },
  ];

  it("most depleted prefers low capacity + high strain", () => {
    assert.equal(mostDepletedBattery(results), "physical");
  });

  it("stabilizing starting point prefers Physical when Low", () => {
    assert.equal(mostStabilizingStartingPoint(results), "physical");
  });

  it("strongest support is high capacity + recharge", () => {
    assert.equal(strongestSupportBattery(results), "mental");
  });

  it("conflict copy names both sources", () => {
    const rows = conflictDisplays({
      rings: [{ batteryId: "physical", state: "steady" }],
      markers: [{ batteryId: "physical", rating: "low" }],
      batteryNames: { physical: "Physical" },
    });
    assert.equal(rows.length, 1);
    assert.match(rows[0]!.copy, /usually reads Steady/);
    assert.match(rows[0]!.copy, /Today you marked it Low/);
  });
});

describe("restart rail + N/A flag", () => {
  it("four-of-seven does not mention streaks", () => {
    const result = fourOfSevenConsistency([
      "yes",
      "not_today",
      "yes",
      "partly",
      "changed",
      "not_today",
      "yes",
    ]);
    assert.equal(result.consistent, true);
    assert.equal(result.completedCount, 5);
  });

  it("summarizes returns and Plan B without failed-day counts", () => {
    const metrics = summarizeRestartRail(
      [
        {
          id: "a",
          userId: "u",
          missedAt: "2026-08-18T10:00:00.000Z",
          returnedAt: "2026-08-18T10:20:00.000Z",
          action: "use_plan_b",
          usedPlanB: true,
        },
      ],
      ["yes", "not_today"],
    );
    assert.equal(metrics.successfulReturns, 1);
    assert.equal(metrics.planBUsage, 1);
    assert.equal(metrics.averageMinutesToReturn, 20);
    assert.equal("failedDays" in metrics, false);
  });

  it("flags N/A rate above 15%", () => {
    assert.equal(naRewriteFlag(2, 10), true);
    assert.equal(naRewriteFlag(1, 10), false);
  });
});

describe("escalation tiers", () => {
  const lowAll = {
    completedAt: "2026-08-01T00:00:00.000Z",
    batteryStates: {
      daily_rhythms: "low" as const,
      physical: "low" as const,
      mental: "low" as const,
      emotional: "low" as const,
      relational: "steady" as const,
      spiritual: "steady" as const,
      work_daily_purpose: "steady" as const,
    },
    physicalCapacity: 2.0,
  };

  it("tier 1 when 4+ batteries Low across two assessments >=14 days", () => {
    const result = evaluateEscalation({
      previous: lowAll,
      current: { ...lowAll, completedAt: "2026-08-16T00:00:00.000Z" },
      lastTier1At: null,
      lastTier2At: null,
    });
    assert.equal(result.tier, 1);
  });

  it("does not fire inside 14 days", () => {
    const result = evaluateEscalation({
      previous: lowAll,
      current: { ...lowAll, completedAt: "2026-08-05T00:00:00.000Z" },
      lastTier1At: null,
      lastTier2At: null,
    });
    assert.equal(result.tier, null);
  });

  it("tier 2 when Physical capacity < 1.5 sustained", () => {
    const result = evaluateEscalation({
      previous: { ...lowAll, physicalCapacity: 1.2 },
      current: {
        ...lowAll,
        completedAt: "2026-08-16T00:00:00.000Z",
        physicalCapacity: 1.1,
      },
      lastTier1At: null,
      lastTier2At: null,
    });
    assert.equal(result.tier, 2);
  });
});
