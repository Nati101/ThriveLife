import { useEffect, useState } from "react";
import { FIXTURE_BATTERIES, TUNE_UP_SUPPORT_ACTIONS } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { createTuneUp, fetchTuneUps, reviewTuneUp } from "@/lib/member-api";

export function TuneUpPage() {
  const [tuneUps, setTuneUps] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [batteryId, setBatteryId] = useState("physical");
  const [interval, setInterval] = useState(30);
  const [warningLight, setWarningLight] = useState("");
  const [winDefinition, setWinDefinition] = useState("");
  const [supportAction, setSupportAction] = useState(TUNE_UP_SUPPORT_ACTIONS[0]);

  async function reload() {
    const row = await fetchTuneUps();
    setTuneUps(row.tuneUps as Array<Record<string, unknown>>);
  }

  useEffect(() => {
    void reload().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : "Failed to load"),
    );
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Tune-Up"
        title="One Battery Tune-Up"
        description="30 / 60 / 90 days on a single battery. Requires a completed Full Assessment."
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <form
        className="space-y-3 rounded-xl border border-border bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void createTuneUp({
            batteryId,
            interval,
            warningLight,
            supportAction,
            winDefinition,
          })
            .then(() => reload())
            .catch((err: unknown) =>
              setError(err instanceof Error ? err.message : "Could not create"),
            );
        }}
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Name the recurring warning light.</li>
          <li>Pick the battery that would reduce the most friction if supported.</li>
          <li>Choose a daily action that works on a hard day.</li>
          <li>Choose one support action.</li>
          <li>Select 30 / 60 / 90 days.</li>
          <li>Define the win: what would become a little easier?</li>
        </ol>
        <input
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Warning light"
          value={warningLight}
          onChange={(e) => setWarningLight(e.target.value)}
          required
        />
        <select
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          value={batteryId}
          onChange={(e) => setBatteryId(e.target.value)}
        >
          {FIXTURE_BATTERIES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          value={supportAction}
          onChange={(e) => setSupportAction(e.target.value as typeof supportAction)}
        >
          {TUNE_UP_SUPPORT_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {action.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
        >
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
        </select>
        <input
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="What would become a little easier?"
          value={winDefinition}
          onChange={(e) => setWinDefinition(e.target.value)}
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Start Tune-Up
        </button>
      </form>

      <ul className="space-y-3">
        {tuneUps.map((row) => (
          <li key={String(row.id)} className="rounded-xl border border-border bg-white p-4 text-sm">
            <p className="font-semibold text-gray-800">
              {String(row.batteryId)} · {String(row.interval)} days
            </p>
            <p className="text-muted-foreground">{String(row.warningLight)}</p>
            <button
              type="button"
              className="mt-2 rounded-lg border border-border px-3 py-1 text-xs"
              onClick={() =>
                void reviewTuneUp(String(row.id), {
                  choice: "continue",
                  whatBecameEasier: "Noted in review",
                }).then(() => reload())
              }
            >
              Log 30/60/90 review
            </button>
          </li>
        ))}
      </ul>
      <SupportFooter />
    </div>
  );
}
