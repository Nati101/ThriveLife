import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { rateLimit } from "./rate-limit.ts";

const serverDir = path.dirname(fileURLToPath(import.meta.url));

type ContentApiModule = {
  ensureContentStoreReady: () => void;
  handleContentApi: (
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
  ) => Promise<boolean>;
};

type AssessmentApiModule = {
  ensureAssessmentApiReady: () => void;
  handleAssessmentApi: (
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
  ) => Promise<boolean>;
};

type MemberApiModule = {
  handleMemberApi: (
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
  ) => Promise<boolean>;
};

/**
 * Vite middleware plugin — mounts /api/* during `npm run dev`.
 */
export function thrivelifeContentApiPlugin(): Plugin {
  return {
    name: "thrivelife-content-api",
    configureServer(server) {
      const contentApiPath = path.resolve(serverDir, "content-api.ts");
      const assessmentApiPath = path.resolve(serverDir, "assessment-api.ts");
      const memberApiPath = path.resolve(serverDir, "member-api.ts");
      let ready = false;

      server.middlewares.use((req, res, next) => {
        void (async () => {
          try {
            const contentApi = (await server.ssrLoadModule(
              contentApiPath,
            )) as ContentApiModule;
            const assessmentApi = (await server.ssrLoadModule(
              assessmentApiPath,
            )) as AssessmentApiModule;
            const memberApi = (await server.ssrLoadModule(
              memberApiPath,
            )) as MemberApiModule;
            if (!ready) {
              contentApi.ensureContentStoreReady();
              assessmentApi.ensureAssessmentApiReady();
              ready = true;
            }
            const host = req.headers.host ?? "127.0.0.1";
            const url = new URL(req.url ?? "/", `http://${host}`);
            if (url.pathname.startsWith("/api/")) {
              const forwarded = req.headers["x-forwarded-for"];
              const ip =
                (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null) ||
                req.socket?.remoteAddress ||
                "local";
              const limit = rateLimit(`api:${ip}`);
              res.setHeader("X-RateLimit-Remaining", String(limit.remaining));
              if (!limit.allowed) {
                res.setHeader("Retry-After", String(limit.retryAfterSec));
                res.statusCode = 429;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(
                  JSON.stringify({
                    error: "rate_limited",
                    retryAfterSec: limit.retryAfterSec,
                  }),
                );
                return;
              }
            }
            if (await memberApi.handleMemberApi(req, res, url)) return;
            if (await assessmentApi.handleAssessmentApi(req, res, url)) return;
            if (await contentApi.handleContentApi(req, res, url)) return;
            next();
          } catch (error) {
            next(error);
          }
        })();
      });
    },
  };
}
