import { Link } from "react-router-dom";
import { FIXTURE_ALL_ITEMS, FIXTURE_INSTRUMENTS } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";

const routes: Record<string, string> = {
  drain_check: "/assessments/drain-check",
  battery_scan: "/assessments/battery-scan",
  full_assessment: "/assessments/full-assessment",
  weekly_mode_check: "/assessments/weekly-mode-check",
};

export function AssessmentsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Instruments"
        title="Four coordinated assessments"
        description="One authoritative source per dashboard element. No blending between instruments."
      />
      <ul className="space-y-4">
        {FIXTURE_INSTRUMENTS.map((instrument) => {
          const count = FIXTURE_ALL_ITEMS.filter(
            (item) => item.instrumentId === instrument.id,
          ).length;
          return (
            <li
              key={instrument.id}
              className="rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {instrument.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {instrument.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {count} fixture items · {instrument.completionSecondsHint} ·{" "}
                    {instrument.dashboardAuthority}
                  </p>
                </div>
                <Link
                  to={routes[instrument.id]}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Open
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
