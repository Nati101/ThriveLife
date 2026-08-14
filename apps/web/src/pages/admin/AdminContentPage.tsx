import {
  FIXTURE_ALL_ITEMS,
  FIXTURE_BATTERIES,
  FIXTURE_CONSTRUCTS,
  FIXTURE_INSTRUMENTS,
  FIXTURE_RECHARGE_ACTIONS,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";

export function AdminContentPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Editor / reviewer"
        title="Content library (fixtures)"
        description="CRUD UI and versioning land in Phase 2. Counts below prove shared fixtures load in the admin surface."
      />
      <dl className="mb-8 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Batteries", FIXTURE_BATTERIES.length],
            ["Constructs", FIXTURE_CONSTRUCTS.length],
            ["Instruments", FIXTURE_INSTRUMENTS.length],
            ["Items", FIXTURE_ALL_ITEMS.length],
            ["Recharge actions", FIXTURE_RECHARGE_ACTIONS.length],
          ] as const
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
          >
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="text-2xl font-bold text-gray-800">{count}</dd>
          </div>
        ))}
      </dl>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {FIXTURE_RECHARGE_ACTIONS.map((action) => (
          <li
            key={action.id}
            className="rounded-lg border border-border bg-white px-3 py-2 shadow-sm"
          >
            <span className="text-fixture">[FIXTURE]</span> {action.id} ·{" "}
            {action.durationTier} · Plan A / Plan B present
          </li>
        ))}
      </ul>
    </div>
  );
}
