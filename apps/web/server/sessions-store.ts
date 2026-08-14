/**
 * User assessment sessions — separate from admin content store.
 * Persisted as apps/web/data/sessions.json (gitignored).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AssessmentResponse,
  AssessmentSession,
  BatteryResult,
  DrivingModeRow,
  OverchargeFlag,
} from "@thrivelife/shared";
import type { BatteryId } from "@thrivelife/shared";

export const SESSIONS_STORE_VERSION = 1 as const;

export type ScanRecommendationRow = {
  id: string;
  userId: string;
  sessionId: string;
  ratings: Partial<Record<BatteryId, "low" | "steady" | "full" | null>>;
  recommendedBatteryId: BatteryId | null;
  setAt: string;
};

export type DrainResultRow = {
  id: string;
  userId: string;
  sessionId: string;
  totalScore: number;
  answeredCount: number;
  interventionTriggered: boolean;
  completedAt: string;
};

export type SignalCountLogRow = {
  id: string;
  userId: string;
  sessionId: string;
  signalCount: number;
  batteriesShowingSignal: BatteryId[];
  suggestedMode: string;
  loggedAt: string;
};

export type SessionsDocument = {
  version: typeof SESSIONS_STORE_VERSION;
  updatedAt: string;
  sessions: AssessmentSession[];
  responses: AssessmentResponse[];
  batteryResults: BatteryResult[];
  overchargeFlags: OverchargeFlag[];
  drivingModes: DrivingModeRow[];
  scanRecommendations: ScanRecommendationRow[];
  drainResults: DrainResultRow[];
  signalCountLogs: SignalCountLogRow[];
};

const rootDir = path.dirname(fileURLToPath(import.meta.url));
export const SESSIONS_DATA_DIR = path.resolve(rootDir, "../data");
export const SESSIONS_STORE_PATH = path.join(
  SESSIONS_DATA_DIR,
  "sessions.json",
);

function emptyDocument(now = new Date().toISOString()): SessionsDocument {
  return {
    version: SESSIONS_STORE_VERSION,
    updatedAt: now,
    sessions: [],
    responses: [],
    batteryResults: [],
    overchargeFlags: [],
    drivingModes: [],
    scanRecommendations: [],
    drainResults: [],
    signalCountLogs: [],
  };
}

function ensureDir(): void {
  if (!fs.existsSync(SESSIONS_DATA_DIR)) {
    fs.mkdirSync(SESSIONS_DATA_DIR, { recursive: true });
  }
}

export function readSessionsDocument(): SessionsDocument {
  ensureDir();
  if (!fs.existsSync(SESSIONS_STORE_PATH)) {
    const seeded = emptyDocument();
    writeSessionsDocument(seeded);
    return seeded;
  }
  const raw = fs.readFileSync(SESSIONS_STORE_PATH, "utf8");
  return JSON.parse(raw) as SessionsDocument;
}

export function writeSessionsDocument(doc: SessionsDocument): void {
  ensureDir();
  const next: SessionsDocument = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    SESSIONS_STORE_PATH,
    `${JSON.stringify(next, null, 2)}\n`,
    "utf8",
  );
}

export function touchSessionsDocument(
  mutate: (doc: SessionsDocument) => void,
): SessionsDocument {
  const doc = readSessionsDocument();
  mutate(doc);
  writeSessionsDocument(doc);
  return readSessionsDocument();
}

export function ensureSessionsStoreReady(): void {
  readSessionsDocument();
}

export function newSessionId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
