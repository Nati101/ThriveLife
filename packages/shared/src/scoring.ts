/**
 * Scoring threshold config shapes (spec §4.3).
 * Values must live in admin-editable data — never hard-code in scorers.
 */
export type ScoringThreshold = {
  id: string;
  dimension: "capacity" | "strain" | "recharge";
  levelName: string;
  minValue: number | null;
  maxValue: number | null;
  description: string;
  /** Provisional expert judgment until Stage 1 pilot recalibration. */
  isProvisional: boolean;
};

export type CheckInCompletion =
  | "yes"
  | "partly"
  | "not_today"
  | "changed";

export const CHECK_IN_COMPLETION_LABELS: Record<CheckInCompletion, string> = {
  yes: "Yes",
  partly: "Partly",
  not_today: "Not today",
  changed: "I changed the plan",
};
