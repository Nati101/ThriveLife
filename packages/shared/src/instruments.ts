/** Four coordinated assessment instruments (spec §3.1). */
export const INSTRUMENT_IDS = [
  "drain_check",
  "battery_scan",
  "full_assessment",
  "weekly_mode_check",
] as const;

export type InstrumentId = (typeof INSTRUMENT_IDS)[number];

export const INSTRUMENT_TIMEFRAMES = ["moment", "two_week", "this_week"] as const;

export type InstrumentTimeframe = (typeof INSTRUMENT_TIMEFRAMES)[number];

export type InstrumentDefinition = {
  id: InstrumentId;
  name: string;
  description: string;
  timeframe: InstrumentTimeframe;
  /** Approximate item count from spec; fixtures may differ slightly. */
  approximateItemCount: number;
  completionSecondsHint: string;
  /** What this instrument is allowed to author on the dashboard. */
  dashboardAuthority: string;
};

export type ResponseScaleStoredType = "integer" | "enum";

export type ResponseScale = {
  id: string;
  name: string;
  labels: string[];
  storedType: ResponseScaleStoredType;
  minValue: number | null;
  maxValue: number | null;
};

export type ScoringDirection = "higher_is_more_capacity" | "higher_is_more_strain" | "higher_is_more_skill";

export type AssessmentItem = {
  id: string;
  constructId: string;
  instrumentId: InstrumentId;
  batteryId: string | null;
  timeframe: "moment" | "two_week";
  wording: string;
  responseScaleId: string;
  scoringDirection: ScoringDirection | null;
  version: number;
  active: boolean;
  workflowStatus?: import("./workflow").WorkflowStatus;
  /** True for placeholder wording until Joel's content package lands. */
  isFixture: boolean;
};

export type Construct = {
  id: string;
  batteryId: string;
  dimension: "capacity" | "strain" | "recharge" | "mode";
  subconstruct: string | null;
  definition: string;
  bookChapterRef: string | null;
  workflowStatus?: import("./workflow").WorkflowStatus;
  isFixture: boolean;
};
