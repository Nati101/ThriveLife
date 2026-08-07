/** Driving Modes control recommendation ceilings (spec §2.5, §6). */
export const DRIVING_MODES = ["green", "yellow", "red"] as const;

export type DrivingMode = (typeof DRIVING_MODES)[number];

export const DRIVING_MODE_OR_UNSURE = [...DRIVING_MODES, "unsure"] as const;

export type DrivingModeOrUnsure = (typeof DRIVING_MODE_OR_UNSURE)[number];

export const DRIVING_MODE_LABELS: Record<DrivingMode, string> = {
  green: "Green",
  yellow: "Yellow",
  red: "Red",
};

export type DrivingModeBehavior = {
  mode: DrivingMode;
  meaning: string;
  /** Max recharge duration offered for this mode, in minutes. */
  durationCeilingMinutes: number;
  planBDefault: boolean;
  suppressNewGoals: boolean;
};

export const DRIVING_MODE_BEHAVIOR: Record<DrivingMode, DrivingModeBehavior> = {
  green: {
    mode: "green",
    meaning: "Capacity generally steady",
    durationCeilingMinutes: 10,
    planBDefault: false,
    suppressNewGoals: false,
  },
  yellow: {
    mode: "yellow",
    meaning: "Several warning lights present",
    durationCeilingMinutes: 5,
    planBDefault: false,
    suppressNewGoals: true,
  },
  red: {
    mode: "red",
    meaning: "Capacity substantially strained",
    durationCeilingMinutes: 2,
    planBDefault: true,
    suppressNewGoals: true,
  },
};

export type DrivingModeRecord = {
  declaredMode: DrivingModeOrUnsure;
  suggestedMode: DrivingMode | null;
  setAt: string;
  source: "weekly_check" | "onboarding" | "daily_check_in" | "dev_fixture";
  /** Declared mode is stale after 7 days (spec §3.2). */
  staleAfterHours: number;
};
