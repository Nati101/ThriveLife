/**
 * Assessment session API (Phase 3).
 * Scores from content-store thresholds; persists to sessions.json.
 * Authority: DRAIN never writes battery states; Scan never overwrites Full Assessment.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  BATTERY_IDS,
  DRIVING_MODES,
  OVERCHARGE_APPROVED_MESSAGE,
  assertInstrumentWriteAllowed,
  isFullAssessmentLocked,
  isRole,
  overchargeRulesFromThresholds,
  recommendBatteryFromScan,
  resolveDashboardAuthority,
  scoreDrainCheck,
  scoreFullAssessment,
  type AssessmentItem,
  type AssessmentResponse,
  type AssessmentSession,
  type BatteryId,
  type BatteryResult,
  type DrivingMode,
  type DrivingModeOrUnsure,
  type DrivingModeRow,
  type InstrumentId,
  type OverchargeFlag,
  type ScanLevel,
} from "@thrivelife/shared";
import { readContentDocument } from "./store";
import {
  ensureSessionsStoreReady,
  newSessionId,
  readSessionsDocument,
  touchSessionsDocument,
  type DrainResultRow,
  type ScanRecommendationRow,
  type SessionsDocument,
} from "./sessions-store";

const DEV_ROLE_COOKIE = "tl_dev_role";
const STUB_USER_ID = "stub-user-local";

type JsonBody =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

function sendJson(
  res: ServerResponse,
  status: number,
  body: JsonBody,
): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie ?? "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = decodeURIComponent(trimmed.slice(eq + 1));
    out[key] = value;
  }
  return out;
}

function stubUserId(req: IncomingMessage): string {
  const cookies = parseCookies(req);
  const roleHeader = req.headers["x-thrivelife-role"];
  const raw =
    (typeof roleHeader === "string" ? roleHeader : null) ??
    cookies[DEV_ROLE_COOKIE] ??
    "user";
  // Role only affects content admin; sessions always keyed to stub user.
  void (isRole(raw) ? raw : "user");
  return STUB_USER_ID;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { _parseError: true };
  }
}

function matchPath(
  pathname: string,
  pattern: string,
): Record<string, string> | null {
  const actualParts = pathname.split("/").filter(Boolean);
  const expectedParts = pattern.split("/").filter(Boolean);
  if (actualParts.length !== expectedParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < expectedParts.length; i += 1) {
    const expected = expectedParts[i]!;
    const actual = actualParts[i]!;
    if (expected.startsWith(":")) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

function isInstrumentId(value: unknown): value is InstrumentId {
  return (
    value === "drain_check" ||
    value === "battery_scan" ||
    value === "full_assessment" ||
    value === "weekly_mode_check"
  );
}

function latestCompletedSession(
  doc: SessionsDocument,
  userId: string,
  instrumentId: InstrumentId,
): AssessmentSession | null {
  const rows = doc.sessions
    .filter(
      (s) =>
        s.userId === userId &&
        s.instrumentId === instrumentId &&
        s.status === "completed" &&
        s.completedAt,
    )
    .sort((a, b) =>
      (b.completedAt ?? "").localeCompare(a.completedAt ?? ""),
    );
  return rows[0] ?? null;
}

function inProgressSession(
  doc: SessionsDocument,
  userId: string,
  instrumentId: InstrumentId,
): AssessmentSession | null {
  return (
    doc.sessions.find(
      (s) =>
        s.userId === userId &&
        s.instrumentId === instrumentId &&
        s.status === "in_progress",
    ) ?? null
  );
}

function responsesForSession(
  doc: SessionsDocument,
  sessionId: string,
): AssessmentResponse[] {
  return doc.responses.filter((r) => r.sessionId === sessionId);
}

function answersMap(responses: AssessmentResponse[]): Record<string, number | null> {
  const map: Record<string, number | null> = {};
  for (const row of responses) {
    if (typeof row.answer === "number") map[row.itemId] = row.answer;
    else if (row.answer === null || row.skipped) map[row.itemId] = null;
  }
  return map;
}

function activeItemsForInstrument(instrumentId: InstrumentId): AssessmentItem[] {
  const content = readContentDocument();
  return content.items.filter(
    (item) => item.instrumentId === instrumentId && item.active,
  );
}

function maxItemVersion(items: AssessmentItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.version), 1);
}

function parseScanLevel(value: unknown): ScanLevel | null {
  if (value === "low" || value === "steady" || value === "full") return value;
  return null;
}

function parseDrivingMode(value: unknown): DrivingModeOrUnsure | null {
  if (
    value === "green" ||
    value === "yellow" ||
    value === "red" ||
    value === "unsure"
  ) {
    return value;
  }
  return null;
}

function buildAuthority(userId: string) {
  const doc = readSessionsDocument();
  const fa = latestCompletedSession(doc, userId, "full_assessment");
  const scan = [...doc.scanRecommendations]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.setAt.localeCompare(a.setAt))[0];
  const mode = [...doc.drivingModes]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.setAt.localeCompare(a.setAt))[0];
  const drain = [...doc.drainResults]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];

  const batteryStates: Partial<Record<BatteryId, import("@thrivelife/shared").BatteryState | null>> =
    {};
  if (fa) {
    for (const row of doc.batteryResults.filter((r) => r.sessionId === fa.id)) {
      batteryStates[row.batteryId] = row.batteryState;
    }
  }
  const overcharge = fa
    ? (doc.overchargeFlags.find((o) => o.sessionId === fa.id) ?? null)
    : null;

  return resolveDashboardAuthority({
    fullAssessment: fa
      ? {
          completedAt: fa.completedAt,
          version: fa.version,
          batteryStates,
          overcharge: overcharge
            ? {
                isFlagged: overcharge.isFlagged,
                contributingBatteries: overcharge.contributingBatteries,
                dismissed: overcharge.dismissed,
              }
            : null,
          suggestedMode:
            typeof fa.resultSummary?.suggestedMode === "string"
              ? (fa.resultSummary.suggestedMode as DrivingMode)
              : null,
        }
      : null,
    batteryScan: scan
      ? {
          setAt: scan.setAt,
          ratings: scan.ratings,
          recommendedBatteryId: scan.recommendedBatteryId,
        }
      : null,
    drivingMode: mode
      ? {
          declaredMode: mode.declaredMode,
          suggestedMode: mode.suggestedMode,
          setAt: mode.setAt,
        }
      : null,
    drainCheck: drain
      ? {
          completedAt: drain.completedAt,
          interventionTriggered: drain.interventionTriggered,
        }
      : null,
  });
}

function completeDrain(
  doc: SessionsDocument,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
) {
  assertInstrumentWriteAllowed("drain_check", "drain_session_intervention");
  const scored = scoreDrainCheck(answersMap(responses));
  const row: DrainResultRow = {
    id: newSessionId("drain"),
    userId,
    sessionId: session.id,
    totalScore: scored.totalScore,
    answeredCount: scored.answeredCount,
    interventionTriggered: scored.interventionTriggered,
    completedAt: now,
  };
  doc.drainResults = doc.drainResults.filter((r) => r.sessionId !== session.id);
  doc.drainResults.push(row);
  session.status = "completed";
  session.completedAt = now;
  session.resultSummary = {
    kind: "drain_check",
    ...scored,
    note: "Session-only. Does not update battery states.",
  };
  return { drain: row };
}

function completeScan(
  doc: SessionsDocument,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
) {
  assertInstrumentWriteAllowed("battery_scan", "scan_markers");
  const ratings: Partial<Record<BatteryId, ScanLevel | null>> = {};
  for (const batteryId of BATTERY_IDS) {
    const item = activeItemsForInstrument("battery_scan").find(
      (i) => i.batteryId === batteryId,
    );
    if (!item) continue;
    const response = responses.find((r) => r.itemId === item.id);
    if (!response) {
      ratings[batteryId] = null;
      continue;
    }
    if (response.answer === null || response.skipped) {
      ratings[batteryId] = null;
      continue;
    }
    if (typeof response.answer === "string") {
      ratings[batteryId] = parseScanLevel(response.answer.toLowerCase());
    }
  }

  // Follow-up answers: itemId = `${scanItemId}__followup` with low|steady
  for (const response of responses) {
    if (!response.itemId.endsWith("__followup")) continue;
    const baseId = response.itemId.replace(/__followup$/, "");
    const baseItem = activeItemsForInstrument("battery_scan").find(
      (i) => i.id === baseId,
    );
    if (!baseItem?.batteryId) continue;
    const level = parseScanLevel(
      typeof response.answer === "string"
        ? response.answer.toLowerCase()
        : response.answer,
    );
    if (level === "low" || level === "steady") {
      ratings[baseItem.batteryId as BatteryId] = level;
    }
  }

  const recommendedBatteryId = recommendBatteryFromScan(ratings);
  const row: ScanRecommendationRow = {
    id: newSessionId("scan"),
    userId,
    sessionId: session.id,
    ratings,
    recommendedBatteryId,
    setAt: now,
  };
  doc.scanRecommendations = doc.scanRecommendations.filter(
    (r) => r.sessionId !== session.id,
  );
  doc.scanRecommendations.push(row);
  session.status = "completed";
  session.completedAt = now;
  session.resultSummary = {
    kind: "battery_scan",
    ratings,
    recommendedBatteryId,
    staleAfterHours: 18,
    note: "Does not overwrite Full Assessment battery states.",
  };
  return { scan: row };
}

function completeFullAssessment(
  doc: SessionsDocument,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
) {
  assertInstrumentWriteAllowed("full_assessment", "battery_rings");
  const content = readContentDocument();
  const scored = scoreFullAssessment({
    items: content.items,
    constructs: content.constructs,
    thresholds: content.scoringThresholds,
    answers: answersMap(responses),
    overchargeRules: overchargeRulesFromThresholds(content.scoringThresholds),
  });

  doc.batteryResults = doc.batteryResults.filter(
    (r) => r.sessionId !== session.id,
  );
  const batteryRows: BatteryResult[] = scored.batteryResults.map((row) => ({
    id: newSessionId("bres"),
    sessionId: session.id,
    batteryId: row.batteryId,
    capacityScore:
      row.capacity.status === "ok" ? row.capacity.score : null,
    strainScore: row.strain.status === "ok" ? row.strain.score : null,
    rechargeScore:
      row.recharge.status === "ok" ? row.recharge.score : null,
    batteryState: row.batteryState,
    computedAt: now,
  }));
  doc.batteryResults.push(...batteryRows);

  doc.overchargeFlags = doc.overchargeFlags.filter(
    (o) => o.sessionId !== session.id,
  );
  const overcharge: OverchargeFlag = {
    id: newSessionId("oc"),
    sessionId: session.id,
    isFlagged: scored.overcharge.isFlagged,
    contributingBatteries: scored.overcharge.contributingBatteries,
    dismissed: false,
    dismissedAt: null,
  };
  doc.overchargeFlags.push(overcharge);

  doc.signalCountLogs.push({
    id: newSessionId("sig"),
    userId,
    sessionId: session.id,
    signalCount: scored.suggestedMode.signalCount,
    batteriesShowingSignal: scored.suggestedMode.batteriesShowingSignal,
    suggestedMode: scored.suggestedMode.mode,
    loggedAt: now,
  });

  session.status = "completed";
  session.completedAt = now;
  session.resultSummary = {
    kind: "full_assessment",
    dashboardComplete: scored.dashboardComplete,
    resolvedCount: scored.resolvedCount,
    incompleteBatteryIds: scored.incompleteBatteryIds,
    suggestedMode: scored.suggestedMode.mode,
    signalCount: scored.suggestedMode.signalCount,
    batteriesShowingSignal: scored.suggestedMode.batteriesShowingSignal,
    overcharge: {
      isFlagged: scored.overcharge.isFlagged,
      contributingBatteries: scored.overcharge.contributingBatteries,
      conditions: scored.overcharge.conditions,
      message: scored.overcharge.isFlagged
        ? OVERCHARGE_APPROVED_MESSAGE
        : null,
    },
    naItemIds: scored.naItemIds,
    batteryResults: scored.batteryResults,
  };
  return { scored, overcharge, batteryRows };
}

function completeWeeklyMode(
  doc: SessionsDocument,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
  body: Record<string, unknown>,
) {
  assertInstrumentWriteAllowed("weekly_mode_check", "declared_driving_mode");
  const modeItem = activeItemsForInstrument("weekly_mode_check")[0];
  const response = modeItem
    ? responses.find((r) => r.itemId === modeItem.id)
    : undefined;

  let declared =
    parseDrivingMode(body.declaredMode) ??
    (typeof response?.answer === "string"
      ? parseDrivingMode(response.answer.toLowerCase())
      : null);

  if (!declared) {
    throw new Error("declared_mode_required");
  }

  // Advisory suggested mode from latest Full Assessment — never silent write.
  const fa = latestCompletedSession(doc, userId, "full_assessment");
  let suggestedMode: DrivingMode | null = null;
  if (fa && typeof fa.resultSummary?.suggestedMode === "string") {
    const raw = fa.resultSummary.suggestedMode;
    if (DRIVING_MODES.includes(raw as DrivingMode)) {
      suggestedMode = raw as DrivingMode;
    }
  }

  const row: DrivingModeRow = {
    id: newSessionId("mode"),
    userId,
    declaredMode: declared,
    suggestedMode,
    setAt: now,
    source: "weekly_check",
  };
  doc.drivingModes.push(row);
  session.status = "completed";
  session.completedAt = now;
  session.resultSummary = {
    kind: "weekly_mode_check",
    declaredMode: declared,
    suggestedMode,
    staleAfterDays: 7,
    note: "User-declared mode is authoritative; suggested mode is advisory only.",
  };
  return { mode: row };
}

export function ensureAssessmentApiReady(): void {
  ensureSessionsStoreReady();
}

export async function handleAssessmentApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (!url.pathname.startsWith("/api/assessments")) return false;

  const method = (req.method ?? "GET").toUpperCase();
  const pathname = url.pathname;
  const userId = stubUserId(req);

  try {
    // Instrument bootstrap (items + scales from content store — not fixture imports)
    const instrumentMatch = matchPath(
      pathname,
      "/api/assessments/instruments/:instrumentId",
    );
    if (instrumentMatch && method === "GET") {
      const instrumentId = instrumentMatch.instrumentId;
      if (!isInstrumentId(instrumentId)) {
        sendJson(res, 404, { error: "unknown_instrument" });
        return true;
      }
      const content = readContentDocument();
      const instrument = content.instruments.find((i) => i.id === instrumentId);
      if (!instrument) {
        sendJson(res, 404, { error: "instrument_not_found" });
        return true;
      }
      const items = content.items.filter(
        (i) => i.instrumentId === instrumentId && i.active,
      );
      const scaleIds = new Set(items.map((i) => i.responseScaleId));
      const scales = content.responseScales.filter((s) => scaleIds.has(s.id));
      const batteries = content.batteries;
      const constructs = content.constructs.filter((c) =>
        items.some((i) => i.constructId === c.id),
      );

      let eligibility: unknown = null;
      if (instrumentId === "full_assessment") {
        const doc = readSessionsDocument();
        const last = latestCompletedSession(doc, userId, "full_assessment");
        eligibility = isFullAssessmentLocked(last?.completedAt ?? null);
      }

      const inProgress = inProgressSession(
        readSessionsDocument(),
        userId,
        instrumentId,
      );

      sendJson(res, 200, {
        instrument,
        items,
        scales,
        batteries,
        constructs,
        eligibility,
        inProgressSessionId: inProgress?.id ?? null,
      });
      return true;
    }

    if (pathname === "/api/assessments/me/authority" && method === "GET") {
      sendJson(res, 200, { authority: buildAuthority(userId) });
      return true;
    }

    if (pathname === "/api/assessments/me/sessions" && method === "GET") {
      const doc = readSessionsDocument();
      const sessions = doc.sessions
        .filter((s) => s.userId === userId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      sendJson(res, 200, { sessions });
      return true;
    }

    if (pathname === "/api/assessments/sessions" && method === "POST") {
      const body = (await readBody(req)) as Record<string, unknown>;
      if (body._parseError) {
        sendJson(res, 400, { error: "invalid_json" });
        return true;
      }
      const instrumentId = body.instrumentId;
      if (!isInstrumentId(instrumentId)) {
        sendJson(res, 400, { error: "invalid_instrument" });
        return true;
      }

      const items = activeItemsForInstrument(instrumentId);
      const now = new Date().toISOString();
      const doc = readSessionsDocument();

      if (instrumentId === "full_assessment") {
        const last = latestCompletedSession(doc, userId, "full_assessment");
        const lock = isFullAssessmentLocked(last?.completedAt ?? null, now);
        if (lock.locked) {
          sendJson(res, 423, {
            error: "full_assessment_locked",
            ...lock,
          });
          return true;
        }
      }

      const existing = inProgressSession(doc, userId, instrumentId);
      if (existing && body.forceNew !== true) {
        sendJson(res, 200, {
          session: existing,
          responses: responsesForSession(doc, existing.id),
          resumed: true,
        });
        return true;
      }

      if (existing && body.forceNew === true) {
        existing.status = "abandoned";
      }

      const lastSame = latestCompletedSession(doc, userId, instrumentId);
      const intervalSincePreviousDays = lastSame?.completedAt
        ? isFullAssessmentLocked(lastSame.completedAt, now).daysSince
        : null;

      const session: AssessmentSession = {
        id: newSessionId("sess"),
        userId,
        instrumentId,
        startedAt: now,
        completedAt: null,
        version: maxItemVersion(items),
        intervalSincePreviousDays,
        status: "in_progress",
        resultSummary: null,
      };

      touchSessionsDocument((d) => {
        if (existing && body.forceNew === true) {
          const row = d.sessions.find((s) => s.id === existing.id);
          if (row) row.status = "abandoned";
        }
        d.sessions.push(session);
      });

      sendJson(res, 201, { session, responses: [], resumed: false });
      return true;
    }

    const sessionMatch = matchPath(pathname, "/api/assessments/sessions/:id");
    if (sessionMatch && method === "GET") {
      const doc = readSessionsDocument();
      const session = doc.sessions.find(
        (s) => s.id === sessionMatch.id && s.userId === userId,
      );
      if (!session) {
        sendJson(res, 404, { error: "session_not_found" });
        return true;
      }
      sendJson(res, 200, {
        session,
        responses: responsesForSession(doc, session.id),
        batteryResults: doc.batteryResults.filter(
          (r) => r.sessionId === session.id,
        ),
        overchargeFlag:
          doc.overchargeFlags.find((o) => o.sessionId === session.id) ?? null,
      });
      return true;
    }

    const responsesMatch = matchPath(
      pathname,
      "/api/assessments/sessions/:id/responses",
    );
    if (responsesMatch && method === "PUT") {
      const body = (await readBody(req)) as Record<string, unknown>;
      if (body._parseError) {
        sendJson(res, 400, { error: "invalid_json" });
        return true;
      }
      const doc = readSessionsDocument();
      const session = doc.sessions.find(
        (s) => s.id === responsesMatch.id && s.userId === userId,
      );
      if (!session) {
        sendJson(res, 404, { error: "session_not_found" });
        return true;
      }
      if (session.status !== "in_progress") {
        sendJson(res, 409, { error: "session_not_in_progress" });
        return true;
      }

      const incoming = Array.isArray(body.responses) ? body.responses : [];
      const now = new Date().toISOString();
      touchSessionsDocument((d) => {
        for (const raw of incoming) {
          if (!raw || typeof raw !== "object") continue;
          const row = raw as Record<string, unknown>;
          const itemId = typeof row.itemId === "string" ? row.itemId : null;
          if (!itemId) continue;
          const skipped = Boolean(row.skipped);
          let answer: number | string | null = null;
          if (!skipped) {
            if (row.answer === null || row.answer === "na" || row.answer === "unsure") {
              answer = null;
            } else if (
              typeof row.answer === "number" ||
              typeof row.answer === "string"
            ) {
              answer = row.answer;
            }
          } else {
            answer = null;
          }

          const existing = d.responses.find(
            (r) => r.sessionId === session.id && r.itemId === itemId,
          );
          if (existing) {
            existing.answer = answer;
            existing.skipped = skipped;
            existing.timestamp = now;
          } else {
            d.responses.push({
              id: newSessionId("resp"),
              sessionId: session.id,
              itemId,
              answer,
              skipped,
              timestamp: now,
            });
          }
        }
      });

      const next = readSessionsDocument();
      sendJson(res, 200, {
        session,
        responses: responsesForSession(next, session.id),
      });
      return true;
    }

    const completeMatch = matchPath(
      pathname,
      "/api/assessments/sessions/:id/complete",
    );
    if (completeMatch && method === "POST") {
      const body = (await readBody(req)) as Record<string, unknown>;
      const now = new Date().toISOString();
      let resultPayload: JsonBody = null;

      try {
        touchSessionsDocument((d) => {
          const session = d.sessions.find(
            (s) => s.id === completeMatch.id && s.userId === userId,
          );
          if (!session) throw new Error("session_not_found");
          if (session.status !== "in_progress") {
            throw new Error("session_not_in_progress");
          }
          const responses = responsesForSession(d, session.id);

          if (session.instrumentId === "drain_check") {
            resultPayload = completeDrain(d, session, userId, responses, now);
          } else if (session.instrumentId === "battery_scan") {
            resultPayload = completeScan(d, session, userId, responses, now);
          } else if (session.instrumentId === "full_assessment") {
            resultPayload = completeFullAssessment(
              d,
              session,
              userId,
              responses,
              now,
            );
          } else if (session.instrumentId === "weekly_mode_check") {
            resultPayload = completeWeeklyMode(
              d,
              session,
              userId,
              responses,
              now,
              body && typeof body === "object" ? body : {},
            );
          } else {
            throw new Error("unknown_instrument");
          }

          resultPayload = {
            session,
            ...((resultPayload as Record<string, unknown>) ?? {}),
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "error";
        if (message === "session_not_found") {
          sendJson(res, 404, { error: message });
          return true;
        }
        if (message === "declared_mode_required") {
          sendJson(res, 400, { error: message });
          return true;
        }
        if (message === "session_not_in_progress") {
          sendJson(res, 409, { error: message });
          return true;
        }
        throw error;
      }

      sendJson(res, 200, resultPayload);
      return true;
    }

    const dismissMatch = matchPath(
      pathname,
      "/api/assessments/sessions/:id/overcharge/dismiss",
    );
    if (dismissMatch && method === "POST") {
      const now = new Date().toISOString();
      const doc = readSessionsDocument();
      const session = doc.sessions.find(
        (s) => s.id === dismissMatch.id && s.userId === userId,
      );
      if (!session) {
        sendJson(res, 404, { error: "session_not_found" });
        return true;
      }
      touchSessionsDocument((d) => {
        const flag = d.overchargeFlags.find((o) => o.sessionId === session.id);
        if (flag) {
          flag.dismissed = true;
          flag.dismissedAt = now;
        }
      });
      sendJson(res, 200, { ok: true });
      return true;
    }

    sendJson(res, 404, { error: "not_found" });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "server_error";
    sendJson(res, 500, { error: "server_error", message });
    return true;
  }
}
