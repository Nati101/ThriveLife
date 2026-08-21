import { Link, Navigate } from "react-router-dom";
import { BatteryIcon } from "@/components/BatteryVisual";
import { Card } from "@/components/ui/card";
import { buttonClassName } from "@/components/ui/button-styles";
import { isAuthenticated } from "@/lib/auth";
import { FIXTURE_BATTERIES } from "@thrivelife/shared";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd5a726e4_ChatGPTImageAug18202508_03_05PM.png";

/**
 * Public marketing / brand entry. Signed-in users go straight into the app.
 */
export function LandingPage() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-white px-6 py-12 shadow-sm md:px-12 md:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/80 via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="" className="h-16 w-16 object-contain" />
            <p className="text-4xl font-bold tracking-tight text-gray-800 md:text-5xl">
              ThriveLife
            </p>
          </div>
          <h1 className="mt-8 text-2xl font-semibold leading-snug text-gray-800 md:text-3xl">
            Notice what is draining you. Take the smallest effective recharge.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Capacity navigation for adults — not a habit tracker, mood diary,
            or clinical product. Sign in to check batteries, run assessments,
            and follow Plan A or Plan B.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/auth?mode=sign-up" className={buttonClassName()}>
              Get started
            </Link>
            <Link
              to="/auth"
              className={buttonClassName({ variant: "outline" })}
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Ages 18+. Invite / pilot access may apply before public beta.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Seven Life Batteries
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Each battery is read on Capacity, Strain, and Recharge Skill — never
          blended into one score.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FIXTURE_BATTERIES.map((battery) => (
            <li key={battery.id}>
              <Card className="flex items-start gap-3">
                <BatteryIcon name={battery.icon} />
                <div>
                  <p className="font-semibold text-gray-800">{battery.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {battery.thinkOfItAs}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-white px-6 py-8">
        <h2 className="text-lg font-semibold text-gray-800">How it works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Notice",
              body: "A short scan or check-in shows which battery needs attention today.",
            },
            {
              step: "2",
              title: "Choose",
              body: "Plan A or Plan B — the smallest effective recharge for your mode.",
            },
            {
              step: "3",
              title: "Return",
              body: "Practice the return. Nothing is lost when you miss a day.",
            },
          ].map((item) => (
            <li key={item.step} className="space-y-2">
              <p className="text-sm font-semibold text-primary">Step {item.step}</p>
              <p className="font-semibold text-gray-800">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
