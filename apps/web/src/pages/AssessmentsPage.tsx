import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { InstrumentDefinition, InstrumentId } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";

const routes: Record<InstrumentId, string> = {
  drain_check: "/assessments/drain-check",
  battery_scan: "/assessments/battery-scan",
  full_assessment: "/assessments/full-assessment",
  weekly_mode_check: "/assessments/weekly-mode-check",
};

type Row = {
  instrument: InstrumentDefinition;
  itemCount: number;
};

export function AssessmentsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ids = Object.keys(routes) as InstrumentId[];
        const loaded = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/assessments/instruments/${id}`, {
              credentials: "same-origin",
            });
            if (!res.ok) throw new Error(`Failed to load ${id}`);
            const data = (await res.json()) as {
              instrument: InstrumentDefinition;
              items: unknown[];
            };
            return {
              instrument: data.instrument,
              itemCount: data.items.length,
            };
          }),
        );
        if (!cancelled) setRows(loaded);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Instruments"
        title="Four coordinated assessments"
        description="One authoritative source per dashboard element. No blending between instruments. Items load from the JSON content store."
      />
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {!rows ? (
        <p className="text-sm text-muted-foreground">Loading instruments…</p>
      ) : (
        <ul className="space-y-4">
          {rows.map(({ instrument, itemCount }) => (
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
                    {itemCount} active items · {instrument.completionSecondsHint} ·{" "}
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
          ))}
        </ul>
      )}
    </div>
  );
}
