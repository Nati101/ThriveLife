-- Bootstrap public signup admins and keep roles on signup.
-- Admins: japukalo@gmail.com (Joel), n.solomon1512@gmail.com (Nati)

create or replace function private.is_bootstrap_admin_email(email text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(email, '')) in (
    'japukalo@gmail.com',
    'n.solomon1512@gmail.com'
  );
$$;

revoke all on function private.is_bootstrap_admin_email(text) from public;
grant execute on function private.is_bootstrap_admin_email(text) to postgres, service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_role text := 'user';
begin
  if private.is_bootstrap_admin_email(new.email) then
    assigned_role := 'admin';
  else
    assigned_role := coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'user');
  end if;

  insert into public.profiles (id, display_name, email, role, age_verified)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    assigned_role,
    true
  )
  on conflict (id) do update
    set
      email = excluded.email,
      display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
      role = case
        when private.is_bootstrap_admin_email(excluded.email) then 'admin'
        else public.profiles.role
      end,
      updated_at = now();

  if assigned_role = 'admin' then
    update auth.users
    set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Existing accounts (if they already signed up)
update public.profiles
set role = 'admin', updated_at = now()
where private.is_bootstrap_admin_email(email);

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where private.is_bootstrap_admin_email(email);
