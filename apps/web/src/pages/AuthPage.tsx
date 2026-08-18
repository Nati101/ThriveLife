import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError(
        "Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Local stub auth remains at /dev/role.",
      );
      return;
    }
    if (mode === "sign-up" && !ageOk) {
      setError("ThriveLife is for adults 18+. Teen accounts are not in V1.");
      return;
    }
    if (mode === "sign-in") {
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) {
        setError(signError.message);
        return;
      }
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
      setError(signUpError.message);
      return;
    }
    setInfo("Check your email if confirmation is enabled, then sign in.");
  }

  return (
    <div className="max-w-md">
      <PageHeader
        eyebrow="Account"
        title={mode === "sign-in" ? "Sign in" : "Create account"}
        description="Supabase Auth is the identity store. Roles live in profiles / app_metadata — never user_metadata."
      />
      {!supabaseConfigured ? (
        <p className="mb-4 rounded-lg border border-border bg-warn-soft px-3 py-2 text-sm text-fixture">
          Cloud Auth keys are not in this environment. Use /dev/role for local
          stub sessions.
        </p>
      ) : null}
      <form className="space-y-3 rounded-xl border border-border bg-white p-5" onSubmit={(e) => void onSubmit(e)}>
        <input
          type="email"
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "sign-up" ? (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
            />
            I am 18 or older.
          </label>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {info ? <p className="text-sm">{info}</p> : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {mode === "sign-in" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 text-sm text-primary underline-offset-2 hover:underline"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? "Need an account?" : "Already have an account?"}
      </button>
    </div>
  );
}
