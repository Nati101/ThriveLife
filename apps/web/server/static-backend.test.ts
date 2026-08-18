import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  dispatchStaticRequest,
  resetStaticBackend,
} from "../src/lib/static-backend.ts";

afterEach(() => {
  resetStaticBackend();
});

describe("static backend (GitHub Pages fallback)", () => {
  it("GET /api/health is public and marks static store", () => {
    const result = dispatchStaticRequest({
      method: "GET",
      path: "/api/health",
      userId: "stub-user-local",
      role: "user",
    });
    assert.equal(result.status, 200);
    assert.equal(result.json.ok, true);
    assert.equal(result.json.store, "static-localStorage");
  });

  it("GET /api/me/dashboard returns fixture batteries without a Node API", () => {
    const result = dispatchStaticRequest({
      method: "GET",
      path: "/api/me/dashboard",
      userId: "stub-user-local",
      role: "user",
    });
    assert.equal(result.status, 200);
    const batteries = result.json.batteries as unknown[];
    assert.ok(Array.isArray(batteries) && batteries.length >= 7);
    assert.equal(result.json.staticHost, true);
  });

  it("bootstraps Full Assessment from shared fixtures", () => {
    const result = dispatchStaticRequest({
      method: "GET",
      path: "/api/assessments/instruments/full_assessment",
      userId: "stub-user-local",
      role: "user",
    });
    assert.equal(result.status, 200);
    const items = result.json.items as unknown[];
    assert.ok(items.length > 0);
  });

  it("persists a check-in in memory", () => {
    const saved = dispatchStaticRequest({
      method: "POST",
      path: "/api/me/check-ins",
      userId: "stub-user-local",
      role: "user",
      body: {
        mode: "yellow",
        batteryId: "physical",
        rechargeSelected: "walk",
        completion: "yes",
      },
    });
    assert.equal(saved.status, 200);
    const listed = dispatchStaticRequest({
      method: "GET",
      path: "/api/me/check-ins",
      userId: "stub-user-local",
      role: "user",
    });
    const rows = listed.json.checkIns as unknown[];
    assert.equal(rows.length, 1);
  });

  it("keeps /api/content fail-closed for the user role", () => {
    const result = dispatchStaticRequest({
      method: "GET",
      path: "/api/content",
      userId: "stub-user-local",
      role: "user",
    });
    assert.equal(result.status, 403);
  });
});
