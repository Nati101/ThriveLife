-- Content + user tables (spec §10)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  email text,
  timezone text not null default 'America/Edmonton',
  preferences jsonb not null default '{}'::jsonb,
  consent_status text not null default 'unknown'
    check (consent_status in ('unknown', 'accepted', 'withdrawn')),
  notification_settings jsonb not null default '{"remindersEnabled":false}'::jsonb,
  content_pathway text not null default 'default',
  age_verified boolean not null default false,
  role text not null default 'user'
    check (role in ('user', 'editor', 'reviewer', 'admin')),
  privacy_settings jsonb not null default '{"notificationsEnabled":false,"aiFeaturesEnabled":false,"journalRetentionDays":90,"anonymousAnalytics":false,"futureTeamShare":false}'::jsonb,
  onboarding_step integer not null default 0,
  soft_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.batteries (
  id text primary key,
  name text not null,
  covers text not null default '',
  think_of_it_as text not null default '',
  icon text not null default 'circle',
  display_order integer not null,
  book_chapter_ref text,
  is_fixture boolean not null default true
);

create table if not exists public.constructs (
  id text primary key,
  battery_id text not null,
  dimension text not null check (dimension in ('capacity', 'strain', 'recharge', 'mode')),
  subconstruct text,
  definition text not null default '',
  book_chapter_ref text,
  workflow_status text not null default 'published'
    check (workflow_status in ('draft', 'in_review', 'published', 'archived')),
  is_fixture boolean not null default true
);

create index if not exists constructs_battery_id_idx on public.constructs (battery_id);

create table if not exists public.instruments (
  id text primary key,
  name text not null,
  description text not null default '',
  timeframe text not null,
  approximate_item_count integer not null default 0,
  completion_seconds_hint text not null default '',
  dashboard_authority text not null default ''
);

create table if not exists public.response_scales (
  id text primary key,
  name text not null,
  labels jsonb not null default '[]'::jsonb,
  stored_type text not null check (stored_type in ('integer', 'enum')),
  min_value integer,
  max_value integer
);

create table if not exists public.items (
  id text primary key,
  construct_id text not null references public.constructs (id),
  instrument_id text not null references public.instruments (id),
  battery_id text,
  timeframe text not null check (timeframe in ('moment', 'two_week')),
  wording text not null,
  response_scale_id text not null references public.response_scales (id),
  scoring_direction text,
  version integer not null default 1,
  active boolean not null default true,
  workflow_status text not null default 'published'
    check (workflow_status in ('draft', 'in_review', 'published', 'archived')),
  is_fixture boolean not null default true
);

create index if not exists items_construct_id_idx on public.items (construct_id);
create index if not exists items_instrument_active_idx on public.items (instrument_id, active);

create table if not exists public.signals (
  id text primary key,
  battery_id text not null,
  channel text not null check (channel in ('body', 'brain', 'behavior')),
  description text not null default '',
  severity text not null check (severity in ('low', 'moderate', 'high')),
  related_recharge_ids jsonb not null default '[]'::jsonb
);

create table if not exists public.recharge_actions (
  id text primary key,
  battery_id text not null,
  signal_id text,
  duration_tier text not null check (duration_tier in ('60s', '2min', '5min', '10min')),
  mode_suitability jsonb not null default '["green","yellow","red"]'::jsonb,
  instructions text not null default '',
  plan_a_text text not null default '',
  plan_b_text text not null default '',
  accessibility_variations text,
  health_caution text,
  chapter_source text,
  workflow_status text not null default 'published'
    check (workflow_status in ('draft', 'in_review', 'published', 'archived')),
  is_fixture boolean not null default true
);

create index if not exists recharge_actions_battery_id_idx on public.recharge_actions (battery_id);

create table if not exists public.scoring_thresholds (
  id text primary key,
  dimension text not null check (dimension in ('capacity', 'strain', 'recharge')),
  level_name text not null,
  min_value numeric,
  max_value numeric,
  description text not null default '',
  is_provisional boolean not null default true
);

create table if not exists public.threshold_audit_log (
  id text primary key,
  threshold_id text not null,
  changed_at timestamptz not null default now(),
  changed_by_role text not null,
  changed_by_user_id text not null,
  before jsonb not null,
  after jsonb not null
);

create index if not exists threshold_audit_log_threshold_idx
  on public.threshold_audit_log (threshold_id, changed_at desc);

create table if not exists public.content_copy (
  id text primary key,
  kind text not null check (kind in ('result', 'safety', 'notification', 'disclaimer')),
  key text not null unique,
  title text not null,
  body text not null,
  workflow_status text not null default 'published'
    check (workflow_status in ('draft', 'in_review', 'published', 'archived')),
  is_fixture boolean not null default true
);

create table if not exists public.recommendation_lookups (
  id text primary key,
  battery_id text not null,
  signal_id text,
  mode text not null check (mode in ('green', 'yellow', 'red')),
  duration_tier text not null check (duration_tier in ('60s', '2min', '5min', '10min')),
  time_of_day text not null default 'any'
    check (time_of_day in ('any', 'morning', 'afternoon', 'evening')),
  recharge_action_id text not null references public.recharge_actions (id),
  sort_order integer not null default 0,
  workflow_status text not null default 'published'
    check (workflow_status in ('draft', 'in_review', 'published', 'archived')),
  is_fixture boolean not null default true
);

create index if not exists recommendation_lookups_match_idx
  on public.recommendation_lookups (battery_id, mode, sort_order);

create table if not exists public.workflow_events (
  id text primary key,
  collection text not null,
  record_id text not null,
  from_status text not null,
  to_status text not null,
  action text not null,
  actor_role text not null,
  actor_user_id text not null,
  at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index if not exists consent_records_user_idx on public.consent_records (user_id, accepted_at desc);

create table if not exists public.assessment_sessions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  instrument_id text not null references public.instruments (id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  version integer not null default 1,
  interval_since_previous_days integer,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  result_summary jsonb,
  device_type text,
  dwell_ms_by_screen jsonb not null default '{}'::jsonb,
  abandoned_at_item_id text
);

create index if not exists assessment_sessions_user_instrument_idx
  on public.assessment_sessions (user_id, instrument_id, started_at desc);

create table if not exists public.assessment_responses (
  id text primary key,
  session_id text not null references public.assessment_sessions (id) on delete cascade,
  item_id text not null,
  answer jsonb,
  skipped boolean not null default false,
  dwell_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists assessment_responses_session_idx
  on public.assessment_responses (session_id, created_at);

create table if not exists public.battery_results (
  id text primary key,
  session_id text not null references public.assessment_sessions (id) on delete cascade,
  battery_id text not null,
  capacity_score numeric,
  strain_score numeric,
  recharge_score numeric,
  battery_state text,
  computed_at timestamptz not null default now()
);

create index if not exists battery_results_session_idx on public.battery_results (session_id);

create table if not exists public.overcharge_flags (
  id text primary key,
  session_id text not null references public.assessment_sessions (id) on delete cascade,
  is_flagged boolean not null default false,
  contributing_batteries jsonb not null default '[]'::jsonb,
  dismissed boolean not null default false,
  dismissed_at timestamptz
);

create table if not exists public.driving_modes (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  declared_mode text not null check (declared_mode in ('green', 'yellow', 'red', 'unsure')),
  suggested_mode text,
  set_at timestamptz not null default now(),
  source text not null check (source in ('weekly_check', 'onboarding', 'daily_check_in'))
);

create index if not exists driving_modes_user_idx on public.driving_modes (user_id, set_at desc);

create table if not exists public.scan_recommendations (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id text not null,
  ratings jsonb not null default '{}'::jsonb,
  recommended_battery_id text,
  set_at timestamptz not null default now()
);

create index if not exists scan_recommendations_user_idx
  on public.scan_recommendations (user_id, set_at desc);

create table if not exists public.drain_results (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id text not null,
  total_score numeric not null,
  answered_count integer not null,
  intervention_triggered boolean not null default false,
  completed_at timestamptz not null default now()
);

create table if not exists public.signal_count_logs (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id text not null,
  signal_count integer not null,
  batteries_showing_signal jsonb not null default '[]'::jsonb,
  suggested_mode text not null,
  logged_at timestamptz not null default now()
);

create table if not exists public.recharge_plans (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  battery_id text not null,
  warning_light text not null default '',
  plan_a_action_id text,
  plan_b_action_id text,
  cue text not null default '',
  support_action text not null default '',
  start_date date not null default current_date,
  review_date date
);

create index if not exists recharge_plans_user_idx on public.recharge_plans (user_id, start_date desc);

create table if not exists public.daily_check_ins (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null,
  battery_id text not null,
  recharge_selected text,
  completion text not null,
  note text,
  date date not null,
  timezone text not null default 'America/Edmonton'
);

create unique index if not exists daily_check_ins_user_date_idx
  on public.daily_check_ins (user_id, date);

create table if not exists public.restart_rail_events (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  missed_at timestamptz not null default now(),
  returned_at timestamptz,
  action text,
  used_plan_b boolean not null default false
);

create index if not exists restart_rail_events_user_idx
  on public.restart_rail_events (user_id, missed_at desc);

create table if not exists public.tune_ups (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  battery_id text not null,
  interval_days integer not null check (interval_days in (30, 60, 90)),
  warning_light text not null default '',
  daily_action_id text,
  support_action text,
  win_definition text,
  start_date date not null default current_date,
  review_date date,
  review_outcomes jsonb not null default '{}'::jsonb
);

create index if not exists tune_ups_user_idx on public.tune_ups (user_id, start_date desc);

create table if not exists public.escalation_events (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier integer not null check (tier in (1, 2)),
  triggered_at timestamptz not null default now(),
  message_shown text not null,
  dismissed boolean not null default false,
  dismissed_at timestamptz
);

create index if not exists escalation_events_user_idx
  on public.escalation_events (user_id, triggered_at desc);

create table if not exists public.onboarding_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  step integer not null default 1,
  declined_full_assessment_at timestamptz,
  first_recharge_completed_at timestamptz,
  context_answers jsonb not null default '{}'::jsonb,
  day3_prompted_at timestamptz,
  day7_prompted_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.telemetry_events (
  id text primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  session_id text,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists telemetry_events_user_idx
  on public.telemetry_events (user_id, created_at desc);

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = (select auth.uid())),
    private.jwt_app_role(),
    'user'
  );
$$;
