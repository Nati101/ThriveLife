import { InstrumentSessionView } from "@/components/InstrumentSessionView";

export function FullAssessmentPage() {
  return (
    <InstrumentSessionView
      instrumentId="full_assessment"
      eyebrow="Full Assessment"
      title="Past two weeks · Capacity, Strain, Recharge"
      description="Scores from admin ScoringThreshold config. Three dimensions stay separate. Overcharge is a flag, not a state. Min 14 days between administrations."
    />
  );
}
