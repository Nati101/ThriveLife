import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BatteryIcon } from "@/components/BatteryVisual";
import { buttonClassName } from "@/components/ui/button-styles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/Toast";
import { continueAsDemoAccount, getSessionUser } from "@/lib/auth";
import { seedDemoProfile } from "@/lib/demo-seed";
import { friendlyError } from "@/lib/friendly-error";
import { FIXTURE_BATTERIES } from "@thrivelife/shared";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd5a726e4_ChatGPTImageAug18202508_03_05PM.png";

export function HomePage() {
  const [params] = useSearchParams();
  const denied = params.get("denied");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const user = getSessionUser();

  async function loadDemo() {
    setSeeding(true);
    try {
      if (!user.isDemo) {
        continueAsDemoAccount({ displayName: "Demo Member", role: "user" });
      }
      await seedDemoProfile();
      toast("Demo profile ready — open the dashboard.");
      navigate("/dashboard");
    } catch (err) {
      toast(friendlyError(err, "Could not load the demo profile."));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-12">
      {denied ? (
        <p
          className="rounded-lg border border-border bg-warn-soft px-4 py-3 text-sm text-fixture"
          role="status"
        >
          That area needs an editor, reviewer, or admin role. Sign in or switch
          role from Account, then try again.
        </p>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white via-sky-50/80 to-slate-100 px-6 py-10 shadow-sm md:px-10 md:py-14">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-2xl"
          aria-hidden
        />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt=""
              className="h-14 w-14 object-contain"
            />
            <p className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
              ThriveLife
            </p>
          </div>
          <h1 className="mt-6 text-2xl font-semibold leading-snug text-gray-800 md:text-3xl">
            Notice what is draining you. Take the next right step to recharge.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            A capacity-navigation tool — not a habit tracker, mood diary, or
            clinical product. Start with a short scan, then one Pit Stop.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/onboarding" className={buttonClassName()}>
              Start onboarding
            </Link>
            <Link
              to="/dashboard"
              className={buttonClassName({ variant: "outline" })}
            >
              Open dashboard
            </Link>
            <Button
              variant="ghost"
              disabled={seeding}
              onClick={() => void loadDemo()}
            >
              {seeding ? "Loading demo…" : "Load demo profile"}
            </Button>
          </div>
        </div>
      </section>

      <section>
        <PageHeader
          level={2}
          title="Seven Life Batteries"
          description="Each battery is read on Capacity, Strain, and Recharge Skill — never averaged into one score."
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {FIXTURE_BATTERIES.map((battery, index) => (
            <li
              key={battery.id}
              className={`card-reveal card-reveal-delay-${Math.min(index, 3)}`}
            >
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
    </div>
  );
}
