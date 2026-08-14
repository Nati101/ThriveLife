/**
 * Local content document for Phase 2 admin CRUD.
 * Persisted as JSON on disk until Canada-region Postgres lands.
 */

import type { BatteryDefinition } from "./batteries";
import type {
  AssessmentItem,
  Construct,
  InstrumentDefinition,
  ResponseScale,
} from "./instruments";
import type { RechargeAction } from "./recharge";
import type { ScoringThreshold } from "./scoring";
import type { ThresholdAuditEntry } from "./schema";
import { FIXTURE_BATTERIES } from "./fixtures/batteries";
import {
  FIXTURE_INSTRUMENTS,
  FIXTURE_RESPONSE_SCALES,
} from "./fixtures/instruments";
import {
  FIXTURE_ALL_ITEMS,
  FIXTURE_CONSTRUCTS,
} from "./fixtures/items";
import {
  FIXTURE_RECHARGE_ACTIONS,
  FIXTURE_SCORING_THRESHOLDS,
} from "./fixtures/recharge";

export const CONTENT_STORE_VERSION = 1 as const;

export type ContentCollection =
  | "batteries"
  | "constructs"
  | "instruments"
  | "responseScales"
  | "items"
  | "rechargeActions"
  | "scoringThresholds";

export type ContentDocument = {
  version: typeof CONTENT_STORE_VERSION;
  seededAt: string;
  updatedAt: string;
  batteries: BatteryDefinition[];
  constructs: Construct[];
  instruments: InstrumentDefinition[];
  responseScales: ResponseScale[];
  items: AssessmentItem[];
  rechargeActions: RechargeAction[];
  scoringThresholds: ScoringThreshold[];
  thresholdAuditLog: ThresholdAuditEntry[];
};

export type ContentSummary = {
  batteries: number;
  constructs: number;
  instruments: number;
  responseScales: number;
  items: number;
  rechargeActions: number;
  scoringThresholds: number;
  thresholdAuditEntries: number;
  seededAt: string;
  updatedAt: string;
};

export function summarizeContent(doc: ContentDocument): ContentSummary {
  return {
    batteries: doc.batteries.length,
    constructs: doc.constructs.length,
    instruments: doc.instruments.length,
    responseScales: doc.responseScales.length,
    items: doc.items.length,
    rechargeActions: doc.rechargeActions.length,
    scoringThresholds: doc.scoringThresholds.length,
    thresholdAuditEntries: doc.thresholdAuditLog.length,
    seededAt: doc.seededAt,
    updatedAt: doc.updatedAt,
  };
}

/** Build the initial store from shared fixtures (first run / reset). */
export function createSeedContentDocument(
  now: string = new Date().toISOString(),
): ContentDocument {
  return {
    version: CONTENT_STORE_VERSION,
    seededAt: now,
    updatedAt: now,
    batteries: structuredClone(FIXTURE_BATTERIES),
    constructs: structuredClone(FIXTURE_CONSTRUCTS),
    instruments: structuredClone(FIXTURE_INSTRUMENTS),
    responseScales: structuredClone(FIXTURE_RESPONSE_SCALES),
    items: structuredClone(FIXTURE_ALL_ITEMS),
    rechargeActions: structuredClone(FIXTURE_RECHARGE_ACTIONS),
    scoringThresholds: structuredClone(FIXTURE_SCORING_THRESHOLDS),
    thresholdAuditLog: [],
  };
}

export function itemsForConstruct(
  doc: ContentDocument,
  constructId: string,
): AssessmentItem[] {
  return doc.items.filter((item) => item.constructId === constructId);
}

/** Group items by timeframe so construct editors see coordinated variants. */
export function groupItemsByTimeframe(items: AssessmentItem[]) {
  const moment = items.filter((item) => item.timeframe === "moment");
  const twoWeek = items.filter((item) => item.timeframe === "two_week");
  return { moment, twoWeek };
}
