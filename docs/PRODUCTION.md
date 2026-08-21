# Production deploy (real users)

GitHub Pages is a **static demo** only. Real members need a Node host that serves the SPA and `/api` with **Supabase JWT verification**.

## Architecture

```
Browser (Vite SPA)
  Authorization: Bearer <supabase access_token>
        │
        ▼
Node (`npm run start`) — apps/web/server/prod.ts
  Verifies JWT → userId = auth.uid(); role from profiles / app_metadata
  Member + assessment + content handlers (same as npm run dev)
        │
        ▼
JSON store locally (cutover) + optional dual-write to Supabase
Postgres schema/RLS already live in ca-central-1
```

## Required env (server)

Copy `.env.example` → `apps/web/.env.local` (or host secrets):

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | yes | `production` (set by `npm run start`) |
| `VITE_SUPABASE_URL` or `SUPABASE_URL` | yes | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` | yes | JWT verify + profile read |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Dual-write mirrors only — never expose to client |
| `PORT` | optional | Default `8080` |
| `TL_REQUIRE_JWT` | optional | Force JWT even outside production |
| `TL_ALLOW_DEV_HEADERS` | **never in prod** | Would re-enable spoofable headers |
| `VITE_ALLOW_DEMO_AUTH` | no | Set `true` only for fixture demos |

Build-time client flags (Vite embeds them):

| Variable | Notes |
|----------|--------|
| `VITE_SUPABASE_URL` | Required for production Auth UI |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon — never service_role |
| `VITE_ALLOW_DEMO_AUTH` | Omit / false so demo tools stay hidden in prod builds |
| `VITE_BASE` | `/` for a custom domain host |

## Run locally as production

```bash
cp .env.example apps/web/.env.local
# fill VITE_SUPABASE_* (and SUPABASE_* if different on server)

npm run build
npm run start
# → http://127.0.0.1:8080
```

In production mode:

- `/api/me` and assessments require a valid Bearer token
- Demo tools are hidden in the UI
- Content invite codes are disabled (set Joel’s `profiles.role` to `admin` in Supabase)
- Static `localStorage` API fallback is disabled

## Give Joel content access (production)

1. Joel signs up / signs in via `/auth`
2. In Supabase Dashboard → Authentication → Users → Joel → set **App metadata**:
   `{ "role": "admin" }`
3. Or update `public.profiles.role` to `admin` / `editor`
4. Joel refreshes session (sign out / in) and opens `/admin`

## Hosting checklist (Canada preference)

- [ ] Deploy Node 20+ in or near Canada (`ca-central-1` already used for Supabase)
- [ ] TLS termination + `PORT` from the platform
- [ ] Secrets: Supabase URL + publishable key + (optional) service role
- [ ] Confirm email templates / redirect URLs in Supabase Auth for your domain
- [ ] Legal: counsel-signed Privacy + Terms before public beta (in-app pages are drafts)
- [ ] Joel fixture replacement before claiming production content quality
- [ ] Do **not** point real users at GitHub Pages for member data

## Auth on GitHub Pages

Pages can show email/password when these repo secrets are set for the Pages workflow:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)

Without them, the form is visible but disabled and demo stays under **More options**. Member data on Pages still uses browser storage until you deploy the Node host in this guide.