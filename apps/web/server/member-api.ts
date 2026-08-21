/**
 * Member APIs: dashboard, check-in, restart rail, tune-up, privacy, onboarding, support.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  BATTERY_STATE_LABELS,
  DEFAULT_PRIVACY_SETTINGS,
  FIXTURE_BATTERIES,
  RESTART_RAIL_MESSAGE,
  SUPPORT_RESOURCES,
  TUNE_UP_SUPPORT_ACTIONS,
  copyByKey,
  evaluateEscalation,
  localDateKey,
  mostDepletedBattery,
  mostStabilizingStartingPoint,
  naRewriteFlag,
  pickTodayRecharge,
  rechargeMenuForMode,
  resolveDashboardAuthority,
  strongestSupportBattery,
  summarizeRestartRail,
  type BatteryId,
  type BatteryState,
  type CheckInCompletion,
  type DrivingMode,
  type DrivingModeOrUnsure,
  type PrivacySettings,
  type RestartRailAction,
  dueFullAssessmentPrompts,
  reminderMessage,
} from "@thrivelife/shared";
import { readContentDocument } from "./store";
import { readSessionsDocument } from "./sessions-store";
import {
  memberNewId,
  readMemberRuntime,
  touchMemberRuntime,
} from "./member-store";
import {
  CONTENT_ACCESS_COOKIE,
  DEV_ROLE_COOKIE,
  readJsonBody,
  sendJson,
  timezoneFromRequest,
} from "./http";
import { inviteCodeMatches } from "./content-invite";
import {
  requireJwtAuth,
  resolveRequestIdentity,
} from "./request-identity";
import { persistNotificationToCloud, scheduleCloudPersist, deleteSessionMirrorsForUser } from "./cloud-persist";
import { sendMail } from "./mailer";

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return readJsonBody(req);
}

async function processDueReminders(userId: string, email: string, nowIso?: string) {
  const due = [] as Array<{ kind: string; subject: string }>;
  const privacy =
    readMemberRuntime().privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS;
  const progress = readMemberRuntime().onboarding.find((o) => o.userId === userId);
  if (!progress) return { due, sent: [] as typeof due };
  const kinds = dueFullAssessmentPrompts(progress, nowIso);
  if (kinds.length === 0) return { due, sent: [] as typeof due };

  const sent: Array<{ kind: string; subject: string; provider: string }> = [];
  for (const kind of kinds) {
    const msg = reminderMessage(kind);
    due.push({ kind: msg.kind, subject: msg.subject });
    if (!privacy.notificationsEnabled) {
      touchMemberRuntime((d) => {
        const row = d.onboarding.find((o) => o.userId === userId);
        if (!row) return;
        if (kind === "day3") row.day3PromptedAt = nowIso ?? new Date().toISOString();
        if (kind === "day7") row.day7PromptedAt = nowIso ?? new Date().toISOString();
        d.mailLog.push({
          id: memberNewId("mail"),
          userKey: userId,
          kind: msg.kind,
          to: email,
          subject: msg.subject,
          body: msg.text,
          provider: "skipped",
          status: "skipped",
          createdAt: nowIso ?? new Date().toISOString(),
          error: "notifications_disabled",
        });
      });
      sent.push({ kind: msg.kind, subject: msg.subject, provider: "skipped" });
      continue;
    }
    const id = memberNewId("mail");
    const result = await sendMail({
      id,
      to: email,
      subject: msg.subject,
      text: msg.text,
      kind: msg.kind,
      userKey: userId,
    });
    touchMemberRuntime((d) => {
      const row = d.onboarding.find((o) => o.userId === userId);
      if (row) {
        if (kind === "day3") row.day3PromptedAt = nowIso ?? new Date().toISOString();
        if (kind === "day7") row.day7PromptedAt = nowIso ?? new Date().toISOString();
      }
      d.mailLog.push({
        id,
        userKey: userId,
        kind: msg.kind,
        to: email,
        subject: msg.subject,
        body: msg.text,
        provider: result.provider,
        status: result.sent ? "sent" : result.provider === "log" ? "logged" : "failed",
        createdAt: nowIso ?? new Date().toISOString(),
        error: result.error ?? null,
      });
    });
    scheduleCloudPersist(() =>
      persistNotificationToCloud({
        id,
        userKey: userId,
        kind: msg.kind,
        toEmail: email,
        subject: msg.subject,
        body: msg.text,
        provider: result.provider,
        status: result.sent ? "sent" : result.provider === "log" ? "logged" : "failed",
        error: result.error,
      }),
    );
    sent.push({ kind: msg.kind, subject: msg.subject, provider: result.provider });
  }
  return { due, sent };
}

function isBatteryId(value: unknown): value is BatteryId {
  return FIXTURE_BATTERIES.some((b) => b.id === value);
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

function buildDashboard(userId: string, drainSession = false) {
  const sessions = readSessionsDocument();
  const content = readContentDocument();
  const member = readMemberRuntime();
  const fa = sessions.sessions
    .filter(
      (s) =>
        s.userId === userId &&
        s.instrumentId === "full_assessment" &&
        s.status === "completed",
    )
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  const scan = [...sessions.scanRecommendations]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.setAt.localeCompare(a.setAt))[0];
  const mode = [...sessions.drivingModes]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.setAt.localeCompare(a.setAt))[0];
  const drain = [...sessions.drainResults]
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];

  const batteryResults = fa
    ? sessions.batteryResults.filter((r) => r.sessionId === fa.id)
    : [];
  const batteryStates: Partial<Record<BatteryId, BatteryState | null>> = {};
  for (const row of batteryResults) batteryStates[row.batteryId] = row.batteryState;
  const overcharge = fa
    ? (sessions.overchargeFlags.find((o) => o.sessionId === fa.id) ?? null)
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

  const onboarding = member.onboarding.find((o) => o.userId === userId);
  const rec = pickTodayRecharge({
    lookups: content.recommendationLookups,
    actions: content.rechargeActions,
    mode: declared,
    priority: {
      drainCompletedThisSession: drainSession || Boolean(drain?.interventionTriggered),
      scanSetAt: scan?.setAt ?? null,
      scanRecommendedBatteryId: scan?.recommendedBatteryId ?? null,
      fullAssessmentCompletedAt: fa?.completedAt ?? null,
      fullMostDepletedBatteryId: depleted,
    },
    memberContext: {
      contextAnswers: onboarding?.contextAnswers,
      checkIns: member.checkIns
        .filter((c) => c.userId === userId)
        .map((c) => ({
          rechargeSelected: c.rechargeSelected,
          completion: c.completion,
          batteryId: c.batteryId,
        })),
    },
  });

  const previousFa = sessions.sessions
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
      for (const row of sessions.batteryResults.filter((r) => r.sessionId === previousFa.id)) {
        prevStates[row.batteryId] = row.batteryState;
      }
    }
    const prevPhysical = previousFa
      ? (sessions.batteryResults.find(
          (r) => r.sessionId === previousFa.id && r.batteryId === "physical",
        )?.capacityScore ?? null)
      : null;
    const currPhysical =
      batteryResults.find((r) => r.batteryId === "physical")?.capacityScore ?? null;
    const lastTier1 = member.escalationEvents
      .filter((e) => e.userId === userId && e.tier === 1)
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))[0];
    const lastTier2 = member.escalationEvents
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

  const checkIns = member.checkIns
    .filter((c) => c.userId === userId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const snapshots = sessions.sessions
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
      states: sessions.batteryResults
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
        (member.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS).notificationsEnabled,
    },
    onboarding: onboarding
      ? {
          step: onboarding.step,
          completedAt: onboarding.completedAt,
          declinedFullAssessmentAt: onboarding.declinedFullAssessmentAt,
          firstRechargeCompletedAt: onboarding.firstRechargeCompletedAt,
          day3PromptedAt: onboarding.day3PromptedAt,
          day7PromptedAt: onboarding.day7PromptedAt,
        }
      : null,
  };
}

export async function handleMemberApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  const pathname = url.pathname;
  const method = (req.method ?? "GET").toUpperCase();

  if (pathname === "/api/auth/content-invite" && method === "POST") {
    if (requireJwtAuth()) {
      sendJson(res, 403, {
        error: "invite_disabled",
        message:
          "Content invite codes are disabled in production. Ask an admin to set your profiles.role to editor or admin.",
      });
      return true;
    }
    const body = await readBody(req);
    const code = typeof body.code === "string" ? body.code : "";
    if (!inviteCodeMatches(code)) {
      sendJson(res, 403, {
        error: "invalid_invite",
        message: "That content invite code is not valid.",
      });
      return true;
    }
    res.appendHeader(
      "Set-Cookie",
      `${DEV_ROLE_COOKIE}=admin; Path=/; SameSite=Lax; Max-Age=31536000`,
    );
    res.appendHeader(
      "Set-Cookie",
      `${CONTENT_ACCESS_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=31536000`,
    );
    sendJson(res, 200, {
      ok: true,
      role: "admin",
      message: "Content owner access granted. Open /admin to edit items and copy.",
    });
    return true;
  }

  if (pathname === "/api/support" && method === "GET") {
    sendJson(res, 200, {
      disclaimer:
        "ThriveLife is a wellness and self-reflection tool. It does not provide diagnosis, treatment, or emergency support.",
      alwaysAvailable: true,
      scoreTriggered: false,
      resources: SUPPORT_RESOURCES,
    });
    return true;
  }

  if (!pathname.startsWith("/api/me")) return false;
  const identity = await resolveRequestIdentity(req);
  if (requireJwtAuth() && identity.source !== "jwt") {
    sendJson(res, 401, {
      error: "unauthorized",
      message: "Sign in with Supabase Auth to use member APIs.",
    });
    return true;
  }
  const userId = identity.userId;
  const timezone = timezoneFromRequest(req);
  const memberEmail = identity.email;

  try {
    if (pathname === "/api/me/dashboard" && method === "GET") {
      const progress = readMemberRuntime().onboarding.find((o) => o.userId === userId);
      const due = progress ? dueFullAssessmentPrompts(progress) : [];
      const reminders = await processDueReminders(userId, memberEmail);
      sendJson(res, 200, {
        ...buildDashboard(userId),
        reminderDispatch: reminders,
        reminders: {
          due,
          notificationsEnabled:
            (readMemberRuntime().privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS)
              .notificationsEnabled,
        },
      });
      return true;
    }

    if (pathname === "/api/me/reminders" && method === "POST") {
      const body = await readBody(req);
      const nowIso = typeof body.nowIso === "string" ? body.nowIso : undefined;
      const reminders = await processDueReminders(
        userId,
        memberEmail,
        nowIso,
      );
      sendJson(res, 200, reminders);
      return true;
    }

    if (pathname === "/api/me/check-ins" && method === "GET") {
      const rows = readMemberRuntime()
        .checkIns.filter((c) => c.userId === userId)
        .sort((a, b) => b.date.localeCompare(a.date));
      sendJson(res, 200, { checkIns: rows });
      return true;
    }

    if (pathname === "/api/me/check-ins" && method === "POST") {
      const body = await readBody(req);
      if (body._parseError) {
        sendJson(res, 400, { error: "invalid_json" });
        return true;
      }
      if (!isMode(body.mode) || !isBatteryId(body.batteryId) || !isCompletion(body.completion)) {
        sendJson(res, 400, { error: "invalid_check_in" });
        return true;
      }
      const date = localDateKey(new Date().toISOString(), timezone);
      let saved = null;
      touchMemberRuntime((d) => {
        const existing = d.checkIns.find((c) => c.userId === userId && c.date === date);
        const row = {
          id: existing?.id ?? memberNewId("cin"),
          userId,
          mode: body.mode as DrivingModeOrUnsure,
          batteryId: body.batteryId as BatteryId,
          rechargeSelected:
            typeof body.rechargeSelected === "string" ? body.rechargeSelected : null,
          completion: body.completion as CheckInCompletion,
          note: typeof body.note === "string" ? body.note.slice(0, 2000) : null,
          date,
          timezone,
        };
        if (existing) {
          Object.assign(existing, row);
          saved = existing;
        } else {
          d.checkIns.push(row);
          saved = row;
        }
        if (row.completion === "not_today") {
          d.restartRail.push({
            id: memberNewId("rr"),
            userId,
            missedAt: new Date().toISOString(),
            returnedAt: null,
            action: null,
            usedPlanB: false,
          });
        }
      });
      sendJson(res, 200, { checkIn: saved, restartMessage: RESTART_RAIL_MESSAGE });
      return true;
    }

    if (pathname === "/api/me/restart-rail" && method === "GET") {
      const member = readMemberRuntime();
      const events = member.restartRail.filter((e) => e.userId === userId);
      const completions = member.checkIns
        .filter((c) => c.userId === userId)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((c) => c.completion);
      sendJson(res, 200, {
        message: RESTART_RAIL_MESSAGE,
        events,
        metrics: summarizeRestartRail(events, completions),
      });
      return true;
    }

    if (pathname === "/api/me/restart-rail" && method === "POST") {
      const body = await readBody(req);
      const action = body.action as RestartRailAction;
      const usedPlanB = action === "use_plan_b";
      touchMemberRuntime((d) => {
        const open = [...d.restartRail]
          .reverse()
          .find((e) => e.userId === userId && !e.returnedAt);
        if (open) {
          open.returnedAt = new Date().toISOString();
          open.action = action;
          open.usedPlanB = usedPlanB;
        } else {
          d.restartRail.push({
            id: memberNewId("rr"),
            userId,
            missedAt: new Date().toISOString(),
            returnedAt: new Date().toISOString(),
            action,
            usedPlanB,
          });
        }
      });
      sendJson(res, 200, { ok: true, message: RESTART_RAIL_MESSAGE });
      return true;
    }

    if (pathname === "/api/me/tune-ups" && method === "GET") {
      sendJson(res, 200, {
        tuneUps: readMemberRuntime().tuneUps.filter((t) => t.userId === userId),
        supportActions: TUNE_UP_SUPPORT_ACTIONS,
      });
      return true;
    }

    if (pathname === "/api/me/tune-ups" && method === "POST") {
      const sessions = readSessionsDocument();
      const hasFa = sessions.sessions.some(
        (s) =>
          s.userId === userId &&
          s.instrumentId === "full_assessment" &&
          s.status === "completed",
      );
      if (!hasFa) {
        sendJson(res, 409, {
          error: "full_assessment_required",
          message:
            "Tune-Up needs a completed Full Assessment so the starting battery is grounded in two-week capacity — not a guess.",
        });
        return true;
      }
      const body = await readBody(req);
      if (!isBatteryId(body.batteryId)) {
        sendJson(res, 400, { error: "invalid_battery" });
        return true;
      }
      const interval = body.interval === 60 || body.interval === 90 ? body.interval : 30;
      const start = new Date();
      const review = new Date(start);
      review.setUTCDate(review.getUTCDate() + interval);
      const row = {
        id: memberNewId("tu"),
        userId,
        batteryId: body.batteryId as BatteryId,
        interval: interval as 30 | 60 | 90,
        warningLight: typeof body.warningLight === "string" ? body.warningLight : "",
        dailyActionId: typeof body.dailyActionId === "string" ? body.dailyActionId : null,
        supportAction: typeof body.supportAction === "string" ? body.supportAction : null,
        winDefinition: typeof body.winDefinition === "string" ? body.winDefinition : null,
        startDate: start.toISOString().slice(0, 10),
        reviewDate: review.toISOString().slice(0, 10),
        reviewOutcomes: {},
      };
      touchMemberRuntime((d) => {
        d.tuneUps.push(row);
      });
      sendJson(res, 201, { tuneUp: row });
      return true;
    }

    const tuneReview = pathname.match(/^\/api\/me\/tune-ups\/([^/]+)\/review$/);
    if (tuneReview && method === "POST") {
      const body = await readBody(req);
      let updated = null;
      touchMemberRuntime((d) => {
        const row = d.tuneUps.find((t) => t.id === decodeURIComponent(tuneReview[1]!) && t.userId === userId);
        if (!row) return;
        row.reviewOutcomes = {
          whatBecameEasier: body.whatBecameEasier ?? "",
          warningLightDecreased: body.warningLightDecreased ?? "",
          frictionRemained: body.frictionRemained ?? "",
          planBSmallEnough: body.planBSmallEnough ?? "",
          supportHelped: body.supportHelped ?? "",
          choice: body.choice ?? "continue",
          at: new Date().toISOString(),
        };
        updated = row;
      });
      if (!updated) {
        sendJson(res, 404, { error: "not_found" });
        return true;
      }
      sendJson(res, 200, { tuneUp: updated });
      return true;
    }

    if (pathname === "/api/me/privacy" && method === "GET") {
      const member = readMemberRuntime();
      sendJson(res, 200, {
        settings: member.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS,
      });
      return true;
    }

    if (pathname === "/api/me/privacy" && method === "PUT") {
      const body = await readBody(req);
      const current =
        readMemberRuntime().privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS;
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
          ? { journalRetentionDays: body.journalRetentionDays as number | null }
          : {}),
      };
      touchMemberRuntime((d) => {
        d.privacyByUser[userId] = next;
      });
      sendJson(res, 200, { settings: next });
      return true;
    }

    if (pathname === "/api/me/export" && method === "GET") {
      const member = readMemberRuntime();
      const sessions = readSessionsDocument();
      sendJson(res, 200, {
        exportedAt: new Date().toISOString(),
        userId,
        sessions: sessions.sessions.filter((s) => s.userId === userId),
        responses: sessions.responses.filter((r) =>
          sessions.sessions.some((s) => s.id === r.sessionId && s.userId === userId),
        ),
        checkIns: member.checkIns.filter((c) => c.userId === userId),
        tuneUps: member.tuneUps.filter((t) => t.userId === userId),
        privacy: member.privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS,
      });
      return true;
    }

    if (pathname === "/api/me/delete" && method === "POST") {
      touchMemberRuntime((d) => {
        d.checkIns = d.checkIns.filter((c) => c.userId !== userId);
        d.restartRail = d.restartRail.filter((e) => e.userId !== userId);
        d.tuneUps = d.tuneUps.filter((t) => t.userId !== userId);
        d.escalationEvents = d.escalationEvents.filter((e) => e.userId !== userId);
        d.consentRecords = d.consentRecords.filter((c) => c.userId !== userId);
        d.onboarding = d.onboarding.filter((o) => o.userId !== userId);
        d.telemetry = d.telemetry.filter((t) => t.userId !== userId);
        delete d.privacyByUser[userId];
        d.sessions = d.sessions.filter((s) => s.userId !== userId);
        const keep = new Set(d.sessions.map((s) => s.id));
        d.responses = d.responses.filter((r) => keep.has(r.sessionId));
        d.batteryResults = d.batteryResults.filter((r) => keep.has(r.sessionId));
        d.overchargeFlags = d.overchargeFlags.filter((r) => keep.has(r.sessionId));
        d.drivingModes = d.drivingModes.filter((r) => r.userId !== userId);
        d.scanRecommendations = d.scanRecommendations.filter((r) => r.userId !== userId);
        d.drainResults = d.drainResults.filter((r) => r.userId !== userId);
        d.signalCountLogs = d.signalCountLogs.filter((r) => r.userId !== userId);
      });
      scheduleCloudPersist(() => deleteSessionMirrorsForUser(userId));
      sendJson(res, 200, { ok: true, deleted: true });
      return true;
    }

    if (pathname === "/api/me/onboarding" && method === "GET") {
      const row = readMemberRuntime().onboarding.find((o) => o.userId === userId);
      sendJson(res, 200, {
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
      return true;
    }

    if (pathname === "/api/me/onboarding" && method === "PUT") {
      const body = await readBody(req);
      let saved = null;
      touchMemberRuntime((d) => {
        const existing = d.onboarding.find((o) => o.userId === userId);
        const next = {
          userId,
          step: typeof body.step === "number" ? body.step : existing?.step ?? 1,
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
            typeof body.completedAt === "string"
              ? body.completedAt
              : (existing?.completedAt ?? null),
        };
        if (existing) Object.assign(existing, next);
        else d.onboarding.push(next);
        saved = next;
      });
      sendJson(res, 200, { progress: saved });
      return true;
    }

    if (pathname === "/api/me/consent" && method === "POST") {
      const row = {
        id: memberNewId("con"),
        userId,
        version: "v1-fixture",
        acceptedAt: new Date().toISOString(),
        withdrawnAt: null,
      };
      touchMemberRuntime((d) => {
        d.consentRecords.push(row);
      });
      sendJson(res, 201, { consent: row });
      return true;
    }

    if (pathname === "/api/me/telemetry" && method === "POST") {
      const body = await readBody(req);
      const privacy =
        readMemberRuntime().privacyByUser[userId] ?? DEFAULT_PRIVACY_SETTINGS;
      if (!privacy.anonymousAnalytics && body.requireConsent === true) {
        sendJson(res, 204, { ok: true, skipped: true });
        return true;
      }
      const row = {
        id: memberNewId("tel"),
        userId,
        sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
        kind: typeof body.kind === "string" ? body.kind : "event",
        payload: (body.payload as Record<string, unknown>) ?? {},
        createdAt: new Date().toISOString(),
      };
      touchMemberRuntime((d) => {
        d.telemetry.push(row);
      });
      sendJson(res, 201, { ok: true });
      return true;
    }

    sendJson(res, 404, { error: "not_found" });
    return true;
  } catch (error) {
    sendJson(res, 500, {
      error: "server_error",
      message: error instanceof Error ? error.message : "error",
    });
    return true;
  }
}
