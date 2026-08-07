import Link from "next/link";
import { FIXTURE_INSTRUMENTS, FIXTURE_ALL_ITEMS } from "@thrivelife/shared";
import { PageHeader } from "@/components/page-header";

const routes: Record<string, string> = {
  drain_check: "/assessments/drain-check",
  battery_scan: "/assessments/battery-scan",
  full_assessment: "/assessments/full-assessment",
  weekly_mode_check: "/assessments/weekly-mode-check",
};

export default function AssessmentsPage() {
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
              className="rounded-2xl border border-border bg-card/90 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-foreground">
                    {instrument.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    {instrument.description}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {count} fixture items · {instrument.completionSecondsHint} ·{" "}
                    {instrument.dashboardAuthority}
                  </p>
                </div>
                <Link
                  href={routes[instrument.id]}
                  className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
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
