import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { deleteMyData, exportMyData, fetchPrivacy, savePrivacy } from "@/lib/member-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/states";
import { cn } from "@/components/ui/cn";

export function PrivacyPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchPrivacy().then((row) => setSettings(row.settings));
  }, []);

  async function toggle(key: string) {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    const saved = await savePrivacy(next);
    setSettings(saved.settings);
  }

  async function onExport() {
    const data = await exportMyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thrivelife-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        eyebrow="Privacy"
        title="Private by default"
        description="Assessment answers, scores, mode, journal, completion, and tune-ups stay private unless you share them."
      />
      {settings ? (
        <Card>
          <ul className="space-y-4 text-sm">
            {(
              [
                ["notificationsEnabled", "Optional reminders"],
                ["aiFeaturesEnabled", "AI features (none in V1 — control reserved)"],
                ["anonymousAnalytics", "Anonymous usage analytics"],
                ["futureTeamShare", "Future team share (reserved)"],
              ] as const
            ).map(([key, label]) => {
              const on = Boolean(settings[key]);
              return (
                <li key={key} className="flex items-center justify-between gap-3">
                  <span className="text-gray-800">{label}</span>
                  <button
                    type="button"
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition",
                      on ? "bg-primary" : "bg-gray-200",
                    )}
                    onClick={() => void toggle(key)}
                    aria-pressed={on}
                    aria-label={`${label}: ${on ? "on" : "off"}`}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                        on ? "left-5" : "left-0.5",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <LoadingState label="Loading privacy controls…" />
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void onExport()}>Export my data</Button>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Delete all local ThriveLife data for this account?")) {
              void deleteMyData().then(() => setMessage("Deleted."));
            }
          }}
        >
          Delete my data
        </Button>
      </div>
      {message ? <p className="text-sm text-foreground">{message}</p> : null}
      <p className="text-xs text-muted-foreground">
        Read the{" "}
        <Link
          to="/privacy-policy"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          privacy policy
        </Link>{" "}
        and{" "}
        <Link to="/terms" className="font-medium text-primary underline-offset-2 hover:underline">
          terms of use
        </Link>
        . Legal counsel review (Alberta PIPA / PIPEDA) is still pending. Hosting
        target: Canada Central.
      </p>
      <SupportFooter />
    </div>
  );
}
