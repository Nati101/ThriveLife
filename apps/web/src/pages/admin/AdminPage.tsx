import { Link, useSearchParams } from "react-router-dom";
import { ROLE_PERMISSIONS } from "@thrivelife/shared";
import { getSessionUser, roleLabel } from "@/lib/auth";
import { PageHeader, PlaceholderPanel } from "@/components/PageHeader";

export function AdminPage() {
  const [params] = useSearchParams();
  const user = getSessionUser();
  const perms = ROLE_PERMISSIONS[user.role];

  return (
    <div>
      {params.get("denied") === "admin_only" ? (
        <p
          className="mb-6 rounded-lg border border-border bg-warn-soft px-4 py-3 text-sm text-fixture"
          role="status"
        >
          Thresholds and user management require the admin role.
        </p>
      ) : null}

      <PageHeader
        eyebrow="Content tools"
        title="Admin hub"
        description={`Signed in as stub ${roleLabel(user.role)}. Same web app — role-gated routes, not a separate admin deploy.`}
      />

      <div className="mb-8 rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <p>
          Draft: {perms.canDraftContent ? "yes" : "no"} · Review:{" "}
          {perms.canReviewContent ? "yes" : "no"} · Publish:{" "}
          {perms.canPublishContent ? "yes" : "no"} · Thresholds:{" "}
          {perms.canEditThresholds ? "yes" : "no"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlaceholderPanel
          title="Content library"
          href="/admin/content"
          linkLabel="Open content"
        >
          Batteries, constructs, instruments, items, recharge actions — fixture
          data until Joel’s package lands.
        </PlaceholderPanel>
        <PlaceholderPanel
          title="Scoring thresholds"
          href="/admin/thresholds"
          linkLabel="Open thresholds"
        >
          Admin-only. Provisional §4.3 values must stay editable — never
          hard-coded in scorers.
        </PlaceholderPanel>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link
          to="/dev/role"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Switch local role
        </Link>
      </p>
    </div>
  );
}
