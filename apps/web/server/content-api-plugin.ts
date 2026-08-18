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
