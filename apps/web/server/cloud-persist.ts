/**
 * Optional dual-write to Supabase when URL + service role exist.
 * JSON remains the local source of truth. Never expose service_role to the client.
 */

import type { ContentDocument } from "@thrivelife/shared";
import type { SessionsDocument } from "./sessions-store";

type MirrorRow = {
  id: string;
  user_key: string;
  kind: string;
  payload: unknown;
  updated_at: string;
};

function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    ""
  );
}

function serviceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export function cloudPersistEnabled(): boolean {
  if (process.env.TL_DISABLE_CLOUD === "1") return false;
  return Boolean(supabaseUrl() && serviceRoleKey());
}

async function restUpsert(table: string, rows: unknown[]): Promise<void> {
  if (!cloudPersistEnabled() || rows.length === 0) return;
  const url = `${supabaseUrl()}/rest/v1/${table}`;
  const key = serviceRoleKey();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${table} ${res.status}: ${detail.slice(0, 400)}`);
  }
}

export async function persistSessionsToCloud(
  doc: SessionsDocument,
): Promise<void> {
  if (!cloudPersistEnabled()) return;
  const now = new Date().toISOString();
  const userKeys = new Set<string>();
  for (const row of doc.sessions) userKeys.add(row.userId);
  for (const row of doc.checkIns) userKeys.add(row.userId);
  for (const row of doc.onboarding) userKeys.add(row.userId);
  if (userKeys.size === 0) userKeys.add("stub-user-local");

  const mirrors: MirrorRow[] = [...userKeys].map((userKey) => ({
    id: `sessions:${userKey}`,
    user_key: userKey,
    kind: "sessions_document",
    payload: {
      version: doc.version,
      updatedAt: doc.updatedAt,
      sessions: doc.sessions.filter((s) => s.userId === userKey),
      responses: doc.responses.filter((r) =>
        doc.sessions.some((s) => s.id === r.sessionId && s.userId === userKey),
      ),
      batteryResults: doc.batteryResults.filter((r) =>
        doc.sessions.some((s) => s.id === r.sessionId && s.userId === userKey),
      ),
      overchargeFlags: doc.overchargeFlags.filter((r) =>
        doc.sessions.some((s) => s.id === r.sessionId && s.userId === userKey),
      ),
      drivingModes: doc.drivingModes.filter((r) => r.userId === userKey),
      scanRecommendations: doc.scanRecommendations.filter((r) => r.userId === userKey),
      drainResults: doc.drainResults.filter((r) => r.userId === userKey),
      signalCountLogs: doc.signalCountLogs.filter((r) => r.userId === userKey),
      checkIns: doc.checkIns.filter((c) => c.userId === userKey),
      restartRail: doc.restartRail.filter((e) => e.userId === userKey),
      tuneUps: doc.tuneUps.filter((t) => t.userId === userKey),
      escalationEvents: doc.escalationEvents.filter((e) => e.userId === userKey),
      consentRecords: doc.consentRecords.filter((c) => c.userId === userKey),
      onboarding: doc.onboarding.filter((o) => o.userId === userKey),
      privacy: doc.privacyByUser[userKey] ?? null,
      telemetry: doc.telemetry.filter((t) => t.userId === userKey),
      mailLog: (doc.mailLog ?? []).filter((m) => m.userKey === userKey),
    },
    updated_at: now,
  }));

  try {
    await restUpsert("session_mirrors", mirrors);
  } catch (error) {
    console.warn("[cloud-persist] sessions", error);
  }
}

export async function persistContentToCloud(
  doc: ContentDocument,
): Promise<void> {
  if (!cloudPersistEnabled()) return;
  const now = new Date().toISOString();
  try {
    await restUpsert("session_mirrors", [
      {
        id: "content:v2",
        user_key: "content",
        kind: "content_document",
        payload: doc,
        updated_at: now,
      },
    ]);
    await restUpsert(
      "batteries",
      doc.batteries.map((row) => ({
        id: row.id,
        name: row.name,
        covers: row.covers,
        think_of_it_as: row.thinkOfItAs,
        icon: row.icon,
        display_order: row.displayOrder,
        book_chapter_ref: row.bookChapterRef,
        is_fixture: true,
      })),
    );
    await restUpsert(
      "content_copy",
      doc.contentCopy.map((row) => ({
        id: row.id,
        kind: row.kind,
        key: row.key,
        title: row.title,
        body: row.body,
        workflow_status: row.workflowStatus,
        is_fixture: row.isFixture,
      })),
    );
    await restUpsert(
      "recommendation_lookups",
      doc.recommendationLookups.map((row) => ({
        id: row.id,
        battery_id: row.batteryId,
        signal_id: row.signalId,
        mode: row.mode,
        duration_tier: row.durationTier,
        time_of_day: row.timeOfDay,
        recharge_action_id: row.rechargeActionId,
        sort_order: row.sortOrder,
        workflow_status: row.workflowStatus,
        is_fixture: row.isFixture,
      })),
    );
  } catch (error) {
    console.warn("[cloud-persist] content", error);
  }
}

export async function persistNotificationToCloud(row: {
  id: string;
  userKey: string;
  kind: string;
  toEmail: string;
  subject: string;
  body: string;
  provider: string;
  status: string;
  error?: string;
}): Promise<void> {
  if (!cloudPersistEnabled()) return;
  try {
    await restUpsert("notification_outbox", [
      {
        id: row.id,
        user_key: row.userKey,
        kind: row.kind,
        to_email: row.toEmail,
        subject: row.subject,
        body: row.body,
        provider: row.provider,
        status: row.status,
        created_at: new Date().toISOString(),
        sent_at: row.status === "sent" ? new Date().toISOString() : null,
        error: row.error ?? null,
      },
    ]);
  } catch (error) {
    console.warn("[cloud-persist] notification_outbox", error);
  }
}

export function scheduleCloudPersist(task: () => Promise<void>): void {
  void task().catch((error) => {
    console.warn("[cloud-persist]", error);
  });
}
