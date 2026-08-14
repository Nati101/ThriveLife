/**
 * Role-gated content API for Vite middleware (local Phase 2).
 * Fail-closed: missing/invalid role → 401/403.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  canAccessContentTools,
  hasPermission,
  isRole,
  type AssessmentItem,
  type Construct,
  type ContentDocument,
  type RechargeAction,
  type ResponseScale,
  type Role,
  type ScoringThreshold,
  type ThresholdAuditEntry,
  summarizeContent,
} from "@thrivelife/shared";
import {
  readContentDocument,
  resetContentDocument,
  touchContentDocument,
} from "./store";

const DEV_ROLE_COOKIE = "tl_dev_role";
const STUB_USER_ID = "stub-user-local";

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

type MutableCollection = Exclude<
  keyof ContentDocument,
  "version" | "seededAt" | "updatedAt"
>;

const COLLECTION_NAMES = [
  "batteries",
  "constructs",
  "instruments",
  "responseScales",
  "items",
  "rechargeActions",
  "scoringThresholds",
  "thresholdAuditLog",
] as const satisfies readonly MutableCollection[];

type CollectionName = (typeof COLLECTION_NAMES)[number];

function isCollectionName(value: string): value is CollectionName {
  return (COLLECTION_NAMES as readonly string[]).includes(value);
}

function assignCollection(
  doc: ContentDocument,
  collection: MutableCollection,
  next: unknown[],
): void {
  switch (collection) {
    case "batteries":
      doc.batteries = next as ContentDocument["batteries"];
      break;
    case "constructs":
      doc.constructs = next as ContentDocument["constructs"];
      break;
    case "instruments":
      doc.instruments = next as ContentDocument["instruments"];
      break;
    case "responseScales":
      doc.responseScales = next as ContentDocument["responseScales"];
      break;
    case "items":
      doc.items = next as ContentDocument["items"];
      break;
    case "rechargeActions":
      doc.rechargeActions = next as ContentDocument["rechargeActions"];
      break;
    case "scoringThresholds":
      doc.scoringThresholds = next as ContentDocument["scoringThresholds"];
      break;
    case "thresholdAuditLog":
      doc.thresholdAuditLog = next as ContentDocument["thresholdAuditLog"];
      break;
    default:
      break;
  }
}

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

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    out[rawKey] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

function roleFromRequest(req: IncomingMessage): Role | null {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[DEV_ROLE_COOKIE];
  if (!raw || !isRole(raw)) return null;
  return raw;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return null;
  return JSON.parse(text) as unknown;
}

function requireContentTools(
  req: IncomingMessage,
  res: ServerResponse,
): Role | null {
  const role = roleFromRequest(req);
  if (!role) {
    sendJson(res, 401, {
      error: "unauthorized",
      message: "Missing or invalid role cookie. Use /dev/role.",
    });
    return null;
  }
  if (!canAccessContentTools(role)) {
    sendJson(res, 403, {
      error: "forbidden",
      message: "Content tools require editor, reviewer, or admin.",
    });
    return null;
  }
  return role;
}

function requireDraft(
  req: IncomingMessage,
  res: ServerResponse,
): Role | null {
  const role = requireContentTools(req, res);
  if (!role) return null;
  if (!hasPermission(role, "canDraftContent")) {
    sendJson(res, 403, {
      error: "forbidden",
      message: "Drafting content requires editor, reviewer, or admin.",
    });
    return null;
  }
  return role;
}

function requireThresholdEdit(
  req: IncomingMessage,
  res: ServerResponse,
): Role | null {
  const role = requireContentTools(req, res);
  if (!role) return null;
  if (!hasPermission(role, "canEditThresholds")) {
    sendJson(res, 403, {
      error: "forbidden",
      message: "Threshold edits require admin.",
    });
    return null;
  }
  return role;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function matchPath(
  pathname: string,
  pattern: string,
): Record<string, string> | null {
  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i]!;
    const actual = pathParts[i]!;
    if (expected.startsWith(":")) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

export async function handleContentApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (!url.pathname.startsWith("/api/")) return false;

  const method = (req.method ?? "GET").toUpperCase();
  const pathname = url.pathname;

  try {
    if (pathname === "/api/health" && method === "GET") {
      sendJson(res, 200, {
        ok: true,
        store: "json-file",
        note: "Postgres (Canada region) planned later",
      });
      return true;
    }

    if (pathname === "/api/content" && method === "GET") {
      if (!requireContentTools(req, res)) return true;
      const doc = readContentDocument();
      sendJson(res, 200, { summary: summarizeContent(doc), document: doc });
      return true;
    }

    if (pathname === "/api/content/summary" && method === "GET") {
      if (!requireContentTools(req, res)) return true;
      sendJson(res, 200, summarizeContent(readContentDocument()));
      return true;
    }

    if (pathname === "/api/content/reset" && method === "POST") {
      const role = requireThresholdEdit(req, res);
      if (!role) return true;
      const doc = resetContentDocument();
      sendJson(res, 200, {
        ok: true,
        summary: summarizeContent(doc),
        message: "Re-seeded from shared fixtures.",
      });
      return true;
    }

    // Collection list / create
    const collectionMatch = matchPath(pathname, "/api/content/:collection");
    if (collectionMatch) {
      const rawCollection = collectionMatch.collection ?? "";
      if (!isCollectionName(rawCollection)) {
        sendJson(res, 404, { error: "unknown_collection" });
        return true;
      }
      const collection: CollectionName = rawCollection;

      if (method === "GET") {
        if (!requireContentTools(req, res)) return true;
        const doc = readContentDocument();
        sendJson(res, 200, { items: doc[collection] });
        return true;
      }

      if (method === "POST") {
        if (collection === "scoringThresholds") {
          const role = requireThresholdEdit(req, res);
          if (!role) return true;
          const body = (await readBody(req)) as Partial<ScoringThreshold>;
          const created: ScoringThreshold = {
            id: typeof body.id === "string" ? body.id : newId("threshold"),
            dimension: body.dimension ?? "capacity",
            levelName: body.levelName ?? "Untitled",
            minValue: body.minValue ?? null,
            maxValue: body.maxValue ?? null,
            description: body.description ?? "",
            isProvisional: body.isProvisional ?? true,
          };
          const doc = touchContentDocument((d) => {
            d.scoringThresholds.push(created);
            d.thresholdAuditLog.unshift({
              id: newId("audit"),
              thresholdId: created.id,
              changedAt: new Date().toISOString(),
              changedByRole: role,
              changedByUserId: STUB_USER_ID,
              before: {
                minValue: null,
                maxValue: null,
                levelName: "(created)",
                description: "",
              },
              after: {
                minValue: created.minValue,
                maxValue: created.maxValue,
                levelName: created.levelName,
                description: created.description,
              },
            });
          });
          sendJson(res, 201, { item: created, document: doc });
          return true;
        }

        const role = requireDraft(req, res);
        if (!role) return true;
        const body = await readBody(req);

        if (collection === "constructs") {
          const input = body as Partial<Construct>;
          const created: Construct = {
            id: typeof input.id === "string" ? input.id : newId("construct"),
            batteryId: input.batteryId ?? "physical",
            dimension: input.dimension ?? "capacity",
            subconstruct: input.subconstruct ?? null,
            definition: input.definition ?? "",
            bookChapterRef: input.bookChapterRef ?? null,
            isFixture: false,
          };
          touchContentDocument((d) => {
            d.constructs.push(created);
          });
          sendJson(res, 201, { item: created });
          return true;
        }

        if (collection === "items") {
          const input = body as Partial<AssessmentItem>;
          const created: AssessmentItem = {
            id: typeof input.id === "string" ? input.id : newId("item"),
            constructId: input.constructId ?? "",
            instrumentId: input.instrumentId ?? "full_assessment",
            batteryId: input.batteryId ?? null,
            timeframe: input.timeframe ?? "two_week",
            wording: input.wording ?? "",
            responseScaleId: input.responseScaleId ?? "scale_frequency_0_4",
            scoringDirection: input.scoringDirection ?? null,
            version: input.version ?? 1,
            active: input.active ?? true,
            isFixture: false,
          };
          touchContentDocument((d) => {
            d.items.push(created);
          });
          sendJson(res, 201, { item: created });
          return true;
        }

        if (collection === "rechargeActions") {
          const input = body as Partial<RechargeAction>;
          const created: RechargeAction = {
            id: typeof input.id === "string" ? input.id : newId("recharge"),
            batteryId: input.batteryId ?? "physical",
            signalId: input.signalId ?? null,
            durationTier: input.durationTier ?? "2min",
            modeSuitability: input.modeSuitability ?? ["green", "yellow", "red"],
            instructions: input.instructions ?? "",
            planAText: input.planAText ?? "",
            planBText: input.planBText ?? "",
            accessibilityVariations: input.accessibilityVariations ?? null,
            healthCaution: input.healthCaution ?? null,
            chapterSource: input.chapterSource ?? null,
            isFixture: false,
          };
          touchContentDocument((d) => {
            d.rechargeActions.push(created);
          });
          sendJson(res, 201, { item: created });
          return true;
        }

        if (collection === "responseScales") {
          const input = body as Partial<ResponseScale>;
          const created: ResponseScale = {
            id: typeof input.id === "string" ? input.id : newId("scale"),
            name: input.name ?? "Untitled scale",
            labels: input.labels ?? [],
            storedType: input.storedType ?? "integer",
            minValue: input.minValue ?? null,
            maxValue: input.maxValue ?? null,
          };
          touchContentDocument((d) => {
            d.responseScales.push(created);
          });
          sendJson(res, 201, { item: created });
          return true;
        }

        sendJson(res, 405, {
          error: "method_not_allowed",
          message: `POST not supported for ${collection}`,
        });
        return true;
      }
    }

    // Item by id
    const itemMatch = matchPath(pathname, "/api/content/:collection/:id");
    if (itemMatch) {
      const rawCollection = itemMatch.collection ?? "";
      if (!isCollectionName(rawCollection)) {
        sendJson(res, 404, { error: "unknown_collection" });
        return true;
      }
      const collection: CollectionName = rawCollection;
      const id = itemMatch.id!;

      if (method === "GET") {
        if (!requireContentTools(req, res)) return true;
        const doc = readContentDocument();
        const list = doc[collection];
        if (!Array.isArray(list)) {
          sendJson(res, 404, { error: "unknown_collection" });
          return true;
        }
        const item = (list as Array<{ id: string }>).find((row) => row.id === id);
        if (!item) {
          sendJson(res, 404, { error: "not_found" });
          return true;
        }
        if (collection === "constructs") {
          const variants = doc.items.filter((row) => row.constructId === id);
          sendJson(res, 200, {
            item,
            timeframeVariants: {
              moment: variants.filter((v) => v.timeframe === "moment"),
              twoWeek: variants.filter((v) => v.timeframe === "two_week"),
            },
          });
          return true;
        }
        sendJson(res, 200, { item });
        return true;
      }

      if (method === "PUT" || method === "PATCH") {
        if (collection === "scoringThresholds") {
          const role = requireThresholdEdit(req, res);
          if (!role) return true;
          const body = (await readBody(req)) as Partial<ScoringThreshold>;
          let updated: ScoringThreshold | null = null;
          touchContentDocument((d) => {
            const idx = d.scoringThresholds.findIndex((row) => row.id === id);
            if (idx < 0) return;
            const before = d.scoringThresholds[idx]!;
            const next: ScoringThreshold = {
              ...before,
              ...body,
              id: before.id,
            };
            d.scoringThresholds[idx] = next;
            updated = next;
            const audit: ThresholdAuditEntry = {
              id: newId("audit"),
              thresholdId: id,
              changedAt: new Date().toISOString(),
              changedByRole: role,
              changedByUserId: STUB_USER_ID,
              before: {
                minValue: before.minValue,
                maxValue: before.maxValue,
                levelName: before.levelName,
                description: before.description,
              },
              after: {
                minValue: next.minValue,
                maxValue: next.maxValue,
                levelName: next.levelName,
                description: next.description,
              },
            };
            d.thresholdAuditLog.unshift(audit);
            d.thresholdAuditLog = d.thresholdAuditLog.slice(0, 200);
          });
          if (!updated) {
            sendJson(res, 404, { error: "not_found" });
            return true;
          }
          sendJson(res, 200, { item: updated });
          return true;
        }

        const role = requireDraft(req, res);
        if (!role) return true;
        const body = (await readBody(req)) as Record<string, unknown>;

        let updated: unknown = null;
        touchContentDocument((d) => {
          const list = d[collection];
          if (!Array.isArray(list)) return;
          const idx = (list as Array<{ id: string }>).findIndex(
            (row) => row.id === id,
          );
          if (idx < 0) return;
          const before = list[idx] as Record<string, unknown>;
          const next = { ...before, ...body, id: before.id };
          // Version bump when assessment item wording changes
          if (
            collection === "items" &&
            typeof body.wording === "string" &&
            body.wording !== before.wording
          ) {
            const prevVersion =
              typeof before.version === "number" ? before.version : 1;
            (next as AssessmentItem).version =
              typeof body.version === "number" ? body.version : prevVersion + 1;
            (next as AssessmentItem).isFixture = false;
          }
          (list as unknown[])[idx] = next;
          updated = next;
        });

        if (!updated) {
          sendJson(res, 404, { error: "not_found" });
          return true;
        }
        sendJson(res, 200, { item: updated });
        return true;
      }

      if (method === "DELETE") {
        if (collection === "scoringThresholds") {
          const role = requireThresholdEdit(req, res);
          if (!role) return true;
        } else {
          if (!requireDraft(req, res)) return true;
        }

        // Soft-deactivate items instead of hard delete when possible
        if (collection === "items" && method === "DELETE") {
          let found = false;
          touchContentDocument((d) => {
            const idx = d.items.findIndex((row) => row.id === id);
            if (idx < 0) return;
            found = true;
            d.items[idx] = { ...d.items[idx]!, active: false, isFixture: false };
          });
          if (!found) {
            sendJson(res, 404, { error: "not_found" });
            return true;
          }
          sendJson(res, 200, {
            ok: true,
            softDeleted: true,
            message: "Item deactivated (historical responses preserved).",
          });
          return true;
        }

        let removed = false;
        const doc = touchContentDocument((d) => {
          const list = d[collection];
          if (!Array.isArray(list)) return;
          const beforeLen = list.length;
          const next = (list as Array<{ id: string }>).filter(
            (row) => row.id !== id,
          );
          assignCollection(d, collection as MutableCollection, next);
          removed = next.length < beforeLen;
        });

        if (!removed) {
          sendJson(res, 404, { error: "not_found" });
          return true;
        }
        sendJson(res, 200, { ok: true, summary: summarizeContent(doc) });
        return true;
      }
    }

    sendJson(res, 404, { error: "not_found", path: pathname });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    sendJson(res, 500, { error: "server_error", message });
    return true;
  }
}

/** Ensure store exists at server boot. */
export function ensureContentStoreReady(): void {
  readContentDocument();
}
