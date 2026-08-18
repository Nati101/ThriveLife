/**
 * Pilot instrumentation (spec §11.8).
 */

export type TelemetryDevice = "desktop" | "mobile" | "tablet" | "unknown";

export type SessionTelemetry = {
  sessionId: string;
  userId: string;
  instrumentId: string;
  assessmentVersion: number;
  deviceType: TelemetryDevice;
  intervalSincePreviousDays: number | null;
  abandonedAtItemId: string | null;
  dwellMsByScreen: Record<string, number>;
  naCount: number;
  skipCount: number;
  itemCount: number;
  completed: boolean;
};

export function naRate(naCount: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return naCount / itemCount;
}

export function naRewriteFlag(naCount: number, itemCount: number, threshold = 0.15): boolean {
  return naRate(naCount, itemCount) > threshold;
}

export function guessDeviceType(userAgent: string | undefined): TelemetryDevice {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

export function aggregateNaByItem(
  rows: Array<{ itemId: string; answer: number | string | null; skipped: boolean }>,
): Map<string, { na: number; total: number; rate: number; flag: boolean }> {
  const map = new Map<string, { na: number; total: number }>();
  for (const row of rows) {
    const cur = map.get(row.itemId) ?? { na: 0, total: 0 };
    cur.total += 1;
    if (row.answer === null && !row.skipped) cur.na += 1;
    map.set(row.itemId, cur);
  }
  const out = new Map<string, { na: number; total: number; rate: number; flag: boolean }>();
  for (const [itemId, value] of map) {
    const rate = value.total === 0 ? 0 : value.na / value.total;
    out.set(itemId, { ...value, rate, flag: rate > 0.15 });
  }
  return out;
}
