import {
  FIXTURE_BATTERIES,
  FIXTURE_INSTRUMENTS,
  FIXTURE_ALL_ITEMS,
  FIXTURE_RECHARGE_ACTIONS,
  FIXTURE_CONSTRUCTS,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/page-header";

export default function AdminContentPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Editor / reviewer"
        title="Content library (fixtures)"
        description="CRUD UI and versioning land in Phase 2. Counts below prove shared fixtures load in the admin surface."
      />
      <dl className="mb-8 grid gap-3 sm:grid-cols-2">
        {[
          ["Batteries", FIXTURE_BATTERIES.length],
          ["Constructs", FIXTURE_CONSTRUCTS.length],
          ["Instruments", FIXTURE_INSTRUMENTS.length],
          ["Items", FIXTURE_ALL_ITEMS.length],
          ["Recharge actions", FIXTURE_RECHARGE_ACTIONS.length],
        ].map(([label, count]) => (
          <div
            key={label as string}
            className="rounded-xl border border-border bg-card/80 px-4 py-3"
          >
            <dt className="text-xs uppercase tracking-wide text-muted">
              {label}
            </dt>
            <dd className="font-display text-2xl text-foreground">{count}</dd>
          </div>
        ))}
      </dl>
      <ul className="space-y-2 text-sm text-muted">
        {FIXTURE_RECHARGE_ACTIONS.map((action) => (
          <li
            key={action.id}
            className="rounded-lg border border-border bg-card/70 px-3 py-2"
          >
            <span className="text-fixture">[FIXTURE]</span> {action.id} ·{" "}
            {action.durationTier} · Plan A / Plan B present
          </li>
        ))}
      </ul>
    </div>
  );
}
