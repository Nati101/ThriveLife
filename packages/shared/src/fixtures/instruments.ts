import type { InstrumentDefinition, ResponseScale } from "../instruments";

/**
 * FIXTURE — instrument metadata from spec §3.1.
 * Item banks below are placeholders until Joel's content package arrives.
 */
export const FIXTURE_INSTRUMENTS: InstrumentDefinition[] = [
  {
    id: "drain_check",
    name: "DRAIN Check",
    description:
      "Quick read of whether demands are exceeding capacity right now. Session-only — does not write battery states.",
    timeframe: "moment",
    approximateItemCount: 10,
    completionSecondsHint: "30–60 sec",
    dashboardAuthority: "Immediate intervention priority for this session only",
  },
  {
    id: "battery_scan",
    name: "Battery Scan",
    description:
      "Rate each Life Battery Low / Steady / Full / Unsure. Authors today's recommended battery (stale after 18 hours).",
    timeframe: "moment",
    approximateItemCount: 8,
    completionSecondsHint: "30–60 sec",
    dashboardAuthority: "Today’s battery + recharge focus (18h)",
  },
  {
    id: "full_assessment",
    name: "Full Assessment",
    description:
      "Past-two-weeks Capacity, Strain, and Recharge Skill across all seven batteries (56 items). Min 14 days between administrations.",
    timeframe: "two_week",
    approximateItemCount: 56,
    completionSecondsHint: "8–12 min",
    dashboardAuthority: "Battery states, overcharge flag, Tune-Up (90d)",
  },
  {
    id: "weekly_mode_check",
    name: "Weekly Mode Check",
    description:
      "User-declared Driving Mode for the week. Authoritative for mode; suggested mode is advisory only.",
    timeframe: "this_week",
    approximateItemCount: 1,
    completionSecondsHint: "~10 sec",
    dashboardAuthority: "Declared Driving Mode (7d)",
  },
];

export const FIXTURE_RESPONSE_SCALES: ResponseScale[] = [
  {
    id: "scale_drain_yes_somewhat_no",
    name: "DRAIN Yes / Somewhat / No",
    labels: ["No", "Somewhat", "Yes"],
    storedType: "integer",
    minValue: 0,
    maxValue: 2,
  },
  {
    id: "scale_scan_level",
    name: "Battery Scan level",
    labels: ["Low", "Steady", "Full", "Unsure"],
    storedType: "enum",
    minValue: null,
    maxValue: null,
  },
  {
    id: "scale_frequency_0_4",
    name: "Frequency 0–4 + N/A",
    labels: [
      "0 Not at all",
      "1 Rarely",
      "2 Sometimes",
      "3 Often",
      "4 Almost always",
      "N/A",
    ],
    storedType: "integer",
    minValue: 0,
    maxValue: 4,
  },
  {
    id: "scale_driving_mode",
    name: "Driving Mode",
    labels: ["Green", "Yellow", "Red", "Unsure"],
    storedType: "enum",
    minValue: null,
    maxValue: null,
  },
];
