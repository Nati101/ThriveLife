import Link from "next/link";
import { FIXTURE_BATTERIES, DRIVING_MODE_BEHAVIOR } from "@thrivelife/shared";
import { PageHeader } from "@/components/page-header";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const params = await searchParams;
  const modes = Object.values(DRIVING_MODE_BEHAVIOR);

  return (
    <div>
      {params.denied ? (
        <p
          className="mb-6 rounded-lg border border-border bg-warn-soft px-4 py-3 text-sm text-fixture"
          role="status"
        >
          That area needs an editor, reviewer, or admin role. Switch role under
          Dev → Role, then try again.
        </p>
      ) : null}

      <section className="mb-12">
        <p className="font-display text-5xl tracking-tight text-brand sm:text-6xl">
          ThriveLife
        </p>
        <h1 className="mt-4 max-w-xl font-display text-2xl leading-snug text-foreground sm:text-3xl">
          Notice what is draining you. Take the next right step to recharge.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          A capacity-navigation web app — not a habit tracker, mood diary, or
          clinical tool. Low power calls for a pit stop, not more pressure.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open dashboard
          </Link>
          <Link
            href="/onboarding"
            className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-brand"
          >
            Start onboarding
          </Link>
        </div>
      </section>

      <PageHeader
        eyebrow="Domain"
        title="Seven Life Batteries"
        description="Each battery is read on Capacity, Strain, and Recharge Skill — never averaged into one score."
      />

      <ul className="mb-12 grid gap-3 sm:grid-cols-2">
        {FIXTURE_BATTERIES.map((battery) => (
          <li
            key={battery.id}
            className="rounded-xl border border-border bg-card/80 px-4 py-3"
          >
            <p className="font-medium text-foreground">{battery.name}</p>
            <p className="mt-1 text-sm text-muted">{battery.thinkOfItAs}</p>
          </li>
        ))}
      </ul>

      <PageHeader
        eyebrow="Driving Modes"
        title="Green, Yellow, Red"
        description="User-declared modes set recommendation ceilings. Suggested mode is advisory only."
      />
      <ul className="grid gap-3 sm:grid-cols-3">
        {modes.map((mode) => (
          <li
            key={mode.mode}
            className="rounded-xl border border-border bg-card/80 px-4 py-3"
          >
            <p className="font-medium capitalize text-foreground">{mode.mode}</p>
            <p className="mt-1 text-sm text-muted">{mode.meaning}</p>
            <p className="mt-2 text-xs text-muted">
              Ceiling: {mode.durationCeilingMinutes} min
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
