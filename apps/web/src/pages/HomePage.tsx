import { Link, useSearchParams } from "react-router-dom";
import { DRIVING_MODE_BEHAVIOR, FIXTURE_BATTERIES } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { BatteryIcon } from "@/components/BatteryVisual";
import { buttonClassName } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/card";

export function HomePage() {
  const [params] = useSearchParams();
  const denied = params.get("denied");
  const modes = Object.values(DRIVING_MODE_BEHAVIOR);

  return (
    <div className="space-y-10">
      {denied ? (
        <p
          className="rounded-lg border border-border bg-warn-soft px-4 py-3 text-sm text-fixture"
          role="status"
        >
          That area needs an editor, reviewer, or admin role. In local
          development, switch role at /dev/role, then try again.
        </p>
      ) : null}

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome to ThriveLife
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Notice what is draining you. Take the next right step to recharge —
            a capacity-navigation tool, not a habit tracker or clinical product.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard" className={buttonClassName()}>
              Open dashboard
            </Link>
            <Link
              to="/onboarding"
              className={buttonClassName({ variant: "outline" })}
            >
              Start onboarding
            </Link>
          </div>
        </div>
      </section>

      <section>
        <PageHeader
          level={2}
          eyebrow="Domain"
          title="Seven Life Batteries"
          description="Each battery is read on Capacity, Strain, and Recharge Skill — never averaged into one score."
        />
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

      <section>
        <PageHeader
          level={2}
          eyebrow="Driving Modes"
          title="Green, Yellow, Red"
          description="User-declared modes set recommendation ceilings. Suggested mode is advisory only."
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          {modes.map((mode) => (
            <li key={mode.mode}>
              <Card>
                <p className="font-semibold capitalize text-gray-800">
                  {mode.mode}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{mode.meaning}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ceiling: {mode.durationCeilingMinutes} min
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
