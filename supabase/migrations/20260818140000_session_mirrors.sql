-- Dual-write mirrors for local JSON users (user_key is not always auth.users UUID).
-- Normalized member tables remain for Auth profiles.

create table if not exists public.session_mirrors (
  id text primary key,
  user_key text not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists session_mirrors_user_kind_idx
  on public.session_mirrors (user_key, kind, updated_at desc);

alter table public.session_mirrors enable row level security;

create policy session_mirrors_select_own on public.session_mirrors
  for select to authenticated
  using (user_key = (select auth.uid())::text);

create table if not exists public.notification_outbox (
  id text primary key,
  user_key text not null,
  kind text not null,
  to_email text,
  subject text not null,
  body text not null,
  provider text not null default 'log',
  status text not null default 'queued'
    check (status in ('queued', 'logged', 'sent', 'skipped', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error text
);

create index if not exists notification_outbox_user_idx
  on public.notification_outbox (user_key, created_at desc);

alter table public.notification_outbox enable row level security;

create policy notification_outbox_select_own on public.notification_outbox
  for select to authenticated
  using (user_key = (select auth.uid())::text);
