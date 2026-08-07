/** Seven Life Batteries — core domain objects (spec §2.2). */
export const BATTERY_IDS = [
  "daily_rhythms",
  "physical",
  "mental",
  "emotional",
  "relational",
  "spiritual",
  "work_daily_purpose",
] as const;

export type BatteryId = (typeof BATTERY_IDS)[number];

export const BATTERY_DIMENSIONS = ["capacity", "strain", "recharge"] as const;

export type BatteryDimension = (typeof BATTERY_DIMENSIONS)[number];

/** Full Assessment battery states (spec §4.4). Overcharge is a flag, not a state. */
export const BATTERY_STATES = [
  "well_charged",
  "steady",
  "strained_but_functioning",
  "low",
] as const;

export type BatteryState = (typeof BATTERY_STATES)[number];

export const BATTERY_STATE_LABELS: Record<BatteryState, string> = {
  well_charged: "Well Charged",
  steady: "Steady",
  strained_but_functioning: "Strained but Functioning",
  low: "Low",
};

export type BatteryDefinition = {
  id: BatteryId;
  name: string;
  /** Short capacity-navigation framing — not clinical. */
  covers: string;
  thinkOfItAs: string;
  displayOrder: number;
  bookChapterRef: string | null;
};

export type DimensionBand =
  | "low"
  | "moderate"
  | "strong"
  | "rising"
  | "elevated";

export type BatteryResultScores = {
  batteryId: BatteryId;
  capacityScore: number | null;
  strainScore: number | null;
  rechargeScore: number | null;
  /** Null when any dimension is insufficient_data. */
  batteryState: BatteryState | null;
  insufficientData: boolean;
};
