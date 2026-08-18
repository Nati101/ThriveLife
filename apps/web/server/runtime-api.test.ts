/**
 * Runtime API tests: RBAC, check-in, onboarding, FA → dashboard, reminders.
 */

import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { after, before, describe, it } from "node:test";
import type { IncomingMessage, ServerResponse } from "node:http";

const tmp = mkdtempSync(path.join(tmpdir(), "tl-api-"));
process.env.TL_CONTENT_STORE_PATH = path.join(tmp, "content.json");
process.env.TL_SESSIONS_STORE_PATH = path.join(tmp, "sessions.json");
process.env.TL_DISABLE_CLOUD = "1";

const { handleContentApi, ensureContentStoreReady } = await import("./content-api.ts");
const { handleMemberApi } = await import("./member-api.ts");
const { handleAssessmentApi, ensureAssessmentApiReady } = await import("./assessment-api.ts");
const { resetRateLimitForTests, rateLimit } = await import("./rate-limit.ts");

type InvokeResult = {
  handled: boolean;
  status: number;
  json: Record<string, unknown>;
};

async function invoke(
  handler: (
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
  ) => Promise<boolean>,
  opts: {
    method: string;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<InvokeResult> {
  const payload = opts.body === undefined ? "" : JSON.stringify(opts.body);
  const req = Readable.from([payload]) as IncomingMessage;
  req.method = opts.method;
  req.url = opts.path;
  req.headers = {
    host: "127.0.0.1",
    "content-type": "application/json",
    ...opts.headers,
  };

  let status = 200;
  let raw = "";
  const res = {
    get statusCode() {
      return status;
    },
    set statusCode(value: number) {
      status = value;
    },
    setHeader() {},
    end(chunk?: string) {
      raw += chunk ?? "";
    },
  } as unknown as ServerResponse;

  const handled = await handler(req, res, new URL(opts.path, "http://127.0.0.1"));
  return {
    handled,
    status,
    json: raw ? (JSON.parse(raw) as Record<string, unknown>) : {},
  };
}

before(() => {
  ensureContentStoreReady();
  ensureAssessmentApiReady();
  resetRateLimitForTests();
});

after(() => {
  resetRateLimitForTests();
});

describe("content RBAC", () => {
  it("GET /api/health is public", async () => {
    const result = await invoke(handleContentApi, { method: "GET", path: "/api/health" });
    assert.equal(result.status, 200);
    assert.equal(result.json.ok, true);
    assert.equal(result.json.region, "ca-central-1");
  });

  it("GET /api/content without role is 401", async () => {
    const result = await invoke(handleContentApi, { method: "GET", path: "/api/content" });
    assert.equal(result.status, 401);
  });

  it("GET /api/content as user is 403", async () => {
    const result = await invoke(handleContentApi, {
      method: "GET",
      path: "/api/content",
      headers: { cookie: "tl_dev_role=user" },
    });
    assert.equal(result.status, 403);
    assert.equal(result.json.error, "forbidden");
  });

  it("GET /api/content as admin is 200", async () => {
    const result = await invoke(handleContentApi, {
      method: "GET",
      path: "/api/content",
      headers: { "x-thrivelife-role": "admin" },
    });
    assert.equal(result.status, 200);
    assert.ok(result.json.document);
  });
});

describe("check-in + onboarding + reminders", () => {
  it("rejects incomplete check-in", async () => {
    const result = await invoke(handleMemberApi, {
      method: "POST",
      path: "/api/me/check-ins",
      body: { mode: "green" },
    });
    assert.equal(result.status, 400);
  });

  it("saves a check-in and restart-rail metrics exclude streaks", async () => {
    const saved = await invoke(handleMemberApi, {
      method: "POST",
      path: "/api/me/check-ins",
      body: {
        mode: "yellow",
        batteryId: "physical",
        rechargeSelected: "plan_b",
        completion: "yes",
        note: "text only",
      },
    });
    assert.equal(saved.status, 200);
    const rail = await invoke(handleMemberApi, { method: "GET", path: "/api/me/restart-rail" });
    const metrics = rail.json.metrics as Record<string, unknown>;
    assert.equal("failedDays" in metrics, false);
    assert.ok(metrics.fourOfSeven);
  });

  it("stores onboarding decline and dispatches Day 3 via mailer log", async () => {
    const put = await invoke(handleMemberApi, {
      method: "PUT",
      path: "/api/me/onboarding",
      body: {
        step: 8,
        declinedFullAssessmentAt: "2026-08-01T00:00:00.000Z",
      },
    });
    assert.equal(put.status, 200);
    await invoke(handleMemberApi, {
      method: "PUT",
      path: "/api/me/privacy",
      body: { notificationsEnabled: true },
    });
    const reminders = await invoke(handleMemberApi, {
      method: "POST",
      path: "/api/me/reminders",
      body: { nowIso: "2026-08-04T12:00:00.000Z" },
    });
    assert.equal(reminders.status, 200);
    const sent = reminders.json.sent as Array<{ kind: string; provider: string }>;
    assert.equal(sent[0]?.kind, "day3");
    assert.equal(sent[0]?.provider, "log");
  });
});

describe("Full Assessment to dashboard", () => {
  it("starts, scores from store thresholds, and fills dashboard rings", async () => {
    const boot = await invoke(handleAssessmentApi, {
      method: "GET",
      path: "/api/assessments/instruments/full_assessment",
    });
    assert.equal(boot.status, 200);
    const items = boot.json.items as Array<{ id: string }>;
    assert.equal(items.length, 56);

    const started = await invoke(handleAssessmentApi, {
      method: "POST",
      path: "/api/assessments/sessions",
      body: { instrumentId: "full_assessment", forceNew: true },
    });
    assert.ok(started.status === 201 || started.status === 200);
    const session = started.json.session as { id: string };
    assert.ok(session.id);

    const saved = await invoke(handleAssessmentApi, {
      method: "PUT",
      path: `/api/assessments/sessions/${session.id}/responses`,
      body: {
        responses: items.map((item) => ({ itemId: item.id, answer: 2, skipped: false })),
      },
    });
    assert.equal(saved.status, 200);

    const completed = await invoke(handleAssessmentApi, {
      method: "POST",
      path: `/api/assessments/sessions/${session.id}/complete`,
      body: {},
    });
    assert.equal(completed.status, 200);
    const scored = completed.json.scored as { dashboardComplete?: boolean };
    assert.equal(scored.dashboardComplete, true);

    const dash = await invoke(handleMemberApi, { method: "GET", path: "/api/me/dashboard" });
    assert.equal(dash.status, 200);
    const authority = dash.json.authority as {
      batteryRings: Array<{ value: string | null }>;
    };
    const ringsWithState = authority.batteryRings.filter((r) => r.value);
    assert.ok(ringsWithState.length >= 5);
    const elements = dash.json.elements as { todayRecharge: { action: unknown } };
    assert.ok(elements.todayRecharge);
  });
});

describe("rate limiter", () => {
  it("allows under the cap and blocks over it", () => {
    resetRateLimitForTests();
    for (let i = 0; i < 5; i += 1) {
      assert.equal(rateLimit("test", 5, 60_000, 1_000).allowed, true);
    }
    assert.equal(rateLimit("test", 5, 60_000, 1_000).allowed, false);
  });
});
