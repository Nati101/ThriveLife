import { FIXTURE_SCORING_THRESHOLDS } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";

export function AdminThresholdsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Admin only"
        title="Scoring thresholds"
        description="Provisional expert judgment from spec §4.3. Recalibrate after Stage 1 pilot without a code release."
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/90">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Dimension</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Max</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {FIXTURE_SCORING_THRESHOLDS.map((row) => (
              <tr key={row.id} className="border-b border-border/70">
                <td className="px-4 py-3 capitalize">{row.dimension}</td>
                <td className="px-4 py-3">{row.levelName}</td>
                <td className="px-4 py-3">{row.minValue ?? "—"}</td>
                <td className="px-4 py-3">{row.maxValue ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
