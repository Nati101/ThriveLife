import { useEffect, useState } from "react";
import { FIXTURE_BATTERIES, TUNE_UP_SUPPORT_ACTIONS } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { createTuneUp, fetchTuneUps, reviewTuneUp } from "@/lib/member-api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Select, labelClassName } from "@/components/ui/field";
import { EmptyState, ErrorState } from "@/components/ui/states";

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
      {error ? <ErrorState message={error} /> : null}
      <form
        className="space-y-4"
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
        <Card className="space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Name the recurring warning light.</li>
            <li>Pick the battery that would reduce the most friction if supported.</li>
            <li>Choose a daily action that works on a hard day.</li>
            <li>Choose one support action.</li>
            <li>Select 30 / 60 / 90 days.</li>
            <li>Define the win: what would become a little easier?</li>
          </ol>
          <label className="block">
            <span className={labelClassName}>Warning light</span>
            <Input
              placeholder="What shows up first when this battery is low?"
              value={warningLight}
              onChange={(e) => setWarningLight(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={labelClassName}>Battery</span>
            <Select
              value={batteryId}
              onChange={(e) => setBatteryId(e.target.value)}
            >
              {FIXTURE_BATTERIES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className={labelClassName}>Support action</span>
            <Select
              value={supportAction}
              onChange={(e) => setSupportAction(e.target.value as typeof supportAction)}
            >
              {TUNE_UP_SUPPORT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className={labelClassName}>Interval</span>
            <Select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </Select>
          </label>
          <label className="block">
            <span className={labelClassName}>Win definition</span>
            <Input
              placeholder="What would become a little easier?"
              value={winDefinition}
              onChange={(e) => setWinDefinition(e.target.value)}
              required
            />
          </label>
          <Button type="submit">Start Tune-Up</Button>
        </Card>
      </form>

      {tuneUps.length === 0 ? (
        <EmptyState title="No Tune-Up yet">
          Start one after a Full Assessment. One battery at a time.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {tuneUps.map((row) => (
            <li key={String(row.id)}>
              <Card>
                <CardTitle className="text-lg">
                  {FIXTURE_BATTERIES.find((b) => b.id === row.batteryId)?.name ??
                    String(row.batteryId)}{" "}
                  · {String(row.interval)} days
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {String(row.warningLight)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    void reviewTuneUp(String(row.id), {
                      choice: "continue",
                      whatBecameEasier: "Noted in review",
                    }).then(() => reload())
                  }
                >
                  Log 30/60/90 review
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <SupportFooter />
    </div>
  );
}
