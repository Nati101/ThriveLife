import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { Card } from "@/components/ui/card";

export function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Privacy policy"
        description="How ThriveLife treats your answers, scores, and notes. This surface is product-ready; counsel sign-off is still pending."
      />

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">What we collect</h2>
        <p>
          Assessment answers, battery states, driving mode, check-ins, optional
          journal notes, tune-ups, and privacy preferences. Notes are stored as
          text only — never scanned by NLP for risk.
        </p>
      </Card>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">How it is used</h2>
        <p>
          Data powers your personal dashboard: notice, match, and respond. It is
          private by default. Optional reminders stay off unless you enable them.
        </p>
      </Card>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">Your controls</h2>
        <p>
          Export or delete from{" "}
          <Link
            to="/privacy"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Privacy controls
          </Link>
          . On this static demo, data stays in your browser unless cloud keys are
          configured.
        </p>
      </Card>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">Hosting intent</h2>
        <p>
          Intended region is Canada Central. Encryption, retention, subprocessors,
          and cross-border transfers will be finalized with legal review before
          beta.
        </p>
      </Card>

      <p className="text-xs text-muted-foreground">
        Pending counsel review (Alberta PIPA / PIPEDA). Not a finished privacy
        notice for production beta.
      </p>
      <SupportFooter />
    </article>
  );
}
