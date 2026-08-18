import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { InstrumentDefinition, InstrumentId } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { fetchInstrumentBootstrap } from "@/lib/assessment-api";
import { buttonClassName } from "@/components/ui/button-styles";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";

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
            const data = await fetchInstrumentBootstrap(id);
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
        description="One authoritative source per dashboard element. No blending between instruments."
      />
      {error ? <ErrorState message={error} /> : null}
      {!rows ? (
        <LoadingState label="Loading instruments…" />
      ) : (
        <ul className="space-y-4">
          {rows.map(({ instrument, itemCount }) => (
            <li key={instrument.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 max-w-2xl">
                    <CardTitle>{instrument.name}</CardTitle>
                    <CardDescription>{instrument.description}</CardDescription>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {itemCount} questions · {instrument.completionSecondsHint}
                    </p>
                  </div>
                  <Link
                    to={routes[instrument.id]}
                    className={buttonClassName()}
                  >
                    Open
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
