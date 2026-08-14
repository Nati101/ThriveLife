import { InstrumentSessionView } from "@/components/InstrumentSessionView";

export function BatteryScanPage() {
  return (
    <InstrumentSessionView
      instrumentId="battery_scan"
      eyebrow="Battery Scan"
      title="How are the seven batteries right now?"
      description="Low / Steady / Full / Unsure. Authors today’s recommended battery (18h). Does not overwrite Full Assessment states."
    />
  );
}
