/** Map raw API / network errors to calm product copy. */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!(err instanceof Error)) return fallback;
  const status = (err as Error & { status?: number }).status;
  const message = err.message ?? "";

  if (status === 403) {
    return "You do not have access to that area with your current role.";
  }
  if (status === 409) {
    if (/full assessment/i.test(message)) {
      return "A Full Assessment is needed before this step. You can take it anytime from Assessments.";
    }
    return message || "That action is not available right now.";
  }
  if (status === 423) {
    return "The Full Assessment is locked for a short cooldown. Daily check-in is still available.";
  }
  if (status === 404) {
    return "We could not find that item. It may have been removed.";
  }
  if (status === 429) {
    return "Too many requests — wait a moment and try again.";
  }
  if (/failed to fetch|network|abort/i.test(message)) {
    return "Connection issue. Your answers are saved locally when possible — try again in a moment.";
  }
  if (/supabase|auth is not configured/i.test(message)) {
    return "Cloud sign-in is not configured here. Use a demo account to continue.";
  }
  // Avoid dumping stack-like or JSON blobs into the UI
  if (message.length > 180 || message.trim().startsWith("{")) {
    return fallback;
  }
  return message || fallback;
}
