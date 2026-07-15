-- Carrtell Auth / Profiles / Roles migration
-- این فایل را یک بار در Supabase SQL Editor اجرا کن.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('admin','driver','customer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.current_user_role() = 'admin');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.current_user_role() = 'admin')
with check (auth.uid() = id or public.current_user_role() = 'admin');

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, phone, role)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone,
    case
      when not exists (select 1 from public.profiles limit 1) then 'admin'
      else 'customer'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute procedure public.create_profile_for_user();

-- ساخت پروفایل برای کاربران قبلی Auth که هنوز profile ندارند.
insert into public.profiles(id, phone, role)
select
  users.id,
  users.phone,
  case
    when not exists (select 1 from public.profiles limit 1) then 'admin'
    else 'customer'
  end
from auth.users users
where not exists (
  select 1 from public.profiles profiles where profiles.id = users.id
);

-- برای تست لوکال، اگر فقط یک کاربر داری و هنوز customer مانده، این خط را جداگانه اجرا کن:
-- update public.profiles set role = 'admin';
