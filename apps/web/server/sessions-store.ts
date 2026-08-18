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
  ConsentRecord,
  DailyCheckIn,
  DrivingModeRow,
  EscalationEvent,
  OnboardingProgress,
  OverchargeFlag,
  PrivacySettings,
  RestartRailEvent,
  TuneUp,
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
  checkIns: DailyCheckIn[];
  restartRail: RestartRailEvent[];
  tuneUps: TuneUp[];
  escalationEvents: EscalationEvent[];
  consentRecords: ConsentRecord[];
  onboarding: OnboardingProgress[];
  privacyByUser: Record<string, PrivacySettings>;
  telemetry: Array<{
    id: string;
    userId: string;
    sessionId: string | null;
    kind: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
  mailLog: Array<{
    id: string;
    userKey: string;
    kind: string;
    to: string;
    subject: string;
    body: string;
    provider: string;
    status: string;
    createdAt: string;
    error: string | null;
  }>;
};

const rootDir = path.dirname(fileURLToPath(import.meta.url));
export const SESSIONS_DATA_DIR = path.resolve(rootDir, "../data");

export function sessionsStorePath(): string {
  if (process.env.TL_SESSIONS_STORE_PATH) {
    return path.resolve(process.env.TL_SESSIONS_STORE_PATH);
  }
  return path.join(SESSIONS_DATA_DIR, "sessions.json");
}

export const SESSIONS_STORE_PATH = sessionsStorePath();

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
    checkIns: [],
    restartRail: [],
    tuneUps: [],
    escalationEvents: [],
    consentRecords: [],
    onboarding: [],
    privacyByUser: {},
    telemetry: [],
    mailLog: [],
  };
}

function ensureDir(): void {
  const dir = path.dirname(sessionsStorePath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readSessionsDocument(): SessionsDocument {
  ensureDir();
  const storePath = sessionsStorePath();
  if (!fs.existsSync(storePath)) {
    const seeded = emptyDocument();
    writeSessionsDocument(seeded);
    return seeded;
  }
  const raw = fs.readFileSync(storePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<SessionsDocument>;
  const blank = emptyDocument();
  return {
    ...blank,
    ...parsed,
    checkIns: parsed.checkIns ?? [],
    restartRail: parsed.restartRail ?? [],
    tuneUps: parsed.tuneUps ?? [],
    escalationEvents: parsed.escalationEvents ?? [],
    consentRecords: parsed.consentRecords ?? [],
    onboarding: parsed.onboarding ?? [],
    privacyByUser: parsed.privacyByUser ?? {},
    telemetry: parsed.telemetry ?? [],
    mailLog: parsed.mailLog ?? [],
    sessions: parsed.sessions ?? [],
    responses: parsed.responses ?? [],
    batteryResults: parsed.batteryResults ?? [],
    overchargeFlags: parsed.overchargeFlags ?? [],
    drivingModes: parsed.drivingModes ?? [],
    scanRecommendations: parsed.scanRecommendations ?? [],
    drainResults: parsed.drainResults ?? [],
    signalCountLogs: parsed.signalCountLogs ?? [],
  };
}

export function writeSessionsDocument(doc: SessionsDocument): void {
  ensureDir();
  const next: SessionsDocument = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    sessionsStorePath(),
    `${JSON.stringify(next, null, 2)}\n`,
    "utf8",
  );
  void import("./cloud-persist.ts")
    .then((mod) => mod.scheduleCloudPersist(() => mod.persistSessionsToCloud(next)))
    .catch(() => undefined);
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
