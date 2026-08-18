/**
 * In-browser API for static hosts (GitHub Pages). Persists to localStorage.
 * Node `/api` middleware is still the source of truth for `npm run dev`.
 */

import {
  BATTERY_IDS,
  BATTERY_STATE_LABELS,
  DEFAULT_PRIVACY_SETTINGS,
  DRIVING_MODES,
  OVERCHARGE_APPROVED_MESSAGE,
  RESTART_RAIL_MESSAGE,
  ROLE_PERMISSIONS,
  SUPPORT_RESOURCES,
  TUNE_UP_SUPPORT_ACTIONS,
  applyWorkflowAction,
  assertInstrumentWriteAllowed,
  canAccessContentTools,
  canTransitionWorkflow,
  copyByKey,
  createSeedContentDocument,
  dueFullAssessmentPrompts,
  evaluateEscalation,
  isFullAssessmentLocked,
  localDateKey,
  mostDepletedBattery,
  mostStabilizingStartingPoint,
  naRewriteFlag,
  overchargeRulesFromThresholds,
  pickTodayRecharge,
  recommendBatteryFromScan,
  rechargeMenuForMode,
  resolveDashboardAuthority,
  scoreDrainCheck,
  scoreFullAssessment,
  strongestSupportBattery,
  summarizeContent,
  summarizeRestartRail,
  type AssessmentItem,
  type AssessmentResponse,
  type AssessmentSession,
  type BatteryId,
  type BatteryResult,
  type BatteryState,
  type CheckInCompletion,
  type ConsentRecord,
  type ContentDocument,
  type DailyCheckIn,
  type DrivingMode,
  type DrivingModeOrUnsure,
  type DrivingModeRow,
  type EscalationEvent,
  type InstrumentId,
  type OnboardingProgress,
  type OverchargeFlag,
  type PrivacySettings,
  type RestartRailAction,
  type Role,
  type ScanLevel,
  type ScoringThreshold,
  type TuneUp,
  type WorkflowAction,
  type WorkflowStatus,
} from "@thrivelife/shared";

const STORAGE_KEY = "thrivelife.static.v1";

export type StaticApiResult = {
  status: number;
  json: Record<string, unknown>;
};

export type StaticApiRequest = {
  method: string;
  path: string;
  body?: unknown;
  userId: string;
  role: Role;
};

type ScanRow = {
  id: string;
  userId: string;
  sessionId: string;
  ratings: Partial<Record<BatteryId, ScanLevel | null>>;
  recommendedBatteryId: BatteryId | null;
  setAt: string;
};

type DrainRow = {
  id: string;
  userId: string;
  sessionId: string;
  totalScore: number;
  answeredCount: number;
  interventionTriggered: boolean;
  completedAt: string;
};

type RuntimeDoc = {
  sessions: AssessmentSession[];
  responses: AssessmentResponse[];
  batteryResults: BatteryResult[];
  overchargeFlags: OverchargeFlag[];
  drivingModes: DrivingModeRow[];
  scanRecommendations: ScanRow[];
  drainResults: DrainRow[];
  signalCountLogs: Array<{
    id: string;
    userId: string;
    sessionId: string;
    signalCount: number;
    batteriesShowingSignal: BatteryId[];
    suggestedMode: string;
    loggedAt: string;
  }>;
  checkIns: DailyCheckIn[];
  restartRail: Array<{
    id: string;
    userId: string;
    missedAt: string;
    returnedAt: string | null;
    action: RestartRailAction | null;
    usedPlanB: boolean;
  }>;
  tuneUps: TuneUp[];
  escalationEvents: EscalationEvent[];
  consentRecords: ConsentRecord[];
  onboarding: OnboardingProgress[];
  privacyByUser: Record<string, PrivacySettings>;
  telemetry: Array<{
    id: string;
    userId: string;
    sessionId: string | null;
    kind: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
};

type StaticState = {
  content: ContentDocument;
  runtime: RuntimeDoc;
};

const memoryMap = new Map<string, string>();

function storageGet(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  } catch {
    /* private mode */
  }
  return memoryMap.get(key) ?? null;
}

function storageSet(key: string, value: string): void {
  memoryMap.set(key, value);
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
    /* ignore quota */
  }
}

function storageRemove(key: string): void {
  memoryMap.delete(key);
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function emptyRuntime(): RuntimeDoc {
  return {
    sessions: [],
    responses: [],
    batteryResults: [],
    overchargeFlags: [],
    drivingModes: [],
    scanRecommendations: [],
    drainResults: [],
    signalCountLogs: [],
    checkIns: [],
    restartRail: [],
    tuneUps: [],
    escalationEvents: [],
    consentRecords: [],
    onboarding: [],
    privacyByUser: {},
    telemetry: [],
  };
}

let cached: StaticState | null = null;

function loadState(): StaticState {
  if (cached) return cached;
  try {
    const raw = storageGet(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StaticState>;
      cached = {
        content: parsed.content ?? createSeedContentDocument(),
        runtime: { ...emptyRuntime(), ...parsed.runtime },
      };
      return cached;
    }
  } catch {
    /* corrupt store */
  }
  cached = {
    content: createSeedContentDocument(),
    runtime: emptyRuntime(),
  };
  return cached;
}

function persist(): void {
  const state = loadState();
  storageSet(STORAGE_KEY, JSON.stringify(state));
}

export function resetStaticBackend(): void {
  cached = null;
  storageRemove(STORAGE_KEY);
  memoryMap.clear();
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function json(status: number, payload: Record<string, unknown>): StaticApiResult {
  return { status, json: payload };
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

function isBatteryId(value: unknown): value is BatteryId {
  return (BATTERY_IDS as readonly string[]).includes(String(value));
}

function isMode(value: unknown): value is DrivingModeOrUnsure {
  return value === "green" || value === "yellow" || value === "red" || value === "unsure";
}

function isCompletion(value: unknown): value is CheckInCompletion {
  return (
    value === "yes" ||
    value === "partly" ||
    value === "not_today" ||
    value === "changed"
  );
}

function parseScanLevel(value: unknown): ScanLevel | null {
  if (value === "low" || value === "steady" || value === "full") return value;
  return null;
}

function parseDrivingMode(value: unknown): DrivingModeOrUnsure | null {
  if (value === "green" || value === "yellow" || value === "red" || value === "unsure") {
    return value;
  }
  return null;
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

function latestCompletedSession(
  runtime: RuntimeDoc,
  userId: string,
  instrumentId: InstrumentId,
): AssessmentSession | null {
  const rows = runtime.sessions
    .filter(
      (s) =>
        s.userId === userId &&
        s.instrumentId === instrumentId &&
        s.status === "completed" &&
        s.completedAt,
    )
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  return rows[0] ?? null;
}

function inProgressSession(
  runtime: RuntimeDoc,
  userId: string,
  instrumentId: InstrumentId,
): AssessmentSession | null {
  return (
    runtime.sessions.find(
      (s) =>
        s.userId === userId &&
        s.instrumentId === instrumentId &&
        s.status === "in_progress",
    ) ?? null
  );
}

function responsesForSession(
  runtime: RuntimeDoc,
  sessionId: string,
): AssessmentResponse[] {
  return runtime.responses.filter((r) => r.sessionId === sessionId);
}

function answersMap(responses: AssessmentResponse[]): Record<string, number | null> {
  const map: Record<string, number | null> = {};
  for (const row of responses) {
    if (typeof row.answer === "number") map[row.itemId] = row.answer;
    else if (row.answer === null || row.skipped) map[row.itemId] = null;
  }
  return map;
}

function activeItems(content: ContentDocument, instrumentId: InstrumentId): AssessmentItem[] {
  return content.items.filter((item) => item.instrumentId === instrumentId && item.active);
}

function requireContentTools(role: Role): StaticApiResult | null {
  if (!canAccessContentTools(role)) {
    return json(role === "user" ? 403 : 401, {
      error: "forbidden",
      message: "Content tools need an editor, reviewer, or admin role.",
    });
  }
  return null;
}

function buildDashboard(userId: string): Record<string, unknown> {
  const { content, runtime } = loadState();
  const fa = latestCompletedSession(runtime, userId, "full_assessment");
  const scan = [...runtime.scanRecommendations]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.setAt.localeCompare(a.setAt))[0];
  const mode = [...runtime.drivingModes]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.setAt.localeCompare(a.setAt))[0];
  const drain = [...runtime.drainResults]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];

  const batteryResults = fa
    ? runtime.batteryResults.filter((r) => r.sessionId === fa.id)
    : [];
  const batteryStates: Partial<Record<BatteryId, BatteryState | null>> = {};
  for (const row of batteryResults) batteryStates[row.batteryId] = row.batteryState;
  const overcharge = fa
    ? (runtime.overchargeFlags.find((o) => o.sessionId === fa.id) ?? null)
    : null;

  const authority = resolveDashboardAuthority({
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

  const names = Object.fromEntries(content.batteries.map((b) => [b.id, b.name]));
  const declared =
    authority.declaredDrivingMode.value === "unsure" ||
    authority.declaredDrivingMode.value == null
      ? "yellow"
      : authority.declaredDrivingMode.value;

  const depleted = mostDepletedBattery(batteryResults);
  const stabilizing = mostStabilizingStartingPoint(batteryResults);
  const support = strongestSupportBattery(batteryResults);
  const onboarding = runtime.onboarding.find((o) => o.userId === userId);
  const rec = pickTodayRecharge({
    lookups: content.recommendationLookups,
    actions: content.rechargeActions,
    mode: declared,
    priority: {
      drainCompletedThisSession: Boolean(drain?.interventionTriggered),
      scanSetAt: scan?.setAt ?? null,
      scanRecommendedBatteryId: scan?.recommendedBatteryId ?? null,
      fullAssessmentCompletedAt: fa?.completedAt ?? null,
      fullMostDepletedBatteryId: depleted,
    },
    memberContext: {
      contextAnswers: onboarding?.contextAnswers,
      checkIns: runtime.checkIns
        .filter((c) => c.userId === userId)
        .map((c) => ({
          rechargeSelected: c.rechargeSelected,
          completion: c.completion,
          batteryId: c.batteryId,
        })),
    },
  });

  const previousFa = runtime.sessions
    .filter(
      (s) =>
        s.userId === userId &&
        s.instrumentId === "full_assessment" &&
        s.status === "completed" &&
        s.id !== fa?.id,
    )
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];

  let escalation = { tier: null as 1 | 2 | null, message: null as string | null };
  if (fa) {
    const prevStates: Partial<Record<BatteryId, BatteryState | null>> = {};
    if (previousFa) {
      for (const row of runtime.batteryResults.filter((r) => r.sessionId === previousFa.id)) {
        prevStates[row.batteryId] = row.batteryState;
      }
    }
    const prevPhysical = previousFa
      ? (runtime.batteryResults.find(
          (r) => r.sessionId === previousFa.id && r.batteryId === "physical",
        )?.capacityScore ?? null)
      : null;
    const currPhysical =
      batteryResults.find((r) => r.batteryId === "physical")?.capacityScore ?? null;
    const lastTier1 = runtime.escalationEvents
      .filter((e) => e.userId === userId && e.tier === 1)
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))[0];
    const lastTier2 = runtime.escalationEvents
      .filter((e) => e.userId === userId && e.tier === 2)
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))[0];
    escalation = evaluateEscalation({
      previous: previousFa
        ? {
            completedAt: previousFa.completedAt ?? previousFa.startedAt,
            batteryStates: prevStates,
            physicalCapacity: prevPhysical,
          }
        : null,
      current: {
        completedAt: fa.completedAt ?? fa.startedAt,
        batteryStates,
        physicalCapacity: currPhysical,
      },
      lastTier1At: lastTier1?.triggeredAt ?? null,
      lastTier2At: lastTier2?.triggeredAt ?? null,
    });
  }

  const checkIns = runtime.checkIns
    .filter((c) => c.userId === userId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const snapshots = runtime.sessions
    .filter(
      (s) =>
        s.userId === userId &&
        s.instrumentId === "full_assessment" &&
        s.status === "completed",
    )
    .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""))
    .map((s) => ({
      sessionId: s.id,
      completedAt: s.completedAt,
      version: s.version,
      states: runtime.batteryResults
        .filter((r) => r.sessionId === s.id)
        .map((r) => ({
          batteryId: r.batteryId,
          state: r.batteryState,
          label: r.batteryState ? BATTERY_STATE_LABELS[r.batteryState] : "Incomplete",
        })),
    }));

  const naItemIds = Array.isArray(fa?.resultSummary?.naItemIds)
    ? (fa.resultSummary.naItemIds as string[])
    : [];
  const itemCount = content.items.filter((i) => i.instrumentId === "full_assessment").length;

  return {
    authority,
    batteries: content.batteries,
    batteryNames: names,
    elements: {
      mostDepletedBatteryId: depleted,
      mostStabilizingBatteryId: stabilizing,
      strongestSupportBatteryId: support,
      overcharge: authority.overchargeFlag.value,
      todayRecharge: rec,
    },
    menus: rechargeMenuForMode(content.rechargeActions, declared, rec.batteryId ?? undefined),
    copy: {
      partial: copyByKey(content.contentCopy, "results.partial_dashboard"),
      safety: copyByKey(content.contentCopy, "safety.always_available"),
    },
    charts: {
      assessmentSnapshots: snapshots,
      checkInSeries: checkIns.map((c) => ({
        date: c.date,
        completion: c.completion,
        mode: c.mode,
        batteryId: c.batteryId,
      })),
    },
    escalation,
    naRewriteFlag: fa ? naRewriteFlag(naItemIds.length, Math.max(itemCount, 1)) : false,
    incompleteBatteryIds:
      typeof fa?.resultSummary?.incompleteBatteryIds === "object"
        ? fa?.resultSummary?.incompleteBatteryIds
        : [],
    reminders: {
      due: onboarding ? dueFullAssessmentPrompts(onboarding) : [],
      notificationsEnabled:
        (runtime.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS).notificationsEnabled,
    },
    staticHost: true,
  };
}

function completeDrain(
  runtime: RuntimeDoc,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
) {
  assertInstrumentWriteAllowed("drain_check", "drain_session_intervention");
  const scored = scoreDrainCheck(answersMap(responses));
  const row: DrainRow = {
    id: newId("drain"),
    userId,
    sessionId: session.id,
    totalScore: scored.totalScore,
    answeredCount: scored.answeredCount,
    interventionTriggered: scored.interventionTriggered,
    completedAt: now,
  };
  runtime.drainResults = runtime.drainResults.filter((r) => r.sessionId !== session.id);
  runtime.drainResults.push(row);
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
  content: ContentDocument,
  runtime: RuntimeDoc,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
) {
  assertInstrumentWriteAllowed("battery_scan", "scan_markers");
  const ratings: Partial<Record<BatteryId, ScanLevel | null>> = {};
  const items = activeItems(content, "battery_scan");
  for (const batteryId of BATTERY_IDS) {
    const item = items.find((i) => i.batteryId === batteryId);
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
  for (const response of responses) {
    if (!response.itemId.endsWith("__followup")) continue;
    const baseId = response.itemId.replace(/__followup$/, "");
    const baseItem = items.find((i) => i.id === baseId);
    if (!baseItem?.batteryId) continue;
    const level = parseScanLevel(
      typeof response.answer === "string" ? response.answer.toLowerCase() : response.answer,
    );
    if (level === "low" || level === "steady") {
      ratings[baseItem.batteryId as BatteryId] = level;
    }
  }
  const recommendedBatteryId = recommendBatteryFromScan(ratings);
  const row: ScanRow = {
    id: newId("scan"),
    userId,
    sessionId: session.id,
    ratings,
    recommendedBatteryId,
    setAt: now,
  };
  runtime.scanRecommendations = runtime.scanRecommendations.filter(
    (r) => r.sessionId !== session.id,
  );
  runtime.scanRecommendations.push(row);
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
  content: ContentDocument,
  runtime: RuntimeDoc,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
) {
  assertInstrumentWriteAllowed("full_assessment", "battery_rings");
  const scored = scoreFullAssessment({
    items: content.items,
    constructs: content.constructs,
    thresholds: content.scoringThresholds,
    answers: answersMap(responses),
    overchargeRules: overchargeRulesFromThresholds(content.scoringThresholds),
  });
  runtime.batteryResults = runtime.batteryResults.filter((r) => r.sessionId !== session.id);
  const batteryRows: BatteryResult[] = scored.batteryResults.map((row) => ({
    id: newId("bres"),
    sessionId: session.id,
    batteryId: row.batteryId,
    capacityScore: row.capacity.status === "ok" ? row.capacity.score : null,
    strainScore: row.strain.status === "ok" ? row.strain.score : null,
    rechargeScore: row.recharge.status === "ok" ? row.recharge.score : null,
    batteryState: row.batteryState,
    computedAt: now,
  }));
  runtime.batteryResults.push(...batteryRows);
  runtime.overchargeFlags = runtime.overchargeFlags.filter((o) => o.sessionId !== session.id);
  const overcharge: OverchargeFlag = {
    id: newId("oc"),
    sessionId: session.id,
    isFlagged: scored.overcharge.isFlagged,
    contributingBatteries: scored.overcharge.contributingBatteries,
    dismissed: false,
    dismissedAt: null,
  };
  runtime.overchargeFlags.push(overcharge);
  runtime.signalCountLogs.push({
    id: newId("sig"),
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
      message: scored.overcharge.isFlagged ? OVERCHARGE_APPROVED_MESSAGE : null,
    },
    naItemIds: scored.naItemIds,
    batteryResults: scored.batteryResults,
  };
  return { scored, overcharge, batteryRows };
}

function completeWeeklyMode(
  content: ContentDocument,
  runtime: RuntimeDoc,
  session: AssessmentSession,
  userId: string,
  responses: AssessmentResponse[],
  now: string,
  body: Record<string, unknown>,
) {
  assertInstrumentWriteAllowed("weekly_mode_check", "declared_driving_mode");
  const modeItem = activeItems(content, "weekly_mode_check")[0];
  const response = modeItem ? responses.find((r) => r.itemId === modeItem.id) : undefined;
  const declared =
    parseDrivingMode(body.declaredMode) ??
    (typeof response?.answer === "string"
      ? parseDrivingMode(response.answer.toLowerCase())
      : null);
  if (!declared) throw new Error("declared_mode_required");
  const fa = latestCompletedSession(runtime, userId, "full_assessment");
  let suggestedMode: DrivingMode | null = null;
  if (fa && typeof fa.resultSummary?.suggestedMode === "string") {
    const raw = fa.resultSummary.suggestedMode;
    if (DRIVING_MODES.includes(raw as DrivingMode)) suggestedMode = raw as DrivingMode;
  }
  const row: DrivingModeRow = {
    id: newId("mode"),
    userId,
    declaredMode: declared,
    suggestedMode,
    setAt: now,
    source: "weekly_check",
  };
  runtime.drivingModes.push(row);
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

const COLLECTION_NAMES = [
  "batteries",
  "constructs",
  "instruments",
  "responseScales",
  "items",
  "rechargeActions",
  "scoringThresholds",
  "thresholdAuditLog",
  "contentCopy",
  "recommendationLookups",
  "signals",
  "workflowEvents",
] as const;

type CollectionName = (typeof COLLECTION_NAMES)[number];

function isCollectionName(value: string): value is CollectionName {
  return (COLLECTION_NAMES as readonly string[]).includes(value);
}

function handleContent(req: StaticApiRequest): StaticApiResult | null {
  const { path, method, role, userId } = req;
  const body = asRecord(req.body);

  if (path === "/api/health" && method === "GET") {
    return json(200, {
      ok: true,
      store: "static-localStorage",
      contentStore: "browser localStorage",
      sessionsStore: "browser localStorage",
      supabaseUrl: null,
      region: "static-pages",
      cloudPersist: false,
      mailer: { resend: false, smtpNoted: false },
      message:
        "GitHub Pages has no Node /api. Member data stays in this browser until you run npm run dev or a Node host.",
    });
  }

  if (path === "/api/support" && method === "GET") {
    return json(200, {
      disclaimer:
        "ThriveLife is a wellness and self-reflection tool. It does not provide diagnosis, treatment, or emergency support.",
      alwaysAvailable: true,
      scoreTriggered: false,
      resources: SUPPORT_RESOURCES,
    });
  }

  if (!path.startsWith("/api/content")) return null;

  const denied = requireContentTools(role);
  if (denied && path !== "/api/health") return denied;

  if (path === "/api/content" && method === "GET") {
    const content = loadState().content;
    return json(200, { summary: summarizeContent(content), document: content });
  }
  if (path === "/api/content/summary" && method === "GET") {
    return json(200, summarizeContent(loadState().content) as unknown as Record<string, unknown>);
  }
  if (path === "/api/content/reset" && method === "POST") {
    if (!ROLE_PERMISSIONS[role].canEditThresholds) {
      return json(403, { error: "forbidden" });
    }
    const state = loadState();
    state.content = createSeedContentDocument();
    persist();
    return json(200, {
      ok: true,
      summary: summarizeContent(state.content),
      message: "Re-seeded from shared fixtures (this browser only).",
    });
  }

  const workflowMatch = matchPath(path, "/api/content/:collection/:id/workflow");
  if (workflowMatch && method === "POST") {
    const collection = workflowMatch.collection ?? "";
    if (!isCollectionName(collection)) return json(404, { error: "unknown_collection" });
    const action = body.action as WorkflowAction;
    if (
      action !== "submit_review" &&
      action !== "approve" &&
      action !== "publish" &&
      action !== "unpublish" &&
      action !== "archive"
    ) {
      return json(400, { error: "invalid_action" });
    }
    const state = loadState();
    const list = state.content[collection];
    if (!Array.isArray(list)) return json(404, { error: "unknown_collection" });
    const row = (list as Array<{ id: string; workflowStatus?: WorkflowStatus }>).find(
      (item) => item.id === workflowMatch.id,
    );
    if (!row) return json(404, { error: "not_found" });
    const from = row.workflowStatus ?? "published";
    if (!canTransitionWorkflow(from, action, ROLE_PERMISSIONS[role])) {
      return json(403, { error: "forbidden_workflow" });
    }
    const to = applyWorkflowAction(from, action);
    row.workflowStatus = to;
    state.content.workflowEvents.unshift({
      id: newId("wf"),
      collection,
      recordId: row.id,
      fromStatus: from,
      toStatus: to,
      action,
      actorRole: role,
      actorUserId: userId,
      at: new Date().toISOString(),
    });
    persist();
    return json(200, { item: row });
  }

  const collectionMatch = matchPath(path, "/api/content/:collection");
  if (collectionMatch) {
    const collection = collectionMatch.collection ?? "";
    if (!isCollectionName(collection)) return json(404, { error: "unknown_collection" });
    if (method === "GET") {
      return json(200, { items: loadState().content[collection] as unknown[] });
    }
    if (method === "POST") {
      if (collection === "scoringThresholds" && !ROLE_PERMISSIONS[role].canEditThresholds) {
        return json(403, { error: "forbidden" });
      }
      const state = loadState();
      const created = { id: typeof body.id === "string" ? body.id : newId("row"), ...body };
      (state.content[collection] as unknown as unknown[]).push(created);
      persist();
      return json(201, { item: created });
    }
  }

  const itemMatch = matchPath(path, "/api/content/:collection/:id");
  if (itemMatch) {
    const collection = itemMatch.collection ?? "";
    const id = itemMatch.id ?? "";
    if (!isCollectionName(collection)) return json(404, { error: "unknown_collection" });
    const state = loadState();
    const list = state.content[collection] as unknown as Array<{ id: string }>;
    const item = list.find((row) => row.id === id);
    if (method === "GET") {
      if (!item) return json(404, { error: "not_found" });
      if (collection === "constructs") {
        const variants = state.content.items.filter((row) => row.constructId === id);
        return json(200, {
          item,
          timeframeVariants: {
            moment: variants.filter((v) => v.timeframe === "moment"),
            twoWeek: variants.filter((v) => v.timeframe === "two_week"),
          },
        });
      }
      return json(200, { item });
    }
    if (method === "PATCH" || method === "PUT") {
      if (collection === "scoringThresholds" && !ROLE_PERMISSIONS[role].canEditThresholds) {
        return json(403, { error: "forbidden" });
      }
      if (!item) return json(404, { error: "not_found" });
      const beforeThreshold =
        collection === "scoringThresholds" ? { ...(item as ScoringThreshold) } : null;
      Object.assign(item, body, { id: item.id });
      if (collection === "scoringThresholds" && beforeThreshold) {
        const next = item as ScoringThreshold;
        state.content.thresholdAuditLog.unshift({
          id: newId("audit"),
          thresholdId: id,
          changedAt: new Date().toISOString(),
          changedByRole: role,
          changedByUserId: userId,
          before: {
            minValue: beforeThreshold.minValue,
            maxValue: beforeThreshold.maxValue,
            levelName: beforeThreshold.levelName,
            description: beforeThreshold.description,
          },
          after: {
            minValue: next.minValue,
            maxValue: next.maxValue,
            levelName: next.levelName,
            description: next.description,
          },
        });
      }
      persist();
      return json(200, { item });
    }
    if (method === "DELETE") {
      if (!item) return json(404, { error: "not_found" });
      const idx = list.findIndex((row) => row.id === id);
      if (idx >= 0) list.splice(idx, 1);
      persist();
      return json(200, { ok: true, softDeleted: false });
    }
  }

  return json(404, { error: "not_found" });
}

function handleMember(req: StaticApiRequest): StaticApiResult | null {
  const { path, method, userId } = req;
  const body = asRecord(req.body);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (path === "/api/me/dashboard" && method === "GET") {
    const progress = loadState().runtime.onboarding.find((o) => o.userId === userId);
    const due = progress ? dueFullAssessmentPrompts(progress) : [];
    return json(200, {
      ...buildDashboard(userId),
      reminderDispatch: { due, sent: [] },
      reminders: {
        due,
        notificationsEnabled:
          (loadState().runtime.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS)
            .notificationsEnabled,
      },
    });
  }

  if (path === "/api/me/reminders" && method === "POST") {
    return json(200, { due: [], sent: [] });
  }

  if (path === "/api/me/check-ins" && method === "GET") {
    const rows = loadState()
      .runtime.checkIns.filter((c) => c.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return json(200, { checkIns: rows });
  }

  if (path === "/api/me/check-ins" && method === "POST") {
    if (!isMode(body.mode) || !isBatteryId(body.batteryId) || !isCompletion(body.completion)) {
      return json(400, { error: "invalid_check_in" });
    }
    const date = localDateKey(new Date().toISOString(), tz);
    const state = loadState();
    const existing = state.runtime.checkIns.find((c) => c.userId === userId && c.date === date);
    const row: DailyCheckIn = {
      id: existing?.id ?? newId("cin"),
      userId,
      mode: body.mode,
      batteryId: body.batteryId,
      rechargeSelected: typeof body.rechargeSelected === "string" ? body.rechargeSelected : null,
      completion: body.completion,
      note: typeof body.note === "string" ? body.note.slice(0, 2000) : null,
      date,
      timezone: tz,
    };
    if (existing) Object.assign(existing, row);
    else state.runtime.checkIns.push(row);
    if (row.completion === "not_today") {
      state.runtime.restartRail.push({
        id: newId("rr"),
        userId,
        missedAt: new Date().toISOString(),
        returnedAt: null,
        action: null,
        usedPlanB: false,
      });
    }
    persist();
    return json(200, { checkIn: row, restartMessage: RESTART_RAIL_MESSAGE });
  }

  if (path === "/api/me/restart-rail" && method === "GET") {
    const runtime = loadState().runtime;
    const events = runtime.restartRail.filter((e) => e.userId === userId);
    const completions = runtime.checkIns
      .filter((c) => c.userId === userId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => c.completion);
    return json(200, {
      message: RESTART_RAIL_MESSAGE,
      events,
      metrics: summarizeRestartRail(events, completions),
    });
  }

  if (path === "/api/me/restart-rail" && method === "POST") {
    const action = body.action as RestartRailAction;
    const usedPlanB = action === "use_plan_b";
    const state = loadState();
    const open = [...state.runtime.restartRail]
      .reverse()
      .find((e) => e.userId === userId && !e.returnedAt);
    if (open) {
      open.returnedAt = new Date().toISOString();
      open.action = action;
      open.usedPlanB = usedPlanB;
    } else {
      state.runtime.restartRail.push({
        id: newId("rr"),
        userId,
        missedAt: new Date().toISOString(),
        returnedAt: new Date().toISOString(),
        action,
        usedPlanB,
      });
    }
    persist();
    return json(200, { ok: true, message: RESTART_RAIL_MESSAGE });
  }

  if (path === "/api/me/tune-ups" && method === "GET") {
    return json(200, {
      tuneUps: loadState().runtime.tuneUps.filter((t) => t.userId === userId),
      supportActions: TUNE_UP_SUPPORT_ACTIONS,
    });
  }

  if (path === "/api/me/tune-ups" && method === "POST") {
    const hasFa = loadState().runtime.sessions.some(
      (s) =>
        s.userId === userId && s.instrumentId === "full_assessment" && s.status === "completed",
    );
    if (!hasFa) {
      return json(409, {
        error: "full_assessment_required",
        message:
          "Tune-Up needs a completed Full Assessment so the starting battery is grounded in two-week capacity — not a guess.",
      });
    }
    if (!isBatteryId(body.batteryId)) return json(400, { error: "invalid_battery" });
    const interval = body.interval === 60 || body.interval === 90 ? body.interval : 30;
    const start = new Date();
    const review = new Date(start);
    review.setUTCDate(review.getUTCDate() + interval);
    const row: TuneUp = {
      id: newId("tu"),
      userId,
      batteryId: body.batteryId,
      interval,
      warningLight: typeof body.warningLight === "string" ? body.warningLight : "",
      dailyActionId: typeof body.dailyActionId === "string" ? body.dailyActionId : null,
      supportAction: typeof body.supportAction === "string" ? body.supportAction : null,
      winDefinition: typeof body.winDefinition === "string" ? body.winDefinition : null,
      startDate: start.toISOString().slice(0, 10),
      reviewDate: review.toISOString().slice(0, 10),
      reviewOutcomes: {},
    };
    loadState().runtime.tuneUps.push(row);
    persist();
    return json(201, { tuneUp: row });
  }

  const tuneReview = matchPath(path, "/api/me/tune-ups/:id/review");
  if (tuneReview && method === "POST") {
    const state = loadState();
    const row = state.runtime.tuneUps.find(
      (t) => t.id === tuneReview.id && t.userId === userId,
    );
    if (!row) return json(404, { error: "not_found" });
    row.reviewOutcomes = {
      whatBecameEasier: body.whatBecameEasier ?? "",
      warningLightDecreased: body.warningLightDecreased ?? "",
      frictionRemained: body.frictionRemained ?? "",
      planBSmallEnough: body.planBSmallEnough ?? "",
      supportHelped: body.supportHelped ?? "",
      choice: body.choice ?? "continue",
      at: new Date().toISOString(),
    };
    persist();
    return json(200, { tuneUp: row });
  }

  if (path === "/api/me/privacy" && method === "GET") {
    return json(200, {
      settings: loadState().runtime.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS,
    });
  }

  if (path === "/api/me/privacy" && method === "PUT") {
    const current = loadState().runtime.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS;
    const next: PrivacySettings = {
      ...current,
      ...(typeof body.notificationsEnabled === "boolean"
        ? { notificationsEnabled: body.notificationsEnabled }
        : {}),
      ...(typeof body.aiFeaturesEnabled === "boolean"
        ? { aiFeaturesEnabled: body.aiFeaturesEnabled }
        : {}),
      ...(typeof body.anonymousAnalytics === "boolean"
        ? { anonymousAnalytics: body.anonymousAnalytics }
        : {}),
      ...(typeof body.futureTeamShare === "boolean"
        ? { futureTeamShare: body.futureTeamShare }
        : {}),
      ...(typeof body.journalRetentionDays === "number" || body.journalRetentionDays === null
        ? { journalRetentionDays: body.journalRetentionDays }
        : {}),
    };
    loadState().runtime.privacyByUser[userId] = next;
    persist();
    return json(200, { settings: next });
  }

  if (path === "/api/me/export" && method === "GET") {
    const state = loadState();
    return json(200, {
      exportedAt: new Date().toISOString(),
      userId,
      sessions: state.runtime.sessions.filter((s) => s.userId === userId),
      responses: state.runtime.responses.filter((r) =>
        state.runtime.sessions.some((s) => s.id === r.sessionId && s.userId === userId),
      ),
      checkIns: state.runtime.checkIns.filter((c) => c.userId === userId),
      tuneUps: state.runtime.tuneUps.filter((t) => t.userId === userId),
      privacy: state.runtime.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS,
    });
  }

  if (path === "/api/me/delete" && method === "POST") {
    const runtime = loadState().runtime;
    runtime.checkIns = runtime.checkIns.filter((c) => c.userId !== userId);
    runtime.restartRail = runtime.restartRail.filter((e) => e.userId !== userId);
    runtime.tuneUps = runtime.tuneUps.filter((t) => t.userId !== userId);
    runtime.escalationEvents = runtime.escalationEvents.filter((e) => e.userId !== userId);
    runtime.consentRecords = runtime.consentRecords.filter((c) => c.userId !== userId);
    runtime.onboarding = runtime.onboarding.filter((o) => o.userId !== userId);
    runtime.telemetry = runtime.telemetry.filter((t) => t.userId !== userId);
    delete runtime.privacyByUser[userId];
    runtime.sessions = runtime.sessions.filter((s) => s.userId !== userId);
    const keep = new Set(runtime.sessions.map((s) => s.id));
    runtime.responses = runtime.responses.filter((r) => keep.has(r.sessionId));
    runtime.batteryResults = runtime.batteryResults.filter((r) => keep.has(r.sessionId));
    runtime.overchargeFlags = runtime.overchargeFlags.filter((r) => keep.has(r.sessionId));
    runtime.drivingModes = runtime.drivingModes.filter((r) => r.userId !== userId);
    runtime.scanRecommendations = runtime.scanRecommendations.filter((r) => r.userId !== userId);
    runtime.drainResults = runtime.drainResults.filter((r) => r.userId !== userId);
    runtime.signalCountLogs = runtime.signalCountLogs.filter((r) => r.userId !== userId);
    persist();
    return json(200, { ok: true, deleted: true });
  }

  if (path === "/api/me/onboarding" && method === "GET") {
    const row = loadState().runtime.onboarding.find((o) => o.userId === userId);
    return json(200, {
      progress: row ?? {
        userId,
        step: 1,
        declinedFullAssessmentAt: null,
        firstRechargeCompletedAt: null,
        contextAnswers: {},
        day3PromptedAt: null,
        day7PromptedAt: null,
        completedAt: null,
      },
    });
  }

  if (path === "/api/me/onboarding" && method === "PUT") {
    const state = loadState();
    const existing = state.runtime.onboarding.find((o) => o.userId === userId);
    const next: OnboardingProgress = {
      userId,
      step: typeof body.step === "number" ? body.step : (existing?.step ?? 1),
      declinedFullAssessmentAt:
        typeof body.declinedFullAssessmentAt === "string"
          ? body.declinedFullAssessmentAt
          : (existing?.declinedFullAssessmentAt ?? null),
      firstRechargeCompletedAt:
        typeof body.firstRechargeCompletedAt === "string"
          ? body.firstRechargeCompletedAt
          : (existing?.firstRechargeCompletedAt ?? null),
      contextAnswers:
        body.contextAnswers && typeof body.contextAnswers === "object"
          ? (body.contextAnswers as Record<string, string>)
          : (existing?.contextAnswers ?? {}),
      day3PromptedAt: existing?.day3PromptedAt ?? null,
      day7PromptedAt: existing?.day7PromptedAt ?? null,
      completedAt:
        typeof body.completedAt === "string" ? body.completedAt : (existing?.completedAt ?? null),
    };
    if (existing) Object.assign(existing, next);
    else state.runtime.onboarding.push(next);
    persist();
    return json(200, { progress: next });
  }

  if (path === "/api/me/consent" && method === "POST") {
    const row: ConsentRecord = {
      id: newId("con"),
      userId,
      version: "v1-fixture",
      acceptedAt: new Date().toISOString(),
      withdrawnAt: null,
    };
    loadState().runtime.consentRecords.push(row);
    persist();
    return json(201, { consent: row });
  }

  if (path === "/api/me/telemetry" && method === "POST") {
    const privacy = loadState().runtime.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS;
    if (!privacy.anonymousAnalytics && body.requireConsent === true) {
      return json(204, { skipped: true });
    }
    loadState().runtime.telemetry.push({
      id: newId("tel"),
      userId,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      kind: typeof body.kind === "string" ? body.kind : "event",
      payload: (body.payload as Record<string, unknown>) ?? {},
      createdAt: new Date().toISOString(),
    });
    persist();
    return json(201, { ok: true });
  }

  if (path.startsWith("/api/me")) return json(404, { error: "not_found" });
  return null;
}

function handleAssessments(req: StaticApiRequest): StaticApiResult | null {
  if (!req.path.startsWith("/api/assessments")) return null;
  const { path, method, userId } = req;
  const body = asRecord(req.body);
  const state = loadState();

  const instrumentMatch = matchPath(path, "/api/assessments/instruments/:instrumentId");
  if (instrumentMatch && method === "GET") {
    const instrumentId = instrumentMatch.instrumentId;
    if (!isInstrumentId(instrumentId)) return json(404, { error: "unknown_instrument" });
    const instrument = state.content.instruments.find((i) => i.id === instrumentId);
    if (!instrument) return json(404, { error: "instrument_not_found" });
    const items = state.content.items.filter(
      (i) => i.instrumentId === instrumentId && i.active,
    );
    const scaleIds = new Set(items.map((i) => i.responseScaleId));
    const scales = state.content.responseScales.filter((s) => scaleIds.has(s.id));
    const constructs = state.content.constructs.filter((c) =>
      items.some((i) => i.constructId === c.id),
    );
    let eligibility: unknown = null;
    if (instrumentId === "full_assessment") {
      const last = latestCompletedSession(state.runtime, userId, "full_assessment");
      eligibility = isFullAssessmentLocked(last?.completedAt ?? null);
    }
    const inProgress = inProgressSession(state.runtime, userId, instrumentId);
    return json(200, {
      instrument,
      items,
      scales,
      batteries: state.content.batteries,
      constructs,
      eligibility,
      inProgressSessionId: inProgress?.id ?? null,
    });
  }

  if (path === "/api/assessments/me/authority" && method === "GET") {
    return json(200, { authority: buildDashboard(userId).authority });
  }

  if (path === "/api/assessments/me/sessions" && method === "GET") {
    const sessions = state.runtime.sessions
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return json(200, { sessions });
  }

  if (path === "/api/assessments/sessions" && method === "POST") {
    const instrumentId = body.instrumentId;
    if (!isInstrumentId(instrumentId)) return json(400, { error: "invalid_instrument" });
    const items = activeItems(state.content, instrumentId);
    const now = new Date().toISOString();
    if (instrumentId === "full_assessment") {
      const last = latestCompletedSession(state.runtime, userId, "full_assessment");
      const lock = isFullAssessmentLocked(last?.completedAt ?? null, now);
      if (lock.locked) {
        return json(423, { error: "full_assessment_locked", ...lock });
      }
    }
    const existing = inProgressSession(state.runtime, userId, instrumentId);
    if (existing && body.forceNew !== true) {
      return json(200, {
        session: existing,
        responses: responsesForSession(state.runtime, existing.id),
        resumed: true,
      });
    }
    if (existing && body.forceNew === true) existing.status = "abandoned";
    const lastSame = latestCompletedSession(state.runtime, userId, instrumentId);
    const session: AssessmentSession = {
      id: newId("sess"),
      userId,
      instrumentId,
      startedAt: now,
      completedAt: null,
      version: items.reduce((max, item) => Math.max(max, item.version), 1),
      intervalSincePreviousDays: lastSame?.completedAt
        ? isFullAssessmentLocked(lastSame.completedAt, now).daysSince
        : null,
      status: "in_progress",
      resultSummary: null,
    };
    state.runtime.sessions.push(session);
    persist();
    return json(201, { session, responses: [], resumed: false });
  }

  const sessionMatch = matchPath(path, "/api/assessments/sessions/:id");
  if (sessionMatch && method === "GET") {
    const session = state.runtime.sessions.find(
      (s) => s.id === sessionMatch.id && s.userId === userId,
    );
    if (!session) return json(404, { error: "session_not_found" });
    return json(200, {
      session,
      responses: responsesForSession(state.runtime, session.id),
      batteryResults: state.runtime.batteryResults.filter((r) => r.sessionId === session.id),
      overchargeFlag:
        state.runtime.overchargeFlags.find((o) => o.sessionId === session.id) ?? null,
    });
  }

  const responsesMatch = matchPath(path, "/api/assessments/sessions/:id/responses");
  if (responsesMatch && method === "PUT") {
    const session = state.runtime.sessions.find(
      (s) => s.id === responsesMatch.id && s.userId === userId,
    );
    if (!session) return json(404, { error: "session_not_found" });
    if (session.status !== "in_progress") return json(409, { error: "session_not_in_progress" });
    const incoming = Array.isArray(body.responses) ? body.responses : [];
    const now = new Date().toISOString();
    for (const raw of incoming) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw as Record<string, unknown>;
      const itemId = typeof row.itemId === "string" ? row.itemId : null;
      if (!itemId) continue;
      const skipped = Boolean(row.skipped);
      let answer: number | string | null = null;
      if (!skipped) {
        if (row.answer === null || row.answer === "na" || row.answer === "unsure") answer = null;
        else if (typeof row.answer === "number" || typeof row.answer === "string") {
          answer = row.answer;
        }
      }
      const existing = state.runtime.responses.find(
        (r) => r.sessionId === session.id && r.itemId === itemId,
      );
      if (existing) {
        existing.answer = answer;
        existing.skipped = skipped;
        existing.timestamp = now;
      } else {
        state.runtime.responses.push({
          id: newId("resp"),
          sessionId: session.id,
          itemId,
          answer,
          skipped,
          timestamp: now,
        });
      }
    }
    persist();
    return json(200, {
      session,
      responses: responsesForSession(state.runtime, session.id),
    });
  }

  const completeMatch = matchPath(path, "/api/assessments/sessions/:id/complete");
  if (completeMatch && method === "POST") {
    const session = state.runtime.sessions.find(
      (s) => s.id === completeMatch.id && s.userId === userId,
    );
    if (!session) return json(404, { error: "session_not_found" });
    if (session.status !== "in_progress") return json(409, { error: "session_not_in_progress" });
    const now = new Date().toISOString();
    const responses = responsesForSession(state.runtime, session.id);
    try {
      let extra: Record<string, unknown> = {};
      if (session.instrumentId === "drain_check") {
        extra = completeDrain(state.runtime, session, userId, responses, now);
      } else if (session.instrumentId === "battery_scan") {
        extra = completeScan(state.content, state.runtime, session, userId, responses, now);
      } else if (session.instrumentId === "full_assessment") {
        extra = completeFullAssessment(
          state.content,
          state.runtime,
          session,
          userId,
          responses,
          now,
        );
      } else if (session.instrumentId === "weekly_mode_check") {
        extra = completeWeeklyMode(
          state.content,
          state.runtime,
          session,
          userId,
          responses,
          now,
          body,
        );
      }
      persist();
      return json(200, { session, ...extra });
    } catch (error) {
      const message = error instanceof Error ? error.message : "error";
      if (message === "declared_mode_required") return json(400, { error: message });
      throw error;
    }
  }

  const dismissMatch = matchPath(path, "/api/assessments/sessions/:id/overcharge/dismiss");
  if (dismissMatch && method === "POST") {
    const flag = state.runtime.overchargeFlags.find((o) => o.sessionId === dismissMatch.id);
    if (!flag) return json(404, { error: "not_found" });
    flag.dismissed = true;
    flag.dismissedAt = new Date().toISOString();
    persist();
    return json(200, { ok: true });
  }

  return json(404, { error: "not_found" });
}

export function dispatchStaticRequest(req: StaticApiRequest): StaticApiResult {
  const method = req.method.toUpperCase();
  const path = req.path.split("?")[0] ?? req.path;
  const next = { ...req, method, path };
  return (
    handleContent(next) ??
    handleMember(next) ??
    handleAssessments(next) ??
    json(404, { error: "not_found" })
  );
}
