import { InstrumentSessionView } from "@/components/InstrumentSessionView";

export function WeeklyModeCheckPage() {
  return (
    <InstrumentSessionView
      instrumentId="weekly_mode_check"
      eyebrow="Weekly Mode Check"
      title="Declare this week’s Driving Mode"
      description="User-declared mode is authoritative (stale after 7 days). Suggested mode from Full Assessment signal-count is advisory only."
    />
  );
}
