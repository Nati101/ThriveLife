# Services

Reserved for background workers and a future split API.

**Phase 2 local API** lives inside `apps/web` as a Vite middleware plugin
(`apps/web/server/`) with a JSON file store at `apps/web/data/content-store.json`.

When moving off the local store, prefer **Postgres in a Canada region**
(PIPA/PIPEDA). Point `DATABASE_URL` in `.env` and replace the file store —
shared types in `@thrivelife/shared` (`schema.ts`, `content-store.ts`) stay the
contract.
