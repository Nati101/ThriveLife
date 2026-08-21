import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, labelClassName } from "@/components/ui/field";
import { useToast } from "@/components/Toast";
import {
  continueAsDemoAccount,
  getSessionUser,
  isAuthenticated,
  redeemContentInvite,
  setCloudSession,
  setDevRole,
  signOutLocal,
  type SessionUser,
} from "@/lib/auth";
import { resolvePostAuthPath } from "@/lib/auth-flow";
import { seedDemoProfile } from "@/lib/demo-seed";
import { apiFetch } from "@/lib/api-fetch";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { ROLES, type Role } from "@thrivelife/shared";
import { friendlyError } from "@/lib/friendly-error";

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
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser>(() => getSessionUser());
  const [signedIn, setSignedIn] = useState(() => isAuthenticated());
  const [demoName, setDemoName] = useState("Demo Member");
  const [demoRole, setDemoRole] = useState<Role>("user");
  const [demoOpen, setDemoOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(openContent);
  const [inviteCode, setInviteCode] = useState("");
  const [joelName, setJoelName] = useState("Joel");
  const [seeding, setSeeding] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const next = params.get("next");
  const denied = params.get("denied");

  useEffect(() => {
    setMode(params.get("mode") === "sign-up" ? "sign-up" : "sign-in");
    if (params.get("access") === "content" || params.get("invite") === "1") {
      setContentOpen(true);
    }
  }, [params]);

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
    const supabase = getSupabase();
    if (!supabase) {
      setError(
        "Cloud sign-in is not configured. Open Demo tools below to continue on this device.",
      );
      setDemoOpen(true);
      return;
    }
    if (mode === "sign-up" && !ageOk) {
      setError("ThriveLife is for adults 18+. Teen accounts are not in V1.");
      return;
    }
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
        const sessionUser = data.user;
        if (sessionUser) {
          setCloudSession({
            id: sessionUser.id,
            email: sessionUser.email ?? email,
            displayName:
              (sessionUser.user_metadata?.display_name as string | undefined) ||
              email.split("@")[0],
          });
        }
        toast("Signed in.");
        refreshUser();
        await goAfterAuth();
        return;
      }
      const { error: signUpError } = await supabase.auth.signUp({
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
      setInfo("Check your email if confirmation is enabled, then sign in.");
      setMode("sign-in");
    } catch (err) {
      setError(friendlyError(err));
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
        // Pages may only have static validation; local redeem already succeeded.
      }
      refreshUser();
      toast("Content owner access granted — opening Admin.");
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
    <div className="mx-auto max-w-md space-y-8">
      <PageHeader
        eyebrow="Account"
        title={mode === "sign-in" ? "Sign in" : "Create account"}
        description="Sign in to open your dashboard. Content contributors use the invite section below."
      />

      {denied ? (
        <p
          className="rounded-lg border border-border bg-warn-soft px-4 py-3 text-sm text-fixture"
          role="status"
        >
          That area needs content-tool access. Redeem a content invite, or sign
          in with an editor/admin account.
        </p>
      ) : null}

      {signedIn ? (
        <Card className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Signed in
            {user.isContentOwner
              ? " as content owner"
              : user.isDemo
                ? " as demo"
                : ""}
          </p>
          <p className="font-semibold text-gray-800">{user.displayName}</p>
          <p className="text-sm text-muted-foreground">
            {user.email} · {user.role}
          </p>
          <div className="flex flex-wrap gap-2">
            {user.isContentOwner ? (
              <Button onClick={() => void goAfterAuth(true)}>Open Admin</Button>
            ) : (
              <Button onClick={() => void goAfterAuth()}>Continue</Button>
            )}
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Card>
      ) : null}

      {!signedIn && supabaseConfigured ? (
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <Card className="space-y-4">
            <label className="block">
              <span className={labelClassName}>Email</span>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              />
            </label>
            {mode === "sign-up" ? (
              <label className="flex min-h-11 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary"
                  checked={ageOk}
                  onChange={(e) => setAgeOk(e.target.checked)}
                />
                I am 18 or older.
              </label>
            ) : null}
            {error && !contentOpen ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : null}
            {info ? <p className="text-sm text-foreground">{info}</p> : null}
            <Button type="submit" className="w-full">
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>
          </Card>
          <button
            type="button"
            className="min-h-11 text-sm font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in" ? "Need an account?" : "Already have an account?"}
          </button>
        </form>
      ) : null}

      {!signedIn && !supabaseConfigured ? (
        <Card className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cloud Auth is not configured here. Members use Demo tools; Joel uses
            Content contributor access.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              setDemoOpen(true);
              void startDemo();
            }}
          >
            Continue as member (demo)
          </Button>
        </Card>
      ) : null}

      <details
        className="rounded-xl border border-border bg-white px-4 py-3"
        open={contentOpen}
        onToggle={(e) =>
          setContentOpen((e.target as HTMLDetailsElement).open)
        }
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-gray-800">
          Content contributor access
          <span className="ml-2 font-normal text-muted-foreground">
            Joel — edit items &amp; copy
          </span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Enter the invite code Nati shared with you. This unlocks Admin:
            content library, copy, lookups, and publish — without a separate app.
          </p>
          <label className="block">
            <span className={labelClassName}>Your name</span>
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
          {error && contentOpen ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : null}
          <Button
            className="w-full"
            disabled={redeeming || !inviteCode.trim()}
            onClick={() => void redeemJoelAccess()}
          >
            {redeeming ? "Checking…" : "Unlock content tools"}
          </Button>
          <p className="text-xs text-muted-foreground">
            After unlock, go to Admin → Content library and Copy &amp; lookups.
            Fixture wording stays labeled until you publish replacements.
          </p>
        </div>
      </details>

      <details
        className="rounded-xl border border-border bg-white px-4 py-3"
        open={demoOpen}
        onToggle={(e) => setDemoOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-gray-800">
          Demo tools
          <span className="ml-2 font-normal text-muted-foreground">
            member walkthrough
          </span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Local member identity on this device. Production demos are always the
            member role — content tools use the invite above.
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
              <span className={labelClassName}>DEV role override</span>
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
          <Button className="w-full" onClick={() => void startDemo()}>
            Continue with demo account
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={seeding}
            onClick={() => void loadDemoProfile()}
          >
            {seeding ? "Loading demo…" : "Load demo profile"}
          </Button>
          {import.meta.env.DEV ? (
            <p className="text-xs text-muted-foreground">
              Local RBAC switcher:{" "}
              <Link
                to="/dev/role"
                className="text-primary underline-offset-2 hover:underline"
              >
                /dev/role
              </Link>
              .
            </p>
          ) : null}
        </div>
      </details>

      <p className="text-xs text-muted-foreground">
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
        . Legal counsel review is still pending before beta.
      </p>
    </div>
  );
}
