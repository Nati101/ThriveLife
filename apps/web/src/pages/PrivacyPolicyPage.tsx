import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";

export function PrivacyPolicyPage() {
  return (
    <article className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Legal · DRAFT"
        title="Privacy policy"
        description="Placeholder copy pending Joel and legal counsel. Not a PIPA/PIPEDA sign-off."
      />
      <div className="rounded-xl border border-amber-200 bg-warn-soft px-4 py-3 text-sm text-fixture">
        DRAFT — this page exists so the in-app surface required by the spec is
        present. It is not reviewed legal advice and must not be treated as a
        finished privacy policy.
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          ThriveLife is a wellness and self-reflection tool. Assessment answers,
          scores, driving mode, journal notes, check-ins, and tune-ups are
          private by default.
        </p>
        <p>
          Intended hosting region is Canada Central. Encryption, retention,
          subprocessors, and cross-border transfers will be described here after
          legal review (Alberta PIPA / PIPEDA). Until then, treat this as a
          product prototype, not a production privacy notice.
        </p>
        <p>
          You can export or delete data from{" "}
          <Link to="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
            Privacy controls
          </Link>
          . Optional reminders are off unless you turn them on.
        </p>
      </div>
      <SupportFooter />
    </article>
  );
}
