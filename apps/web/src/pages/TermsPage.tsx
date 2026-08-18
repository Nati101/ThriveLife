import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";

export function TermsPage() {
  return (
    <article className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Legal · DRAFT"
        title="Terms of use"
        description="Placeholder copy pending Joel and legal counsel. Not a contract."
      />
      <div className="rounded-xl border border-amber-200 bg-warn-soft px-4 py-3 text-sm text-fixture">
        DRAFT — required in-app surface only. Do not present this as binding
        terms until legal has signed off.
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-foreground">
        <p>
          ThriveLife is not a diagnosis, treatment, or emergency service. It
          does not replace a qualified professional. If you are in immediate
          danger, use local emergency services.
        </p>
        <p>
          Version 1 uses fixture assessment wording until Joel’s item bank,
          recharge library, and interpretation copy replace it. Scores are
          provisional expert-judgment thresholds, not validated psychometric
          claims.
        </p>
        <p>
          Accounts are for adults 18+. See the{" "}
          <Link
            to="/privacy-policy"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            privacy policy (draft)
          </Link>{" "}
          and{" "}
          <Link to="/support" className="font-medium text-primary underline-offset-2 hover:underline">
            always-available support
          </Link>
          .
        </p>
      </div>
      <SupportFooter />
    </article>
  );
}
