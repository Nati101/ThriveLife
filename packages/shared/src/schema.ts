/**
 * Section 10 core data objects (spec Part 10).
 * Content-admin entities are persisted in Phase 2; runtime assessment rows
 * are typed here for Phase 3 and remain empty in the local content store.
 */

import type { BatteryId, BatteryState } from "./batteries";
import type { InstrumentId } from "./instruments";
import type { DrivingMode, DrivingModeOrUnsure } from "./driving-mode";
import type { CheckInCompletion } from "./scoring";
import type { Role } from "./roles";

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  timezone: string;
  preferences: Record<string, unknown>;
  consentStatus: "unknown" | "accepted" | "withdrawn";
  notificationSettings: {
    remindersEnabled: boolean;
  };
  contentPathway: "default" | string;
  ageVerified: boolean;
  role: Role;
  softDeletedAt: string | null;
};

export type AssessmentSessionStatus =
  | "in_progress"
  | "completed"
  | "abandoned";

export type AssessmentSession = {
  id: string;
  userId: string;
  instrumentId: InstrumentId;
  startedAt: string;
  completedAt: string | null;
  /** Max item version stamped on the session at start. */
  version: number;
  intervalSincePreviousDays: number | null;
  status: AssessmentSessionStatus;
  /** Instrument-specific result payload (never blends Scan + Full Assessment). */
  resultSummary: Record<string, unknown> | null;
};

export type AssessmentResponse = {
  id: string;
  sessionId: string;
  itemId: string;
  /** Unsure / N/A must stay null — never midpoint (spec §3). */
  answer: number | string | null;
  skipped: boolean;
  timestamp: string;
};

export type BatteryResult = {
  id: string;
  sessionId: string;
  batteryId: BatteryId;
  capacityScore: number | null;
  strainScore: number | null;
  rechargeScore: number | null;
  batteryState: BatteryState | null;
  computedAt: string;
};

export type OverchargeFlag = {
  id: string;
  sessionId: string;
  isFlagged: boolean;
  contributingBatteries: BatteryId[];
  dismissed: boolean;
  dismissedAt: string | null;
};

export type DrivingModeRow = {
  id: string;
  userId: string;
  declaredMode: DrivingModeOrUnsure;
  suggestedMode: DrivingMode | null;
  setAt: string;
  source: "weekly_check" | "onboarding" | "daily_check_in";
};

export type Signal = {
  id: string;
  batteryId: BatteryId;
  channel: "body" | "brain" | "behavior";
  description: string;
  severity: "low" | "moderate" | "high";
  relatedRechargeIds: string[];
};

export type RechargePlan = {
  id: string;
  userId: string;
  batteryId: BatteryId;
  warningLight: string;
  planAActionId: string;
  planBActionId: string;
  cue: string;
  supportAction: string;
  startDate: string;
  reviewDate: string | null;
};

export type DailyCheckIn = {
  id: string;
  userId: string;
  mode: DrivingModeOrUnsure;
  batteryId: BatteryId;
  rechargeSelected: string | null;
  completion: CheckInCompletion;
  note: string | null;
  date: string;
  timezone?: string;
};

export type TuneUp = {
  id: string;
  userId: string;
  batteryId: BatteryId;
  interval: 30 | 60 | 90;
  warningLight: string;
  dailyActionId: string | null;
  supportAction: string | null;
  winDefinition: string | null;
  startDate: string;
  reviewDate: string | null;
  reviewOutcomes: Record<string, unknown>;
};

export type EscalationEvent = {
  id: string;
  userId: string;
  tier: 1 | 2;
  triggeredAt: string;
  messageShown: string;
  dismissed: boolean;
  dismissedAt: string | null;
};

export type ConsentRecord = {
  id: string;
  userId: string;
  version: string;
  acceptedAt: string;
  withdrawnAt: string | null;
};

export type OnboardingProgress = {
  userId: string;
  step: number;
  declinedFullAssessmentAt: string | null;
  firstRechargeCompletedAt: string | null;
  contextAnswers: Record<string, string>;
  day3PromptedAt: string | null;
  day7PromptedAt: string | null;
  completedAt: string | null;
};

export type ThresholdAuditEntry = {
  id: string;
  thresholdId: string;
  changedAt: string;
  changedByRole: Role;
  changedByUserId: string;
  before: {
    minValue: number | null;
    maxValue: number | null;
    levelName: string;
    description: string;
  };
  after: {
    minValue: number | null;
    maxValue: number | null;
    levelName: string;
    description: string;
  };
};
