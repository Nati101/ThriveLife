import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { BatteryDefinition } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { SupportFooter } from "@/components/SupportFooter";
import { acceptConsent, fetchDashboard, fetchOnboarding, saveOnboarding } from "@/lib/member-api";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { StepDots } from "@/components/ui/progress";

const CONTEXT_FIELDS = [
  { key: "season", label: "What season of life are you in?" },
  { key: "transitions", label: "Any major transitions right now?" },
  { key: "caregiving", label: "Caregiving load (if any)?" },
  { key: "health", label: "Health context you want the app to respect?" },
  { key: "schedule", label: "What does a typical day look like?" },
  { key: "energyFocus", label: "Where do you most want energy support?" },
] as const;

const STEP_TITLES = [
  "Welcome",
  "Consent",
  "Context",
  "Battery Scan",
  "Provisional dashboard",
  "First recharge",
  "Full Assessment",
  "Dashboard",
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [context, setContext] = useState<Record<string, string>>({});
  const [contextIndex, setContextIndex] = useState(0);
  const [ageOk, setAgeOk] = useState(false);
  const [consentOk, setConsentOk] = useState(false);
  const [batteries, setBatteries] = useState<BatteryDefinition[]>([]);

  useEffect(() => {
    void fetchOnboarding().then((row) => {
      const progress = row.progress;
      if (typeof progress.step === "number") setStep(progress.step);
      if (progress.contextAnswers && typeof progress.contextAnswers === "object") {
        const answers = progress.contextAnswers as Record<string, string>;
        setContext(answers);
        const firstEmpty = CONTEXT_FIELDS.findIndex((field) => !answers[field.key]?.trim());
        setContextIndex(firstEmpty === -1 ? CONTEXT_FIELDS.length - 1 : firstEmpty);
      }
    });
    void fetchDashboard()
      .then((row) => {
        const list = row.batteries as BatteryDefinition[] | undefined;
        if (Array.isArray(list)) setBatteries(list);
      })
      .catch(() => undefined);
  }, []);

  async function go(next: number, extra?: Record<string, unknown>) {
    setStep(next);
    await saveOnboarding({ step: next, contextAnswers: context, ...extra });
  }

  const contextField = CONTEXT_FIELDS[contextIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title={STEP_TITLES[step - 1] ?? "Value first, then depth"}
        description="A successful recharge comes before the nine-minute Full Assessment."
      />
      <StepDots current={step} total={8} label={`Step ${step} of 8`} />

      {step === 1 ? (
        <Card>
          <p className="text-lg leading-relaxed text-foreground">
            ThriveLife helps you notice what is draining you and take the next
            right step to recharge.
          </p>
          <Button className="mt-5" onClick={() => void go(2)}>
            Continue
          </Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is a wellness and self-reflection tool. It is not a diagnosis,
            treatment, or emergency service. Batteries rise and fall. Low is not
            failure — it is a signal to take a pit stop.
          </p>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
            />
            I confirm I am 18 or older.
          </label>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={consentOk}
              onChange={(e) => setConsentOk(e.target.checked)}
            />
            I understand ThriveLife is not clinical care and I consent to store my
            answers privately.
          </label>
          <Button
            disabled={!ageOk || !consentOk}
            onClick={() => {
              void acceptConsent();
              void go(3);
            }}
          >
            Continue
          </Button>
        </Card>
      ) : null}

      {step === 3 && contextField ? (
        <Card className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Personalization only — never scored into batteries. Question{" "}
            {contextIndex + 1} of {CONTEXT_FIELDS.length}.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-800">
              {contextField.label}
            </span>
            <Input
              value={context[contextField.key] ?? ""}
              onChange={(e) =>
                setContext((prev) => ({ ...prev, [contextField.key]: e.target.value }))
              }
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={contextIndex === 0}
              onClick={() => setContextIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
            {contextIndex < CONTEXT_FIELDS.length - 1 ? (
              <Button onClick={() => setContextIndex((i) => i + 1)}>Next</Button>
            ) : (
              <Button onClick={() => void go(4)}>Continue to Battery Scan</Button>
            )}
          </div>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Rate each Life Battery Low / Steady / Full. About 45 seconds.
          </p>
          <Link
            to="/assessments/battery-scan"
            className={`${buttonClassName()} mt-5`}
            onClick={() => void go(5)}
          >
            Open Battery Scan
          </Link>
        </Card>
      ) : null}

      {step === 5 ? (
        <Card>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Provisional dashboard: one battery and a two-minute Pit Stop. Open the
            dashboard, then come back to complete your first recharge.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/dashboard" className={buttonClassName({ variant: "outline" })}>
              Provisional dashboard
            </Link>
            <Button onClick={() => void go(6)}>I have a Pit Stop ready</Button>
          </div>
        </Card>
      ) : null}

      {step === 6 ? (
        <Card>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Complete the two-minute Pit Stop in real life, then mark it here. This
            is where the product proves itself.
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
            {batteries.slice(0, 2).map((b) => (
              <li key={b.id}>{b.name} is a common first battery.</li>
            ))}
          </ul>
          <Button
            className="mt-5"
            onClick={() =>
              void go(7, { firstRechargeCompletedAt: new Date().toISOString() })
            }
          >
            I completed my first recharge
          </Button>
        </Card>
      ) : null}

      {step === 7 ? (
        <Card>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your seven-battery dashboard, driving mode, and tune-up starting point
            — about 9 minutes. You can decline. We’ll re-prompt on Day 3 and Day 7.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/assessments/full-assessment"
              className={buttonClassName()}
              onClick={() => void go(8)}
            >
              Take Full Assessment
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                void go(8, {
                  declinedFullAssessmentAt: new Date().toISOString(),
                });
                navigate("/dashboard");
              }}
            >
              Not now
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 8 ? (
        <Card>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Full dashboard and plan when the assessment is complete. Tune-Up still
            requires a Full Assessment.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              void saveOnboarding({
                step: 8,
                completedAt: new Date().toISOString(),
              });
              navigate("/dashboard");
            }}
          >
            Open full dashboard
          </Button>
        </Card>
      ) : null}

      <SupportFooter />
    </div>
  );
}
