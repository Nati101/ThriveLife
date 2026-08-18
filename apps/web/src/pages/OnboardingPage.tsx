import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FIXTURE_BATTERIES } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { acceptConsent, fetchOnboarding, saveOnboarding } from "@/lib/member-api";

const CONTEXT_FIELDS = [
  { key: "season", label: "What season of life are you in?" },
  { key: "transitions", label: "Any major transitions right now?" },
  { key: "caregiving", label: "Caregiving load (if any)?" },
  { key: "health", label: "Health context you want the app to respect?" },
  { key: "schedule", label: "What does a typical day look like?" },
  { key: "energyFocus", label: "Where do you most want energy support?" },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [context, setContext] = useState<Record<string, string>>({});
  const [ageOk, setAgeOk] = useState(false);
  const [consentOk, setConsentOk] = useState(false);

  useEffect(() => {
    void fetchOnboarding().then((row) => {
      const progress = row.progress;
      if (typeof progress.step === "number") setStep(progress.step);
      if (progress.contextAnswers && typeof progress.contextAnswers === "object") {
        setContext(progress.contextAnswers as Record<string, string>);
      }
    });
  }, []);

  async function go(next: number, extra?: Record<string, unknown>) {
    setStep(next);
    await saveOnboarding({ step: next, contextAnswers: context, ...extra });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow={`Onboarding · step ${step} of 8`}
        title="Value first, then depth"
        description="A successful recharge comes before the nine-minute Full Assessment."
      />

      {step === 1 ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <p className="text-lg leading-relaxed text-foreground">
            ThriveLife helps you notice what is draining you and take the next
            right step to recharge.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => void go(2)}
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-xl border border-border bg-white p-5 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is a wellness and self-reflection tool. It is not a diagnosis,
            treatment, or emergency service. Batteries rise and fall. Low is not
            failure — it is a signal to take a pit stop.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
            />
            I confirm I am 18 or older.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consentOk}
              onChange={(e) => setConsentOk(e.target.checked)}
            />
            I understand ThriveLife is not clinical care and I consent to store my
            answers privately.
          </label>
          <button
            type="button"
            disabled={!ageOk || !consentOk}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            onClick={() => {
              void acceptConsent();
              void go(3);
            }}
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4 rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Personalization only — never scored into batteries.
          </p>
          {CONTEXT_FIELDS.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="font-medium text-gray-800">{field.label}</span>
              <input
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                value={context[field.key] ?? ""}
                onChange={(e) =>
                  setContext((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </label>
          ))}
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => void go(4)}
          >
            Continue to Battery Scan
          </button>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Rate each Life Battery Low / Steady / Full. About 45 seconds.
          </p>
          <Link
            to="/assessments/battery-scan"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => void go(5)}
          >
            Open Battery Scan
          </Link>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Provisional dashboard: one battery and a two-minute Pit Stop. Open the
            dashboard, then come back to complete your first recharge.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Provisional dashboard
            </Link>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => void go(6)}
            >
              I have a Pit Stop ready
            </button>
          </div>
        </section>
      ) : null}

      {step === 6 ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Complete the two-minute Pit Stop in real life, then mark it here. This
            is where the product proves itself.
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
            {FIXTURE_BATTERIES.slice(0, 2).map((b) => (
              <li key={b.id}>{b.name} is a common first battery.</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() =>
              void go(7, { firstRechargeCompletedAt: new Date().toISOString() })
            }
          >
            I completed my first recharge
          </button>
        </section>
      ) : null}

      {step === 7 ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Your seven-battery dashboard, driving mode, and tune-up starting point
            — about 9 minutes. You can decline. We’ll re-prompt on Day 3 and Day 7.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/assessments/full-assessment"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => void go(8)}
            >
              Take Full Assessment
            </Link>
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm"
              onClick={() => {
                void go(8, {
                  declinedFullAssessmentAt: new Date().toISOString(),
                });
                navigate("/dashboard");
              }}
            >
              Not now
            </button>
          </div>
        </section>
      ) : null}

      {step === 8 ? (
        <section className="rounded-xl border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Full dashboard + plan when the assessment is complete. Tune-Up still
            requires a Full Assessment.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => {
              void saveOnboarding({
                step: 8,
                completedAt: new Date().toISOString(),
              });
              navigate("/dashboard");
            }}
          >
            Open full dashboard
          </button>
        </section>
      ) : null}

      <SupportFooter />
    </div>
  );
}
