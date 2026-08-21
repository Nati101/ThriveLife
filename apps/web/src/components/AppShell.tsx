import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  BookOpen,
  Settings,
  Menu,
  X,
  UserRound,
  HeartHandshake,
  LineChart,
} from "lucide-react";
import {
  getSessionUser,
  roleLabel,
  userCanAccessContentTools,
} from "@/lib/auth";
import { fetchOnboarding } from "@/lib/member-api";
import { PageEnter } from "@/components/PageEnter";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd5a726e4_ChatGPTImageAug18202508_03_05PM.png";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

function isActivePath(pathname: string, href: string, end?: boolean) {
  if (end || href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell() {
  const user = getSessionUser();
  const showAdmin = userCanAccessContentTools();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    void fetchOnboarding()
      .then((row) => {
        const progress = row.progress;
        setOnboardingDone(
          Boolean(progress.completedAt) ||
            (typeof progress.step === "number" && progress.step >= 8),
        );
      })
      .catch(() => setOnboardingDone(false));
  }, [location.pathname]);

  const memberLinks: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
    { href: "/check-in", label: "Check-in", icon: ClipboardCheck },
    { href: "/assessments", label: "Assessments", icon: BarChart3 },
    { href: "/progress", label: "Progress", icon: LineChart },
    ...(!onboardingDone
      ? ([{ href: "/onboarding", label: "Onboarding", icon: BookOpen }] as NavItem[])
      : []),
    { href: "/support", label: "Support", icon: HeartHandshake },
  ];

  const navItems: NavItem[] = [
    ...memberLinks,
    ...(showAdmin
      ? ([{ href: "/admin", label: "Admin", icon: Settings }] as NavItem[])
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 text-foreground">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden flex-col border-r border-border bg-white shadow-sm md:flex md:w-64">
          <div className="flex h-20 items-center border-b border-border px-6">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt="ThriveLife Logo"
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">ThriveLife</h1>
                <p className="text-xs text-muted-foreground">
                  Capacity navigation
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6" aria-label="Main">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(
                  location.pathname,
                  item.href,
                  item.end,
                );
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all ${
                        active
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto space-y-3 border-t border-border px-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel(user.role)}
                  {user.isDemo ? " · demo" : ""}
                </p>
              </div>
            </div>
            <Link
              to="/auth"
              className="block min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-gray-100 hover:text-foreground"
            >
              Account
            </Link>
            <Link
              to="/privacy"
              className="block min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-gray-100 hover:text-foreground"
            >
              Privacy controls
            </Link>
            {import.meta.env.DEV ? (
              <Link
                to="/dev/role"
                className="block min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-gray-100 hover:text-foreground"
              >
                Switch local role
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur-sm md:hidden">
            <Link to="/dashboard" className="flex min-h-11 items-center gap-2">
              <img
                src={LOGO_URL}
                alt="ThriveLife Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-gray-800">ThriveLife</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="min-h-11 min-w-11 rounded-lg p-2 text-muted-foreground hover:bg-gray-100"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

          {mobileMenuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                aria-label="Close menu overlay"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="fixed bottom-0 left-0 top-0 z-50 flex w-64 max-w-[85vw] flex-col bg-white shadow-xl md:hidden">
                <div className="flex items-center justify-between border-b px-4 py-4">
                  <p className="font-bold text-gray-800">ThriveLife</p>
                  <button
                    type="button"
                    className="min-h-11 min-w-11 rounded-lg p-2 text-muted-foreground hover:bg-gray-100"
                    aria-label="Close menu"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X size={22} />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile">
                  <ul className="space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(
                        location.pathname,
                        item.href,
                        item.end,
                      );
                      return (
                        <li key={item.href}>
                          <Link
                            to={item.href}
                            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-base font-medium ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-gray-100"
                            }`}
                          >
                            <Icon size={20} />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                    <li>
                      <Link
                        to="/auth"
                        className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground hover:bg-gray-100"
                      >
                        <UserRound size={20} />
                        <span>Account</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/privacy"
                        className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground hover:bg-gray-100"
                      >
                        <UserRound size={20} />
                        <span>Privacy</span>
                      </Link>
                    </li>
                  </ul>
                </nav>
                <div className="border-t p-4">
                  <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {roleLabel(user.role)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <main id="main" className="relative min-w-0 flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl p-4 pb-16 md:p-8">
              <PageEnter>
                <Outlet />
              </PageEnter>
            </div>
            <footer className="mx-auto max-w-7xl space-y-2 px-4 pb-10 text-sm text-muted-foreground md:px-8">
              <p>
                ThriveLife is a capacity-navigation tool, not a diagnosis or
                emergency service.{" "}
                <Link
                  to="/support"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Support
                </Link>
                {" · "}
                <Link
                  to="/privacy"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Privacy
                </Link>
                {" · "}
                <Link
                  to="/privacy-policy"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Privacy policy
                </Link>
                {" · "}
                <Link
                  to="/terms"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Terms
                </Link>
              </p>
              <p className="text-xs">
                Assessment wording is fixture content pending Joel’s package.
                Privacy policy and Terms await legal counsel (Alberta PIPA /
                PIPEDA) before beta.
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
