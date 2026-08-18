/**
 * Local content document for admin CRUD.
 * JSON file locally; same shape seeded into Supabase Postgres.
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
import type { ThresholdAuditEntry, Signal } from "./schema";
import type { ContentCopy } from "./copy";
import type { RecommendationLookup } from "./recommendations";
import type { WorkflowStatus } from "./workflow";
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
  FIXTURE_RECOMMENDATION_LOOKUPS,
  FIXTURE_SCORING_THRESHOLDS,
} from "./fixtures/recharge";
import { FIXTURE_CONTENT_COPY } from "./fixtures/copy";
import { FIXTURE_SIGNALS } from "./fixtures/signals";

export const CONTENT_STORE_VERSION = 2 as const;

export type ContentCollection =
  | "batteries"
  | "constructs"
  | "instruments"
  | "responseScales"
  | "items"
  | "rechargeActions"
  | "scoringThresholds"
  | "contentCopy"
  | "recommendationLookups"
  | "signals";

export type WorkflowEvent = {
  id: string;
  collection: string;
  recordId: string;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  action: string;
  actorRole: string;
  actorUserId: string;
  at: string;
};

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
  contentCopy: ContentCopy[];
  recommendationLookups: RecommendationLookup[];
  signals: Signal[];
  workflowEvents: WorkflowEvent[];
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
  contentCopy: number;
  recommendationLookups: number;
  signals: number;
  workflowEvents: number;
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
    contentCopy: doc.contentCopy.length,
    recommendationLookups: doc.recommendationLookups.length,
    signals: doc.signals.length,
    workflowEvents: doc.workflowEvents.length,
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
    contentCopy: structuredClone(FIXTURE_CONTENT_COPY),
    recommendationLookups: structuredClone(FIXTURE_RECOMMENDATION_LOOKUPS),
    signals: structuredClone(FIXTURE_SIGNALS),
    workflowEvents: [],
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

export function publishedItems(doc: ContentDocument): AssessmentItem[] {
  return doc.items.filter(
    (item) => item.active && (item.workflowStatus ?? "published") === "published",
  );
}
