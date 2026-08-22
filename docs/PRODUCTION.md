# Production deploy (real users)

Public signup/login uses **Supabase Auth**. GitHub Pages can host the SPA with Auth when Vite secrets are set. For durable multi-device member data, prefer the Node host (`npm run start`) with JWT verification.

## Public accounts

- Anyone can **Create account** / **Sign in** with email + password.
- Profiles are created automatically (`private.handle_new_user`).
- These emails become **admin** automatically (content tools + thresholds):

  - `japukalo@gmail.com`
  - `n.solomon1512@gmail.com`

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

## GitHub Pages (public SPA)

Set repository secrets, then push / re-run the Pages workflow:

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | `https://bpbfezmierdtproczkpj.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key from Supabase |
| `VITE_SUPABASE_ANON_KEY` | Optional legacy anon JWT |

In Supabase → Authentication → URL configuration:

- **Site URL:** `https://nati101.github.io/ThriveLife/`
- **Redirect URLs:** `https://nati101.github.io/ThriveLife/**`, `http://127.0.0.1:3000/**`

For a smoother public beta, turn **Confirm email** off (or users must confirm before first login).

Without those secrets, the login form stays visible but disabled.

## Run locally as production

```bash
cp .env.example apps/web/.env.local
# fill VITE_SUPABASE_* 

npm run build
npm run start
# → http://127.0.0.1:8080
```

## Hosting checklist (Canada preference)

- [ ] Deploy Node 20+ in or near Canada (`ca-central-1` already used for Supabase)
- [ ] TLS + secrets (URL + publishable key; optional service role)
- [ ] Auth Site URL + redirect URLs for your domain
- [ ] Legal counsel for Privacy/Terms before wide public beta
- [ ] Joel content package before claiming production copy quality

## Smoke test

1. Create account → onboarding → dashboard
2. Sign out / sign in restores the same profile
3. Second account does not see the first user’s data on the Node host
4. Sign up with an admin email → Admin appears in the nav
5. Regular members cannot open `/admin`
