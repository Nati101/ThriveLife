/**
 * Tier 1 / Tier 2 escalation (spec §9.4–9.5). Never score-triggered support links.
 */

import { daysBetween } from "./assessment-scoring";
import type { BatteryId, BatteryState } from "./batteries";

export const TIER1_COPY =
  "Several areas have been reading low for a while now. ThriveLife is built for ordinary depletion, and some things need more support than an app can offer. Talking with a doctor or a counselor is a reasonable next step, and it is not a sign that anything has gone wrong.";

export const TIER2_COPY =
  "[FIXTURE — book voice pending Joel] Persistent Physical capacity readings this low are a signal to check in with a medical professional. This is ordinary care for the body, not a verdict about you.";

export const TIER1_MIN_LOW_BATTERIES = 4;
export const TIER1_MIN_INTERVAL_DAYS = 14;
export const TIER1_SUPPRESS_DAYS = 30;
export const TIER2_PHYSICAL_CAPACITY_MAX = 1.5;

export type AssessmentSnapshot = {
  completedAt: string;
  batteryStates: Partial<Record<BatteryId, BatteryState | null>>;
  physicalCapacity: number | null;
};

export function countLowBatteries(
  states: Partial<Record<BatteryId, BatteryState | null>>,
): number {
  return Object.values(states).filter((state) => state === "low").length;
}

export function evaluateEscalation(input: {
  previous: AssessmentSnapshot | null;
  current: AssessmentSnapshot;
  lastTier1At: string | null;
  lastTier2At: string | null;
}): { tier: 1 | 2 | null; message: string | null } {
  const { previous, current } = input;
  if (!previous) return { tier: null, message: null };
  const interval = daysBetween(previous.completedAt, current.completedAt);
  if (interval < TIER1_MIN_INTERVAL_DAYS) return { tier: null, message: null };

  const physicalSustained =
    previous.physicalCapacity != null &&
    current.physicalCapacity != null &&
    previous.physicalCapacity < TIER2_PHYSICAL_CAPACITY_MAX &&
    current.physicalCapacity < TIER2_PHYSICAL_CAPACITY_MAX;

  if (physicalSustained) {
    const recentTier2 =
      input.lastTier2At != null &&
      daysBetween(input.lastTier2At, current.completedAt) < TIER1_SUPPRESS_DAYS;
    if (!recentTier2) return { tier: 2, message: TIER2_COPY };
  }

  const prevLow = countLowBatteries(previous.batteryStates);
  const currLow = countLowBatteries(current.batteryStates);
  if (prevLow >= TIER1_MIN_LOW_BATTERIES && currLow >= TIER1_MIN_LOW_BATTERIES) {
    const recentTier1 =
      input.lastTier1At != null &&
      daysBetween(input.lastTier1At, current.completedAt) < TIER1_SUPPRESS_DAYS;
    if (!recentTier1) return { tier: 1, message: TIER1_COPY };
  }

  return { tier: null, message: null };
}
