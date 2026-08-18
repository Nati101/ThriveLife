import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { deleteMyData, exportMyData, fetchPrivacy, savePrivacy } from "@/lib/member-api";

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
        <ul className="space-y-3 rounded-xl border border-border bg-white p-5 text-sm">
          {(
            [
              ["notificationsEnabled", "Optional reminders"],
              ["aiFeaturesEnabled", "AI features (none in V1 — control reserved)"],
              ["anonymousAnalytics", "Anonymous usage analytics"],
              ["futureTeamShare", "Future team share (stub)"],
            ] as const
          ).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span>{label}</span>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1 text-xs"
                onClick={() => void toggle(key)}
              >
                {settings[key] ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => void onExport()}
        >
          Export my data
        </button>
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm"
          onClick={() => {
            if (confirm("Delete all local ThriveLife data for this stub user?")) {
              void deleteMyData().then(() => setMessage("Deleted."));
            }
          }}
        >
          Delete my data
        </button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
      <p className="text-xs text-muted-foreground">
        Privacy policy and Terms are Legal deliverables before beta. Alberta PIPA /
        PIPEDA review is still required. Hosting target: Canada Central.
      </p>
      <SupportFooter />
    </div>
  );
}
