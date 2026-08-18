/**
 * Dashboard authority & staleness (§3.2).
 * One authoritative source per element — never blend Scan with Full Assessment.
 */

import type { BatteryId, BatteryState } from "./batteries";
import type { DrivingMode, DrivingModeOrUnsure } from "./driving-mode";
import {
  FULL_ASSESSMENT_STALE_AFTER_DAYS,
  MODE_STALE_AFTER_HOURS,
  SCAN_STALE_AFTER_HOURS,
  daysBetween,
} from "./assessment-scoring";

export type AuthorityStatus = "available" | "stale" | "missing";

export type AuthorityValue<T> = {
  status: AuthorityStatus;
  value: T | null;
  source:
    | "full_assessment"
    | "battery_scan"
    | "drain_check"
    | "weekly_mode_check"
    | null;
  prompt: string | null;
  setAt: string | null;
};

export type BatteryRingAuthority = AuthorityValue<BatteryState> & {
  batteryId: BatteryId;
};

export type ScanMarkerAuthority = AuthorityValue<"low" | "steady" | "full"> & {
  batteryId: BatteryId;
};

export type DashboardAuthoritySnapshot = {
  batteryRings: BatteryRingAuthority[];
  scanMarkers: ScanMarkerAuthority[];
  recommendedBatteryToday: AuthorityValue<BatteryId>;
  declaredDrivingMode: AuthorityValue<DrivingModeOrUnsure>;
  suggestedDrivingMode: AuthorityValue<DrivingMode>;
  overchargeFlag: AuthorityValue<{
    isFlagged: boolean;
    contributingBatteries: BatteryId[];
  }>;
  drainSessionIntervention: AuthorityValue<boolean>;
  /** Explicit reminder — never average Scan + Full Assessment. */
  conflictNote: string | null;
};

function hoursBetween(earlierIso: string, laterIso: string): number {
  const a = Date.parse(earlierIso);
  const b = Date.parse(laterIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return (b - a) / (60 * 60 * 1000);
}

function resolveFreshness(
  setAt: string | null,
  nowIso: string,
  staleAfterHours: number,
): AuthorityStatus {
  if (!setAt) return "missing";
  const hours = hoursBetween(setAt, nowIso);
  if (hours > staleAfterHours) return "stale";
  return "available";
}

export type AuthorityInput = {
  nowIso?: string;
  fullAssessment: {
    completedAt: string | null;
    version: number | null;
    batteryStates: Partial<Record<BatteryId, BatteryState | null>>;
    overcharge: {
      isFlagged: boolean;
      contributingBatteries: BatteryId[];
      dismissed: boolean;
    } | null;
    suggestedMode: DrivingMode | null;
  } | null;
  batteryScan: {
    setAt: string | null;
    ratings: Partial<Record<BatteryId, "low" | "steady" | "full" | null>>;
    recommendedBatteryId: BatteryId | null;
  } | null;
  drivingMode: {
    declaredMode: DrivingModeOrUnsure | null;
    suggestedMode: DrivingMode | null;
    setAt: string | null;
  } | null;
  drainCheck: {
    completedAt: string | null;
    interventionTriggered: boolean;
  } | null;
};

/**
 * Central resolver for dashboard elements.
 * Battery rings ← Full Assessment only.
 * Scan markers / today’s battery ← Battery Scan only.
 * Declared mode ← Weekly Mode Check (user), never silent overwrite from scores.
 */
export function resolveDashboardAuthority(
  input: AuthorityInput,
): DashboardAuthoritySnapshot {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const fa = input.fullAssessment;
  const scan = input.batteryScan;

  const faStatus = (() => {
    if (!fa?.completedAt) return "missing" as const;
    const days = daysBetween(fa.completedAt, nowIso);
    if (days > FULL_ASSESSMENT_STALE_AFTER_DAYS) return "stale" as const;
    return "available" as const;
  })();

  const batteryIds = Object.keys(
    fa?.batteryStates ?? {},
  ) as BatteryId[];
  const allBatteryIds: BatteryId[] =
    batteryIds.length > 0
      ? batteryIds
      : ([
          "daily_rhythms",
          "physical",
          "mental",
          "emotional",
          "relational",
          "spiritual",
          "work_daily_purpose",
        ] as BatteryId[]);

  // Prefer canonical seven if states sparse
  const ringIds: BatteryId[] = [
    "daily_rhythms",
    "physical",
    "mental",
    "emotional",
    "relational",
    "spiritual",
    "work_daily_purpose",
  ];

  const batteryRings: BatteryRingAuthority[] = ringIds.map((batteryId) => {
    const state = fa?.batteryStates[batteryId] ?? null;
    if (faStatus === "missing" || state == null) {
      return {
        batteryId,
        status: faStatus === "stale" ? "stale" : "missing",
        value: null,
        source: "full_assessment",
        prompt: "Take the Full Assessment to see this battery state.",
        setAt: fa?.completedAt ?? null,
      };
    }
    return {
      batteryId,
      status: faStatus,
      value: state,
      source: "full_assessment",
      prompt:
        faStatus === "stale"
          ? "Full Assessment is older than 90 days — retake for current states."
          : null,
      setAt: fa?.completedAt ?? null,
    };
  });

  const scanStatus = resolveFreshness(
    scan?.setAt ?? null,
    nowIso,
    SCAN_STALE_AFTER_HOURS,
  );

  const scanMarkers: ScanMarkerAuthority[] = ringIds.map((batteryId) => {
    const rating = scan?.ratings[batteryId] ?? null;
    if (scanStatus === "missing" || rating == null) {
      return {
        batteryId,
        status: scanStatus === "stale" ? "stale" : "missing",
        value: null,
        source: "battery_scan",
        prompt: "Complete today’s Battery Scan.",
        setAt: scan?.setAt ?? null,
      };
    }
    return {
      batteryId,
      status: scanStatus,
      value: rating,
      source: "battery_scan",
      prompt:
        scanStatus === "stale"
          ? "Battery Scan is older than 18 hours."
          : null,
      setAt: scan?.setAt ?? null,
    };
  });

  const recommendedBatteryToday: AuthorityValue<BatteryId> = {
    status: scanStatus,
    value:
      scanStatus === "available" ? (scan?.recommendedBatteryId ?? null) : null,
    source: "battery_scan",
    prompt:
      scanStatus === "available"
        ? null
        : "Battery Scan (last 18h) authors today’s recommended battery.",
    setAt: scan?.setAt ?? null,
  };

  const modeStatus = resolveFreshness(
    input.drivingMode?.setAt ?? null,
    nowIso,
    MODE_STALE_AFTER_HOURS,
  );
  const declaredDrivingMode: AuthorityValue<DrivingModeOrUnsure> = {
    status: modeStatus,
    value:
      modeStatus === "available"
        ? (input.drivingMode?.declaredMode ?? null)
        : null,
    source: "weekly_mode_check",
    prompt:
      modeStatus === "available"
        ? null
        : "Declare Driving Mode via Weekly Mode Check (stale after 7 days).",
    setAt: input.drivingMode?.setAt ?? null,
  };

  const suggestedDrivingMode: AuthorityValue<DrivingMode> = {
    status: faStatus === "available" && fa?.suggestedMode ? "available" : faStatus,
    value: faStatus === "available" ? (fa?.suggestedMode ?? null) : null,
    source: "full_assessment",
    prompt: "Suggested mode is advisory only — never written silently.",
    setAt: fa?.completedAt ?? null,
  };

  const overcharge =
    fa?.overcharge && !fa.overcharge.dismissed
      ? fa.overcharge
      : null;
  const overchargeFlag: AuthorityValue<{
    isFlagged: boolean;
    contributingBatteries: BatteryId[];
  }> = {
    status: faStatus,
    value:
      faStatus === "available" && overcharge
        ? {
            isFlagged: overcharge.isFlagged,
            contributingBatteries: overcharge.contributingBatteries,
          }
        : null,
    source: "full_assessment",
    prompt: null,
    setAt: fa?.completedAt ?? null,
  };

  const drain = input.drainCheck;
  const drainSessionIntervention: AuthorityValue<boolean> = {
    status: drain?.completedAt ? "available" : "missing",
    value: drain?.completedAt ? drain.interventionTriggered : null,
    source: "drain_check",
    prompt: drain?.completedAt
      ? null
      : "DRAIN Check is session-only and does not write battery states.",
    setAt: drain?.completedAt ?? null,
  };

  // Conflict display (§3.5): name both sources; never merge.
  const conflicts: string[] = [];
  for (const ring of batteryRings) {
    const marker = scanMarkers.find((m) => m.batteryId === ring.batteryId);
    if (
      ring.status === "available" &&
      marker?.status === "available" &&
      ring.value &&
      marker.value
    ) {
      const ringLevel =
        ring.value === "low"
          ? 0
          : ring.value === "strained_but_functioning"
            ? 1
            : ring.value === "steady"
              ? 2
              : 3;
      const scanLevel =
        marker.value === "low" ? 0 : marker.value === "steady" ? 2 : 3;
      if (Math.abs(ringLevel - scanLevel) > 1) {
        const usual =
          ring.value === "low"
            ? "Low"
            : ring.value === "strained_but_functioning"
              ? "Strained but Functioning"
              : ring.value === "steady"
                ? "Steady"
                : "Well Charged";
        const today =
          marker.value === "low"
            ? "Low"
            : marker.value === "steady"
              ? "Steady"
              : "Full";
        const name = ring.batteryId.replaceAll("_", " ");
        conflicts.push(
          `Your ${name} battery usually reads ${usual}. Today you marked it ${today}.`,
        );
      }
    }
  }
  const conflictNote =
    conflicts.length > 0
      ? `${conflicts.join(" ")} Battery rings use Full Assessment; markers use today’s Scan — they are shown separately and never merged.`
      : null;

  void allBatteryIds;
  return {
    batteryRings,
    scanMarkers,
    recommendedBatteryToday,
    declaredDrivingMode,
    suggestedDrivingMode,
    overchargeFlag,
    drainSessionIntervention,
    conflictNote,
  };
}

/**
 * Authority write guards — used by tests and API to prove no cross-instrument writes.
 */
export function assertInstrumentWriteAllowed(
  instrumentId: string,
  field: string,
): boolean {
  const allowed: Record<string, string[]> = {
    drain_check: ["drain_session_intervention"],
    battery_scan: ["scan_markers", "recommended_battery_today"],
    full_assessment: [
      "battery_rings",
      "overcharge_flag",
      "suggested_driving_mode",
    ],
    weekly_mode_check: ["declared_driving_mode"],
  };
  return (allowed[instrumentId] ?? []).includes(field);
}
