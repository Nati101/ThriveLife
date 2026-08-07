import Link from "next/link";
import { getSessionUser, roleLabel } from "@/lib/auth/session";
import { canAccessContentTools } from "@thrivelife/shared";
import { FixtureBanner } from "@/components/fixture-banner";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/check-in", label: "Check-in" },
  { href: "/assessments", label: "Assessments" },
  { href: "/onboarding", label: "Onboarding" },
] as const;

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const showAdmin = canAccessContentTools(user.role);

  return (
    <div className="min-h-screen">
      <FixtureBanner />
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="group">
            <span className="font-display text-2xl tracking-tight text-brand">
              ThriveLife
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Capacity navigation
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {memberLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-foreground/80 transition hover:bg-brand-soft hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
            {showAdmin ? (
              <Link
                href="/admin"
                className="rounded-md px-3 py-1.5 text-foreground/80 transition hover:bg-brand-soft hover:text-brand"
              >
                Admin
              </Link>
            ) : null}
            <Link
              href="/dev/role"
              className="ml-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand"
              title="Local stub auth — switch role"
            >
              {roleLabel(user.role)}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-sm text-muted">
        <p>
          ThriveLife is a capacity-navigation tool, not a diagnosis or emergency
          service. Support resources will live here before beta.
        </p>
      </footer>
    </div>
  );
}
