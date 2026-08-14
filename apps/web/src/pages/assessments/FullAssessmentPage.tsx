import {
  FIXTURE_BATTERIES,
  FIXTURE_FULL_ASSESSMENT_ITEMS,
} from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";

export function FullAssessmentPage() {
  const byBattery = FIXTURE_BATTERIES.map((battery) => ({
    battery,
    items: FIXTURE_FULL_ASSESSMENT_ITEMS.filter(
      (item) => item.batteryId === battery.id,
    ),
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Full Assessment"
        title="Past two weeks · 56 fixture items"
        description="Capacity ×3, Strain ×3, Recharge ×2 per battery. Unsure/N/A store as null — never midpoint."
      />
      <p className="mb-6 text-sm text-muted-foreground">
        Showing item counts per battery for scaffold verification. Interactive
        session UI arrives in Phase 3.
      </p>
      <ul className="space-y-4">
        {byBattery.map(({ battery, items }) => (
          <li
            key={battery.id}
            className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
          >
            <p className="font-semibold text-gray-800">{battery.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} fixture items · first: {items[0]?.wording}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
