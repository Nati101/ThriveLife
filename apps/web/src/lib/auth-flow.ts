import { fetchOnboarding } from "@/lib/member-api";

/** Safe post-auth destination: honor ?next=, else onboarding or dashboard. */
export async function resolvePostAuthPath(
  fallbackNext: string | null,
): Promise<string> {
  if (
    fallbackNext &&
    fallbackNext.startsWith("/") &&
    !fallbackNext.startsWith("//")
  ) {
    if (fallbackNext === "/" || fallbackNext.startsWith("/auth")) {
      // fall through
    } else {
      return fallbackNext;
    }
  }
  try {
    const row = await fetchOnboarding();
    const progress = row.progress as { completedAt?: string; step?: number };
    const done =
      Boolean(progress.completedAt) ||
      (typeof progress.step === "number" && progress.step >= 8);
    return done ? "/dashboard" : "/onboarding";
  } catch {
    return "/onboarding";
  }
}
