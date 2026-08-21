import { Link, Outlet } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import { buttonClassName } from "@/components/ui/button-styles";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd5a726e4_ChatGPTImageAug18202508_03_05PM.png";

/** Minimal chrome for landing, login, and public legal pages. */
export function PublicLayout() {
  const signedIn = isAuthenticated();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 text-foreground">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3">
            <img
              src={LOGO_URL}
              alt=""
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold text-gray-800">ThriveLife</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Account">
            {signedIn ? (
              <Link to="/dashboard" className={buttonClassName()}>
                Open app
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className={buttonClassName({ variant: "ghost" })}
                >
                  Sign in
                </Link>
                <Link to="/auth?mode=sign-up" className={buttonClassName()}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-8 md:py-14">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p>Capacity navigation — not diagnosis or emergency care.</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <Link
              to="/privacy-policy"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Privacy policy
            </Link>
            <Link
              to="/terms"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Terms
            </Link>
            <Link
              to="/auth"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
