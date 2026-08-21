/**
 * Production Node host: static SPA + same /api handlers as Vite middleware.
 * Requires NODE_ENV=production and Supabase URL + anon/publishable key for JWT auth.
 *
 *   npm run build -w @thrivelife/web
 *   npm run start -w @thrivelife/web
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rateLimit } from "./rate-limit.ts";
import {
  ensureContentStoreReady,
  handleContentApi,
} from "./content-api.ts";
import {
  ensureAssessmentApiReady,
  handleAssessmentApi,
} from "./assessment-api.ts";
import { handleMemberApi } from "./member-api.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(__dirname, "../.env.local"));
loadEnvFile(path.resolve(__dirname, "../.env"));
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function sendFile(res: http.ServerResponse, filePath: string): void {
  const ext = path.extname(filePath);
  const type = MIME[ext] ?? "application/octet-stream";
  res.statusCode = 200;
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", ext === ".html" ? "no-store" : "public, max-age=86400");
  fs.createReadStream(filePath).pipe(res);
}

function safeJoin(root: string, requestPath: string): string | null {
  const decoded = decodeURIComponent(requestPath.split("?")[0] || "/");
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) return null;
  return full;
}

ensureContentStoreReady();
ensureAssessmentApiReady();

if (!fs.existsSync(distDir)) {
  console.error(
    `[prod] Missing ${distDir}. Run npm run build -w @thrivelife/web first.`,
  );
  process.exit(1);
}

if (process.env.NODE_ENV !== "production") {
  console.warn(
    "[prod] NODE_ENV is not production — JWT is not required. Set NODE_ENV=production for real users.",
  );
}

const server = http.createServer((req, res) => {
  void (async () => {
    try {
      const hostHeader = req.headers.host ?? `127.0.0.1:${port}`;
      const url = new URL(req.url ?? "/", `http://${hostHeader}`);

      if (url.pathname.startsWith("/api/")) {
        const forwarded = req.headers["x-forwarded-for"];
        const ip =
          (typeof forwarded === "string"
            ? forwarded.split(",")[0]?.trim()
            : null) ||
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
        if (await handleMemberApi(req, res, url)) return;
        if (await handleAssessmentApi(req, res, url)) return;
        if (await handleContentApi(req, res, url)) return;
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "not_found" }));
        return;
      }

      let filePath = safeJoin(distDir, url.pathname);
      if (!filePath) {
        res.statusCode = 400;
        res.end("Bad path");
        return;
      }
      if (url.pathname === "/" || !path.extname(filePath)) {
        const asFile = filePath;
        if (
          url.pathname !== "/" &&
          fs.existsSync(asFile) &&
          fs.statSync(asFile).isFile()
        ) {
          sendFile(res, asFile);
          return;
        }
        const indexHtml = path.join(distDir, "index.html");
        sendFile(res, indexHtml);
        return;
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        sendFile(res, path.join(distDir, "index.html"));
        return;
      }
      sendFile(res, filePath);
    } catch (error) {
      console.error("[prod]", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "internal_error" }));
      }
    }
  })();
});

server.listen(port, host, () => {
  console.log(`[prod] ThriveLife listening on http://${host}:${port}`);
  console.log(
    `[prod] JWT required: ${process.env.NODE_ENV === "production" && process.env.TL_ALLOW_DEV_HEADERS !== "1"}`,
  );
});
