import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createSeedContentDocument,
  publishedItems,
  pickTodayRecharge,
} from "@thrivelife/shared";

describe("seeded content store v2", () => {
  const doc = createSeedContentDocument();

  it("includes copy, lookups, signals, and DRAIN-strain variants", () => {
    assert.equal(doc.version, 2);
    assert.ok(doc.contentCopy.length >= 4);
    assert.ok(doc.recommendationLookups.length >= 7);
    assert.ok(doc.signals.length >= 7);
    const drain = doc.items.filter((i) => i.instrumentId === "drain_check");
    assert.equal(drain.length, 10);
    for (const item of drain) {
      const construct = doc.constructs.find((c) => c.id === item.constructId);
      assert.equal(construct?.dimension, "strain");
    }
  });

  it("published items include Full Assessment 56", () => {
    const full = publishedItems(doc).filter((i) => i.instrumentId === "full_assessment");
    assert.equal(full.length, 56);
  });

  it("lookup resolves for a scan-fresh physical battery", () => {
    const pick = pickTodayRecharge({
      lookups: doc.recommendationLookups,
      actions: doc.rechargeActions,
      mode: "red",
      priority: {
        drainCompletedThisSession: false,
        scanSetAt: new Date().toISOString(),
        scanRecommendedBatteryId: "physical",
        fullAssessmentCompletedAt: null,
        fullMostDepletedBatteryId: null,
      },
    });
    assert.equal(pick.source, "battery_scan");
    assert.ok(pick.action);
    assert.equal(pick.preferredPlan, "plan_b");
  });
});
