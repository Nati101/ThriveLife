import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { fetchDashboard } from "@/lib/member-api";
import { Card, CardTitle } from "@/components/ui/card";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { buttonClassName } from "@/components/ui/button-styles";

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

  const hasSnapshots = (charts.assessmentSnapshots ?? []).length > 0;
  const hasCheckIns = (charts.checkInSeries ?? []).length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Progress"
        title="Two charts, never one axis"
        description="Full Assessment snapshots stay discrete. Daily Check-In is a separate continuous series. No numeric deltas until SEM is validated."
      />
      <Card className="card-reveal">
        <CardTitle>Chart A — Full Assessment snapshots</CardTitle>
        {!hasSnapshots ? (
          <div className="mt-3">
            <EmptyState
              title="No snapshots yet"
              action={
                <Link
                  to="/assessments/full-assessment"
                  className={buttonClassName({ size: "sm" })}
                >
                  Take Full Assessment
                </Link>
              }
            >
              Each completed Full Assessment becomes a discrete point — never
              mixed with check-ins.
            </EmptyState>
          </div>
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
      <Card className="card-reveal card-reveal-delay-1">
        <CardTitle>Chart B — Daily Check-In</CardTitle>
        {!hasCheckIns ? (
          <div className="mt-3">
            <EmptyState
              title="No check-ins yet"
              action={
                <Link to="/check-in" className={buttonClassName({ size: "sm" })}>
                  Log a check-in
                </Link>
              }
            >
              Completion days appear here as their own series.
            </EmptyState>
          </div>
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
