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

export function readContentDocument(): ContentDocument {
  ensureDir();
  if (!fs.existsSync(CONTENT_STORE_PATH)) {
    const seeded = createSeedContentDocument();
    writeContentDocument(seeded);
    return seeded;
  }
  const raw = fs.readFileSync(CONTENT_STORE_PATH, "utf8");
  return JSON.parse(raw) as ContentDocument;
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
