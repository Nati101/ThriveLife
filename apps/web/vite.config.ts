import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { thrivelifeContentApiPlugin } from "./server/content-api-plugin.ts";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
const pagesBase = process.env.GITHUB_PAGES === "true" ? "/ThriveLife/" : "/";

export default defineConfig({
  base: process.env.VITE_BASE || pagesBase,
  plugins: [react(), tailwindcss(), thrivelifeContentApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@thrivelife/shared": path.resolve(
        rootDir,
        "../../packages/shared/src/index.ts",
      ),
    },
  },
  server: {
    port: 3000,
    host: "127.0.0.1",
    strictPort: true,
  },
});
