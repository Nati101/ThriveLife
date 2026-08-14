import { InstrumentSessionView } from "@/components/InstrumentSessionView";

export function DrainCheckPage() {
  return (
    <InstrumentSessionView
      instrumentId="drain_check"
      eyebrow="DRAIN Check"
      title="Right-now capacity warning light"
      description="Session-only intervention trigger. Does not update battery states. Fixture wording only."
    />
  );
}
