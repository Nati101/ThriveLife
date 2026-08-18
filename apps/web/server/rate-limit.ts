/**
 * In-memory sliding-window rate limit for /api (spec Phase 9).
 * Per-process only — enough for local/dev and a single Node host.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  max = 120,
  windowMs = 60_000,
  now = Date.now(),
): RateLimitResult {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  return {
    allowed: true,
    remaining: Math.max(0, max - hits.length),
    retryAfterSec: 0,
  };
}

/** Test helper. */
export function resetRateLimitForTests(): void {
  buckets.clear();
}
