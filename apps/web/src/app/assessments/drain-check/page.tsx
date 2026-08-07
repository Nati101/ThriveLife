import { FIXTURE_DRAIN_ITEMS } from "@thrivelife/shared";
import { PageHeader } from "@/components/page-header";

export default function DrainCheckPage() {
  return (
    <div>
      <PageHeader
        eyebrow="DRAIN Check"
        title="Right-now capacity warning light"
        description="Session-only intervention trigger. Does not update battery states. Fixture wording only."
      />
      <ol className="space-y-3">
        {FIXTURE_DRAIN_ITEMS.map((item, index) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-card/80 px-4 py-3"
          >
            <p className="text-xs text-fixture">Fixture item {index + 1}</p>
            <p className="mt-1 text-sm text-foreground">{item.wording}</p>
            <div className="mt-3 flex gap-2 text-xs text-muted">
              <span className="rounded border border-border px-2 py-1">Yes</span>
              <span className="rounded border border-border px-2 py-1">
                Somewhat
              </span>
              <span className="rounded border border-border px-2 py-1">No</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
