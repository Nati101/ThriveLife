import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

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

/**
 * Vite middleware plugin — mounts /api/* during `npm run dev`.
 * Loads TypeScript handlers via ssrLoadModule so @thrivelife/shared .ts works.
 * Persistence: content-store.json + sessions.json under apps/web/data/ (gitignored).
 */
export function thrivelifeContentApiPlugin(): Plugin {
  return {
    name: "thrivelife-content-api",
    configureServer(server) {
      const contentApiPath = path.resolve(serverDir, "content-api.ts");
      const assessmentApiPath = path.resolve(serverDir, "assessment-api.ts");
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
            if (!ready) {
              contentApi.ensureContentStoreReady();
              assessmentApi.ensureAssessmentApiReady();
              ready = true;
            }
            const host = req.headers.host ?? "127.0.0.1";
            const url = new URL(req.url ?? "/", `http://${host}`);
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
