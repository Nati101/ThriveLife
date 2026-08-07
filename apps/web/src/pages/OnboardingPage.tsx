import { Link } from "react-router-dom";
import { PageHeader, PlaceholderPanel } from "@/components/PageHeader";

const steps = [
  "Welcome — one-sentence product intro",
  "Explanation — wellness disclaimer & consent",
  "Context questions — personalization only, never scored",
  "Battery Scan",
  "Provisional dashboard — one battery + 2-min Pit Stop",
  "First recharge completion",
  "Full Assessment offer (~9 min); decline allowed",
  "Full dashboard + plan (if assessment taken)",
] as const;

export function OnboardingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Onboarding"
        title="Value first, then depth"
        description="Scaffold for the eight-step flow (spec §7.1). Wired after Scan / Pit Stop / Full Assessment exist."
      />
      <ol className="mb-8 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex gap-3 rounded-xl border border-border bg-card/80 px-4 py-3"
          >
            <span className="font-display text-lg text-brand">{index + 1}</span>
            <span className="text-sm leading-relaxed text-foreground">{step}</span>
          </li>
        ))}
      </ol>
      <PlaceholderPanel
        title="Next in this flow"
        href="/assessments/battery-scan"
        linkLabel="Open Battery Scan (fixture)"
      >
        Age gate (18+) and consent capture land later. This route keeps the
        product loop navigable now.
      </PlaceholderPanel>
      <p className="mt-6 text-sm text-muted">
        <Link
          to="/dashboard"
          className="text-brand underline-offset-2 hover:underline"
        >
          Skip to dashboard
        </Link>
      </p>
    </div>
  );
}
