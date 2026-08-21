import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, labelClassName } from "@/components/ui/field";
import { useToast } from "@/components/Toast";
import {
  continueAsDemoAccount,
  getSessionUser,
  isAuthenticated,
  redeemContentInvite,
  setDevRole,
  signOutLocal,
  syncSessionFromSupabase,
  type SessionUser,
} from "@/lib/auth";
import { resolvePostAuthPath } from "@/lib/auth-flow";
import { seedDemoProfile } from "@/lib/demo-seed";
import { apiFetch } from "@/lib/api-fetch";
import {
  isCloudAuthRequired,
  isContentInviteAllowed,
} from "@/lib/production";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { ROLES, type Role } from "@thrivelife/shared";
import { friendlyError } from "@/lib/friendly-error";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dd5a726e4_ChatGPTImageAug18202508_03_05PM.png";

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const initialMode =
    params.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  const openContent =
    params.get("access") === "content" || params.get("invite") === "1";
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser>(() => getSessionUser());
  const [signedIn, setSignedIn] = useState(() => isAuthenticated());
  const [demoName, setDemoName] = useState("Demo Member");
  const [demoRole, setDemoRole] = useState<Role>("user");
  const [advancedOpen, setAdvancedOpen] = useState(openContent);
  const [inviteCode, setInviteCode] = useState("");
  const [joelName, setJoelName] = useState("Joel");
  const [seeding, setSeeding] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const next = params.get("next");
  const denied = params.get("denied");
  const cloudRequired = isCloudAuthRequired();
  const inviteAllowed = isContentInviteAllowed();
  const showAdvanced = !cloudRequired || inviteAllowed;

  useEffect(() => {
    setMode(params.get("mode") === "sign-up" ? "sign-up" : "sign-in");
    if (params.get("access") === "content" || params.get("invite") === "1") {
      setAdvancedOpen(true);
    }
  }, [params]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    void syncSessionFromSupabase().then((session) => {
      if (session) {
        setUser(session);
        setSignedIn(true);
      }
    });
  }, []);

  function refreshUser() {
    setUser(getSessionUser());
    setSignedIn(isAuthenticated());
  }

  async function goAfterAuth(preferAdmin = false) {
    if (preferAdmin) {
      navigate("/admin", { replace: true });
      return;
    }
    const path = await resolvePostAuthPath(next);
    navigate(path, { replace: true });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError(
        "Sign-in is not available yet on this host. Use Try demo below, or ask the team to configure Auth.",
      );
      setAdvancedOpen(true);
      return;
    }
    if (mode === "sign-up" && !ageOk) {
      setError("ThriveLife is for adults 18+. Teen accounts are not in V1.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const { data, error: signError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signError) {
          setError(friendlyError(signError, signError.message));
          return;
        }
        if (data.user) await syncSessionFromSupabase();
        toast("Signed in.");
        refreshUser();
        await goAfterAuth();
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: email.split("@")[0] },
        },
      });
      if (signUpError) {
        setError(friendlyError(signUpError, signUpError.message));
        return;
      }
      if (data.session) {
        await syncSessionFromSupabase();
        toast("Account created.");
        refreshUser();
        await goAfterAuth();
        return;
      }
      setInfo("Check your email to confirm, then sign in.");
      setMode("sign-in");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function startDemo() {
    const nextUser = continueAsDemoAccount({
      displayName: demoName,
      role: import.meta.env.DEV ? demoRole : "user",
    });
    setUser(nextUser);
    setSignedIn(true);
    toast(`Continuing as ${nextUser.displayName}.`);
    await goAfterAuth();
  }

  async function loadDemoProfile() {
    setSeeding(true);
    try {
      if (!isAuthenticated() || !getSessionUser().isDemo) {
        continueAsDemoAccount({
          displayName: demoName,
          role: import.meta.env.DEV ? demoRole : "user",
        });
      }
      await seedDemoProfile();
      toast("Demo profile ready.");
      refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast(friendlyError(err, "Could not load the demo profile."));
    } finally {
      setSeeding(false);
    }
  }

  async function redeemJoelAccess() {
    setRedeeming(true);
    setError(null);
    try {
      const local = redeemContentInvite({
        code: inviteCode,
        displayName: joelName,
      });
      if (!local) {
        setError("That invite code is not valid.");
        return;
      }
      try {
        await apiFetch<{ ok: boolean }>("/api/auth/content-invite", {
          method: "POST",
          body: JSON.stringify({ code: inviteCode }),
        });
      } catch {
        // Static hosts validate locally only.
      }
      refreshUser();
      toast("Content access granted.");
      await goAfterAuth(true);
    } finally {
      setRedeeming(false);
    }
  }

  function signOut() {
    const supabase = getSupabase();
    void supabase?.auth.signOut();
    signOutLocal();
    setDevRole("user");
    refreshUser();
    toast("Signed out.");
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="text-center">
        <img
          src={LOGO_URL}
          alt=""
          className="mx-auto h-14 w-14 object-contain"
        />
        <h1 className="mt-4 text-3xl font-bold text-gray-800">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "sign-in"
            ? "Sign in to continue to your dashboard."
            : "Adults 18+. Start with a short onboarding after you join."}
        </p>
      </div>

      {denied ? (
        <p
          className="rounded-lg border border-border bg-warn-soft px-4 py-3 text-sm text-fixture"
          role="status"
        >
          That area needs an editor or admin account. Sign in with the right
          account, or ask for access.
        </p>
      ) : null}

      {signedIn ? (
        <Card className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Signed in</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">
              {user.displayName}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => void goAfterAuth(user.isContentOwner)}
            >
              {user.isContentOwner ? "Open content tools" : "Continue"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="space-y-5">
          {!supabaseConfigured ? (
            <p
              className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
              role="status"
            >
              Email sign-in is not configured on this host yet. You can still
              try the demo from More options below.
            </p>
          ) : null}

          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <label className="block">
              <span className={labelClassName}>Email</span>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!supabaseConfigured || busy}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Password</span>
              <Input
                type="password"
                required
                minLength={8}
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!supabaseConfigured || busy}
              />
            </label>
            {mode === "sign-up" ? (
              <label className="flex min-h-11 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={ageOk}
                  onChange={(e) => setAgeOk(e.target.checked)}
                  disabled={!supabaseConfigured || busy}
                />
                I am 18 or older.
              </label>
            ) : null}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {info ? <p className="text-sm text-foreground">{info}</p> : null}
            <Button
              type="submit"
              className="w-full"
              disabled={!supabaseConfigured || busy}
            >
              {busy
                ? "Please wait…"
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "sign-in" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    setMode("sign-up");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    setMode("sign-in");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </Card>
      )}

      {showAdvanced && !signedIn ? (
        <details
          className="rounded-xl border border-border bg-white px-4 py-3"
          open={advancedOpen}
          onToggle={(e) =>
            setAdvancedOpen((e.target as HTMLDetailsElement).open)
          }
        >
          <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground">
            More options
          </summary>
          <div className="mt-4 space-y-6 border-t border-border pt-4">
            {!cloudRequired ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">Try demo</p>
                <p className="text-sm text-muted-foreground">
                  Explore the product on this device without creating an
                  account.
                </p>
                <label className="block">
                  <span className={labelClassName}>Display name</span>
                  <Input
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    maxLength={80}
                  />
                </label>
                {import.meta.env.DEV ? (
                  <label className="block">
                    <span className={labelClassName}>DEV role</span>
                    <select
                      className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
                      value={demoRole}
                      onChange={(e) => setDemoRole(e.target.value as Role)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void startDemo()}
                >
                  Continue with demo
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  disabled={seeding}
                  onClick={() => void loadDemoProfile()}
                >
                  {seeding ? "Loading…" : "Load seeded demo profile"}
                </Button>
              </div>
            ) : null}

            {inviteAllowed ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">
                  Content contributor
                </p>
                <p className="text-sm text-muted-foreground">
                  For Joel and editors — unlock Admin with your invite code.
                </p>
                <label className="block">
                  <span className={labelClassName}>Name</span>
                  <Input
                    value={joelName}
                    onChange={(e) => setJoelName(e.target.value)}
                    maxLength={80}
                  />
                </label>
                <label className="block">
                  <span className={labelClassName}>Invite code</span>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    autoComplete="off"
                    placeholder="Paste invite code"
                  />
                </label>
                <Button
                  className="w-full"
                  disabled={redeeming || !inviteCode.trim()}
                  onClick={() => void redeemJoelAccess()}
                >
                  {redeeming ? "Checking…" : "Unlock content tools"}
                </Button>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to the{" "}
        <Link
          to="/terms"
          className="text-primary underline-offset-2 hover:underline"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          to="/privacy-policy"
          className="text-primary underline-offset-2 hover:underline"
        >
          Privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
