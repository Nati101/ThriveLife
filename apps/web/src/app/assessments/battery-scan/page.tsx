import { FIXTURE_SCAN_ITEMS, FIXTURE_BATTERIES } from "@thrivelife/shared";
import { PageHeader } from "@/components/page-header";

export default function BatteryScanPage() {
  const nameById = Object.fromEntries(
    FIXTURE_BATTERIES.map((b) => [b.id, b.name]),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Battery Scan"
        title="How are the seven batteries right now?"
        description="Low / Steady / Full / Unsure. Unsure gets one follow-up. Authors today’s recommended battery (18h). Does not overwrite Full Assessment states."
      />
      <ul className="space-y-3">
        {FIXTURE_SCAN_ITEMS.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border bg-card/80 px-4 py-3"
          >
            <p className="text-sm font-medium text-foreground">
              {item.batteryId ? nameById[item.batteryId] : "Battery"}
            </p>
            <p className="mt-1 text-sm text-muted">{item.wording}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
              {["Low", "Steady", "Full", "Unsure"].map((label) => (
                <span
                  key={label}
                  className="rounded border border-border px-2 py-1"
                >
                  {label}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
