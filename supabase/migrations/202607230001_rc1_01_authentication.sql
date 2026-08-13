-- Carrtell RC1-01: Authentication & Authorization
-- Safe to run in Supabase SQL Editor. Existing profiles rows are preserved.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  email text,
  full_name text,
  role text not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text not null default 'customer';
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Convert the old driver role to the canonical technician role.
update public.profiles set role = 'technician' where role = 'driver';
update public.profiles set role = 'customer' where role is null or role not in ('customer', 'technician', 'admin');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'technician', 'admin'));

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_phone_idx on public.profiles(phone);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid() and is_active = true), 'customer');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.current_user_role() = 'admin';
$$;

create or replace function public.is_technician()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.current_user_role() = 'technician';
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_technician() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, email, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'customer',
    true
  )
  on conflict (id) do update set
    phone = coalesce(excluded.phone, public.profiles.phone),
    email = coalesce(excluded.email, public.profiles.email),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of phone, email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_new_auth_user();

-- Backfill profiles for existing Auth users.
insert into public.profiles (id, phone, email, full_name, role, is_active)
select
  u.id,
  u.phone,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  'customer',
  true
from auth.users u
on conflict (id) do update set
  phone = coalesce(excluded.phone, public.profiles.phone),
  email = coalesce(excluded.email, public.profiles.email),
  updated_at = now();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
    new.id := old.id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges_trigger on public.profiles;
create trigger protect_profile_privileges_trigger
before update on public.profiles
for each row execute procedure public.protect_profile_privileges();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin_only" on public.profiles;
create policy "profiles_insert_admin_only"
on public.profiles for insert
to authenticated
with check (public.is_admin());

drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only"
on public.profiles for delete
to authenticated
using (public.is_admin());

grant select, update on public.profiles to authenticated;
grant insert, delete on public.profiles to authenticated;

create table if not exists public.auth_role_audit (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  old_role text,
  new_role text not null check (new_role in ('customer', 'technician', 'admin')),
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.audit_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    insert into public.auth_role_audit(target_user_id, old_role, new_role, changed_by)
    values (new.id, old.role, new.role, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists audit_profile_role_change_trigger on public.profiles;
create trigger audit_profile_role_change_trigger
after update of role on public.profiles
for each row execute procedure public.audit_profile_role_change();

alter table public.auth_role_audit enable row level security;
drop policy if exists "auth_role_audit_admin_read" on public.auth_role_audit;
create policy "auth_role_audit_admin_read"
on public.auth_role_audit for select
to authenticated
using (public.is_admin());

commit;
