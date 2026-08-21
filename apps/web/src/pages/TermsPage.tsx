import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { Card } from "@/components/ui/card";

export function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Terms of use"
        description="How to use ThriveLife responsibly. This surface is product-ready; counsel sign-off is still pending."
      />

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">What ThriveLife is</h2>
        <p>
          A capacity-navigation and self-reflection tool. It is not a diagnosis,
          treatment, or emergency service. It does not replace a qualified
          professional. If you are in immediate danger, use local emergency
          services.
        </p>
      </Card>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">Who it is for</h2>
        <p>
          Adults 18 and older. Teen accounts, workplace teams, and coaching
          pathways are out of Version 1.
        </p>
      </Card>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">Content status</h2>
        <p>
          Version 1 may show fixture assessment wording until Joel’s item bank,
          recharge library, and interpretation copy replace it. Thresholds are
          provisional expert judgment — not validated psychometric claims.
        </p>
      </Card>

      <Card className="space-y-4 text-sm leading-relaxed text-foreground">
        <h2 className="text-lg font-semibold text-gray-800">Related</h2>
        <p>
          See the{" "}
          <Link
            to="/privacy-policy"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            privacy policy
          </Link>{" "}
          and{" "}
          <Link
            to="/support"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            always-available support
          </Link>
          .
        </p>
      </Card>

      <p className="text-xs text-muted-foreground">
        Pending counsel review. Not a binding contract until legal has signed
        off.
      </p>
      <SupportFooter />
    </article>
  );
}
