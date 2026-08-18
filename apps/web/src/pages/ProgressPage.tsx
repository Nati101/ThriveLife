import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { fetchDashboard } from "@/lib/member-api";
import { Card, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/states";

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

  if (!charts) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Progress"
          title="Two charts, never one axis"
          description="Full Assessment snapshots stay discrete. Daily Check-In is a separate continuous series."
        />
        <LoadingState label="Loading progress…" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Progress"
        title="Two charts, never one axis"
        description="Full Assessment snapshots stay discrete. Daily Check-In is a separate continuous series. No numeric deltas until SEM is validated."
      />
      <Card>
        <CardTitle>Chart A — Full Assessment snapshots</CardTitle>
        {(charts.assessmentSnapshots ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No snapshots yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {charts.assessmentSnapshots.map((row) => (
              <li
                key={`${row.completedAt}-${row.version}`}
                className="rounded-lg border border-border bg-gray-50 px-3 py-2"
              >
                {row.completedAt?.slice(0, 10)} · version {row.version} · state
                labels only
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardTitle>Chart B — Daily Check-In</CardTitle>
        {(charts.checkInSeries ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No check-ins yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {charts.checkInSeries.map((row) => (
              <li
                key={row.date}
                className="rounded-lg border border-border bg-gray-50 px-3 py-2"
              >
                {row.date} · {row.completion.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <SupportFooter />
    </div>
  );
}
