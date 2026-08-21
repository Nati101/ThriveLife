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

      {user.isContentOwner ? (
        <p
          className="mb-6 rounded-lg border border-border bg-brand-soft px-4 py-3 text-sm text-foreground"
          role="status"
        >
          Content owner access is active. Edit assessment items and recharge
          copy below, then move drafts through review → publish. See{" "}
          <span className="font-medium">docs/CONTENT-PACKAGE.md</span> for the
          object map Joel replaces.
        </p>
      ) : null}

      <PageHeader
        eyebrow="Content tools"
        title="Admin hub"
        description={`Signed in as ${roleLabel(user.role)}${
          user.isContentOwner ? " (content owner)" : ""
        }. Same web app — role-gated routes, not a separate admin deploy.`}
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
          Live CRUD for constructs, items, recharge actions, and response
          scales — replace fixture wording with Joel’s package here.
        </PlaceholderPanel>
        <PlaceholderPanel
          title="Copy & lookups"
          href="/admin/copy"
          linkLabel="Open copy"
        >
          Result / safety / notification copy plus the recommendation lookup
          table. Publish without a code release.
        </PlaceholderPanel>
        <PlaceholderPanel
          title="Scoring thresholds"
          href="/admin/thresholds"
          linkLabel="Open thresholds"
        >
          Admin-only editable §4.3 values with audit log. Never hard-code bounds
          in scorers.
        </PlaceholderPanel>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Account / invite:{" "}
        <Link
          to="/auth?access=content"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Account
        </Link>
        {import.meta.env.DEV ? (
          <>
            {" "}
            or{" "}
            <Link
              to="/dev/role"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              /dev/role
            </Link>
          </>
        ) : null}
        .
      </p>
    </div>
  );
}
