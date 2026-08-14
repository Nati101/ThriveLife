# Base44 prior app (paste from editor)

Drop copies of the ThriveLife Base44 source here. **Do not pay** for Base44 export — paste what you can already open in the [code editor](https://app.base44.com/apps/6a74e3c6a18bdd8e70a443ae/editor/workspace/code?filePath=vite.config.js).

This folder is empty until files are pasted. Keep `.env` / secrets out (never commit passwords or API keys).

## Workflow

1. In Base44, open **Code** and copy the **file tree** (screenshot or a text list of paths).
2. Paste files here using the **same relative paths** as in the editor.
3. Start with the files below, then the rest of `src/`.

## Checklist (typical Base44 / Vite app)

Copy these first:

- [ ] `package.json`
- [ ] `vite.config.js` or `vite.config.ts`
- [ ] `index.html`
- [ ] `src/` (entire tree: `main`, `App`, `pages/`, `components/`, `lib/`, etc.)

Then, if they appear in the editor:

- [ ] `tailwind.config.js` / `tailwind.config.ts`
- [ ] `postcss.config.js`
- [ ] `jsconfig.json` / `tsconfig.json` / `tsconfig.*.json`
- [ ] `src/index.css` (or other global CSS)
- [ ] `src/pages/` (Base44 page files)
- [ ] `src/components/`
- [ ] `src/api/` or `functions/` (backend functions, if listed)
- [ ] `src/entities/` or entity/schema files
- [ ] `public/` (favicon, assets)
- [ ] `.gitignore` (optional)

Skip: `node_modules/`, `dist/`, lockfiles unless asked, and any file that looks like secrets.

## Optional: Cursor Browser MCP

If **cursor-ide-browser** is enabled in Cursor MCP settings, an agent can open the editor URL and read the file tree after you sign in **in that browser tab**. Do not send passwords in chat.
