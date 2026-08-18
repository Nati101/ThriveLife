-- ThriveLife V1 schema (spec §10 + workflow, lookup, telemetry, privacy)
-- Canada Central project. RLS on every public table.
-- Authorization role: profiles.role and auth.jwt() -> app_metadata.role
-- NEVER user_metadata for authorization.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role, anon, authenticated;

create or replace function private.jwt_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(
    coalesce(
      (select auth.jwt() -> 'app_metadata' ->> 'role'),
      ''
    ),
    ''
  );
$$;

create or replace function private.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.jwt_app_role(), 'user');
$$;

create or replace function private.is_content_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_role() in ('editor', 'reviewer', 'admin');
$$;

create or replace function private.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_role() in ('reviewer', 'admin');
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_role() = 'admin';
$$;

grant execute on function private.jwt_app_role() to anon, authenticated;
grant execute on function private.current_role() to anon, authenticated;
grant execute on function private.is_content_editor() to anon, authenticated;
grant execute on function private.is_reviewer() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
