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

/**
 * Vite middleware plugin — mounts /api/* during `npm run dev`.
 * Loads the TypeScript handler via ssrLoadModule so @thrivelife/shared .ts works.
 * Persistence: apps/web/data/content-store.json (gitignored).
 */
export function thrivelifeContentApiPlugin(): Plugin {
  return {
    name: "thrivelife-content-api",
    configureServer(server) {
      const apiPath = path.resolve(serverDir, "content-api.ts");
      let ready = false;

      server.middlewares.use((req, res, next) => {
        void (async () => {
          try {
            const api = (await server.ssrLoadModule(
              apiPath,
            )) as ContentApiModule;
            if (!ready) {
              api.ensureContentStoreReady();
              ready = true;
            }
            const host = req.headers.host ?? "127.0.0.1";
            const url = new URL(req.url ?? "/", `http://${host}`);
            const handled = await api.handleContentApi(req, res, url);
            if (!handled) next();
          } catch (error) {
            next(error);
          }
        })();
      });
    },
  };
}
