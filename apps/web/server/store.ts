/**
 * JSON file content store for local Phase 2.
 * Survives refresh; re-seeded automatically when the file is missing.
 *
 * Future: replace with Canada-region Postgres (see docs / .env.example).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createSeedContentDocument,
  type ContentDocument,
} from "@thrivelife/shared";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
export const CONTENT_DATA_DIR = path.resolve(rootDir, "../data");
export const CONTENT_STORE_PATH = path.join(
  CONTENT_DATA_DIR,
  "content-store.json",
);

function ensureDir(): void {
  if (!fs.existsSync(CONTENT_DATA_DIR)) {
    fs.mkdirSync(CONTENT_DATA_DIR, { recursive: true });
  }
}

function migrateContentDocument(raw: Partial<ContentDocument>): ContentDocument {
  const seed = createSeedContentDocument();
  const batteries = raw.batteries?.length
    ? raw.batteries.map((row) => ({
        ...row,
        icon: row.icon ?? seed.batteries.find((b) => b.id === row.id)?.icon ?? "circle",
      }))
    : seed.batteries;
  return {
    ...seed,
    ...raw,
    version: 2,
    batteries,
    constructs: raw.constructs ?? seed.constructs,
    instruments: raw.instruments ?? seed.instruments,
    responseScales: raw.responseScales ?? seed.responseScales,
    items: raw.items ?? seed.items,
    rechargeActions: raw.rechargeActions ?? seed.rechargeActions,
    scoringThresholds: raw.scoringThresholds ?? seed.scoringThresholds,
    thresholdAuditLog: raw.thresholdAuditLog ?? [],
    contentCopy: raw.contentCopy?.length ? raw.contentCopy : seed.contentCopy,
    recommendationLookups: raw.recommendationLookups?.length
      ? raw.recommendationLookups
      : seed.recommendationLookups,
    signals: raw.signals?.length ? raw.signals : seed.signals,
    workflowEvents: raw.workflowEvents ?? [],
    seededAt: raw.seededAt ?? seed.seededAt,
    updatedAt: raw.updatedAt ?? seed.updatedAt,
  };
}

export function readContentDocument(): ContentDocument {
  ensureDir();
  if (!fs.existsSync(CONTENT_STORE_PATH)) {
    const seeded = createSeedContentDocument();
    writeContentDocument(seeded);
    return seeded;
  }
  const raw = fs.readFileSync(CONTENT_STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<ContentDocument>;
  const migrated = migrateContentDocument(parsed);
  if (
    parsed.version !== 2 ||
    !parsed.contentCopy ||
    !parsed.recommendationLookups
  ) {
    writeContentDocument(migrated);
  }
  return migrated;
}

export function writeContentDocument(doc: ContentDocument): void {
  ensureDir();
  const next: ContentDocument = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    CONTENT_STORE_PATH,
    `${JSON.stringify(next, null, 2)}\n`,
    "utf8",
  );
}

export function resetContentDocument(): ContentDocument {
  const seeded = createSeedContentDocument();
  writeContentDocument(seeded);
  return seeded;
}

export function touchContentDocument(
  mutate: (doc: ContentDocument) => void,
): ContentDocument {
  const doc = readContentDocument();
  mutate(doc);
  writeContentDocument(doc);
  return readContentDocument();
}
