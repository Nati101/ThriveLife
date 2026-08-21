import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, labelClassName } from "@/components/ui/field";
import { useToast } from "@/components/Toast";
import {
  clearDemoAccount,
  continueAsDemoAccount,
  getSessionUser,
  setDevRole,
  type SessionUser,
} from "@/lib/auth";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { ROLES, type Role } from "@thrivelife/shared";
import { friendlyError } from "@/lib/friendly-error";

export function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser>(() => getSessionUser());
  const [demoName, setDemoName] = useState("Demo Member");
  const [demoRole, setDemoRole] = useState<Role>("user");

  function refreshUser() {
    setUser(getSessionUser());
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError(
        "Cloud sign-in is not configured. Use a demo account below — it persists on this device.",
      );
      return;
    }
    if (mode === "sign-up" && !ageOk) {
      setError("ThriveLife is for adults 18+. Teen accounts are not in V1.");
      return;
    }
    try {
      if (mode === "sign-in") {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signError) {
          setError(friendlyError(signError, signError.message));
          return;
        }
        toast("Signed in.");
        navigate("/dashboard");
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
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function startDemo() {
    const next = continueAsDemoAccount({
      displayName: demoName,
      role: demoRole,
    });
    setUser(next);
    toast(`Continuing as ${next.displayName}.`);
    navigate("/dashboard");
  }

  function signOutDemo() {
    clearDemoAccount();
    setDevRole("user");
    refreshUser();
    toast("Demo account cleared.");
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <PageHeader
        eyebrow="Account"
        title={mode === "sign-in" ? "Sign in" : "Create account"}
        description="Use cloud auth when configured, or a local demo account that works on GitHub Pages."
      />

      {user.isDemo ? (
        <Card className="space-y-3">
          <p className="text-sm text-muted-foreground">Signed in as demo</p>
          <p className="font-semibold text-gray-800">{user.displayName}</p>
          <p className="text-sm text-muted-foreground">
            {user.email} · {user.role}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Open dashboard
            </Button>
            <Button variant="ghost" onClick={signOutDemo}>
              Clear demo account
            </Button>
          </div>
        </Card>
      ) : null}

      {supabaseConfigured ? (
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
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {info ? <p className="text-sm text-foreground">{info}</p> : null}
            <Button type="submit" className="w-full">
              {mode === "sign-in" ? "Sign in" : "Sign up"}
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
      ) : (
        <Card className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cloud Auth keys are not in this environment. A demo account stores
            your name and role on this device and drives the local product store.
          </p>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Demo account</h2>
        <p className="text-sm text-muted-foreground">
          Works fully on static hosting. Choose editor or admin to try content
          tools in this demo.
        </p>
        <label className="block">
          <span className={labelClassName}>Display name</span>
          <Input
            value={demoName}
            onChange={(e) => setDemoName(e.target.value)}
            maxLength={80}
          />
        </label>
        <label className="block">
          <span className={labelClassName}>Demo role</span>
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
        <Button className="w-full" onClick={startDemo}>
          Continue with demo account
        </Button>
        {import.meta.env.DEV ? (
          <p className="text-xs text-muted-foreground">
            Local development can also switch roles at /dev/role.
          </p>
        ) : null}
      </Card>

      <p className="text-xs text-muted-foreground">
        By continuing you agree to the product Terms and Privacy policy surfaces.
        Legal counsel review is still pending before beta.
      </p>
    </div>
  );
}
