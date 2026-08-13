begin;
do $$ begin create type public.app_role as enum ('customer','technician','admin'); exception when duplicate_object then null; end $$;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 phone text unique, full_name text, role public.app_role not null default 'customer', is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles for select to authenticated using (id=auth.uid());
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,phone,full_name,role) values(new.id,new.phone,new.raw_user_meta_data->>'full_name','customer') on conflict(id) do update set phone=excluded.phone,updated_at=now(); return new; end $$;
drop trigger if exists on_auth_user_created_carrtell on auth.users;
create trigger on_auth_user_created_carrtell after insert or update of phone on auth.users for each row execute function public.handle_new_auth_user();
create or replace function public.prevent_role_self_change() returns trigger language plpgsql as $$ begin if auth.uid()=old.id and new.role<>old.role then raise exception 'role_change_not_allowed'; end if; new.updated_at=now(); return new; end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.prevent_role_self_change();
create table if not exists public.sms_logs (id bigint generated always as identity primary key, phone text, template_key text, status text, provider text default 'kavenegar', provider_response jsonb, created_at timestamptz default now());
alter table public.sms_logs enable row level security;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active); $$;
drop policy if exists "admins_read_sms_logs" on public.sms_logs;
create policy "admins_read_sms_logs" on public.sms_logs for select to authenticated using(public.is_admin());
update public.profiles set role='technician' where role::text='driver';
commit;
