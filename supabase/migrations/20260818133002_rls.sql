-- RLS: every public table. Role from profiles / app_metadata — never user_metadata.

alter table public.profiles enable row level security;
alter table public.batteries enable row level security;
alter table public.constructs enable row level security;
alter table public.instruments enable row level security;
alter table public.response_scales enable row level security;
alter table public.items enable row level security;
alter table public.signals enable row level security;
alter table public.recharge_actions enable row level security;
alter table public.scoring_thresholds enable row level security;
alter table public.threshold_audit_log enable row level security;
alter table public.content_copy enable row level security;
alter table public.recommendation_lookups enable row level security;
alter table public.workflow_events enable row level security;
alter table public.consent_records enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.battery_results enable row level security;
alter table public.overcharge_flags enable row level security;
alter table public.driving_modes enable row level security;
alter table public.scan_recommendations enable row level security;
alter table public.drain_results enable row level security;
alter table public.signal_count_logs enable row level security;
alter table public.recharge_plans enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.restart_rail_events enable row level security;
alter table public.tune_ups enable row level security;
alter table public.escalation_events enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.telemetry_events enable row level security;

-- Profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
  );

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Published content readable by members; editors see drafts
create policy batteries_select on public.batteries
  for select to authenticated using (true);
create policy batteries_write on public.batteries
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy instruments_select on public.instruments
  for select to authenticated using (true);
create policy instruments_write on public.instruments
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy response_scales_select on public.response_scales
  for select to authenticated using (true);
create policy response_scales_write on public.response_scales
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy constructs_select on public.constructs
  for select to authenticated
  using (workflow_status = 'published' or (select private.is_content_editor()));
create policy constructs_write on public.constructs
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy items_select on public.items
  for select to authenticated
  using (workflow_status = 'published' or (select private.is_content_editor()));
create policy items_write on public.items
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy signals_select on public.signals
  for select to authenticated using (true);
create policy signals_write on public.signals
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy recharge_select on public.recharge_actions
  for select to authenticated
  using (workflow_status = 'published' or (select private.is_content_editor()));
create policy recharge_write on public.recharge_actions
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy lookups_select on public.recommendation_lookups
  for select to authenticated
  using (workflow_status = 'published' or (select private.is_content_editor()));
create policy lookups_write on public.recommendation_lookups
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy copy_select on public.content_copy
  for select to authenticated
  using (workflow_status = 'published' or (select private.is_content_editor()));
create policy copy_write on public.content_copy
  for all to authenticated
  using ((select private.is_content_editor()))
  with check ((select private.is_content_editor()));

create policy thresholds_select on public.scoring_thresholds
  for select to authenticated using (true);
create policy thresholds_write on public.scoring_thresholds
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy threshold_audit_select on public.threshold_audit_log
  for select to authenticated
  using ((select private.is_content_editor()));
create policy threshold_audit_insert on public.threshold_audit_log
  for insert to authenticated
  with check ((select private.is_admin()));

create policy workflow_events_select on public.workflow_events
  for select to authenticated
  using ((select private.is_content_editor()));
create policy workflow_events_insert on public.workflow_events
  for insert to authenticated
  with check ((select private.is_content_editor()));

-- User-owned rows
create policy consent_own on public.consent_records
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy sessions_own on public.assessment_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy responses_own on public.assessment_responses
  for all to authenticated
  using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy battery_results_own on public.battery_results
  for all to authenticated
  using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy overcharge_own on public.overcharge_flags
  for all to authenticated
  using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy driving_modes_own on public.driving_modes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy scan_own on public.scan_recommendations
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy drain_own on public.drain_results
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy signal_logs_own on public.signal_count_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy plans_own on public.recharge_plans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy checkins_own on public.daily_check_ins
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy restart_own on public.restart_rail_events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy tuneups_own on public.tune_ups
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy escalation_own on public.escalation_events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy onboarding_own on public.onboarding_progress
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy telemetry_own on public.telemetry_events
  for all to authenticated
  using (user_id = (select auth.uid()) or user_id is null)
  with check (user_id = (select auth.uid()) or user_id is null);

-- New auth user → profile. Seed role from app_metadata only.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email, role, age_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'user'),
    true
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
