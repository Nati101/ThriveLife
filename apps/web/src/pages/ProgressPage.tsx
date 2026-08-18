import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { fetchDashboard } from "@/lib/member-api";

export function ProgressPage() {
  const [charts, setCharts] = useState<{
    assessmentSnapshots: Array<{ completedAt: string | null; version: number }>;
    checkInSeries: Array<{ date: string; completion: string }>;
  } | null>(null);

  useEffect(() => {
    void fetchDashboard().then((row) => {
      setCharts(row.charts as typeof charts);
    });
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Progress"
        title="Two charts, never one axis"
        description="Full Assessment snapshots stay discrete. Daily Check-In is a separate continuous series. No numeric deltas until SEM is validated."
      />
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-800">
          Chart A — Full Assessment snapshots
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(charts?.assessmentSnapshots ?? []).length === 0 ? (
            <li className="text-muted-foreground">No snapshots yet.</li>
          ) : (
            charts?.assessmentSnapshots.map((row) => (
              <li key={`${row.completedAt}-${row.version}`}>
                {row.completedAt?.slice(0, 10)} · version {row.version} · state
                labels only
              </li>
            ))
          )}
        </ul>
      </section>
      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-800">
          Chart B — Daily Check-In
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(charts?.checkInSeries ?? []).length === 0 ? (
            <li className="text-muted-foreground">No check-ins yet.</li>
          ) : (
            charts?.checkInSeries.map((row) => (
              <li key={row.date}>
                {row.date} · {row.completion}
              </li>
            ))
          )}
        </ul>
      </section>
      <SupportFooter />
    </div>
  );
}
