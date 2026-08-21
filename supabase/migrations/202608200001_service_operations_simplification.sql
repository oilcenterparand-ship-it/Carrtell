-- Carrtell Service Operations Simplification
-- Unifies technician login identities with dispatch assignment identities.

create table if not exists public.service_technicians (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  service_area text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists service_technicians_username_lower_uidx
  on public.service_technicians (lower(username));
create index if not exists service_technicians_active_idx
  on public.service_technicians (is_active, full_name);

-- Preserve the currently working legacy technician account as the first real technician.
insert into public.service_technicians (id, username, password_hash, full_name, phone, is_active)
select
  u.id,
  s.username,
  s.password_hash,
  coalesce(nullif(p.full_name, ''), 'سرویس‌کار Carrtell'),
  p.phone,
  true
from auth.users u
join public.staff_login_settings s on s.role = 'technician'
left join public.profiles p on p.id = u.id
where lower(u.email) = 'carrtell-temp-technician@staff.carrtell.local'
on conflict (id) do update set
  username = excluded.username,
  password_hash = excluded.password_hash,
  full_name = excluded.full_name,
  phone = excluded.phone,
  is_active = true,
  updated_at = now();

create table if not exists public.service_fleet (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid,
  driver_id uuid,
  title text not null,
  plate_number text,
  driver_name text,
  driver_phone text,
  service_area text,
  status text not null default 'active',
  operational_status text not null default 'available',
  shift_ended_at timestamptz,
  last_seen_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_fleet add column if not exists branch_id uuid;
alter table public.service_fleet add column if not exists driver_id uuid;
alter table public.service_fleet add column if not exists title text;
alter table public.service_fleet add column if not exists plate_number text;
alter table public.service_fleet add column if not exists driver_name text;
alter table public.service_fleet add column if not exists driver_phone text;
alter table public.service_fleet add column if not exists service_area text;
alter table public.service_fleet add column if not exists status text default 'active';
alter table public.service_fleet add column if not exists operational_status text default 'available';
alter table public.service_fleet add column if not exists shift_ended_at timestamptz;
alter table public.service_fleet add column if not exists last_seen_at timestamptz;
alter table public.service_fleet add column if not exists notes text;
alter table public.service_fleet add column if not exists created_at timestamptz default now();
alter table public.service_fleet add column if not exists updated_at timestamptz default now();

create index if not exists service_fleet_driver_idx on public.service_fleet(driver_id);
create index if not exists service_fleet_status_idx on public.service_fleet(status);

alter table public.service_technicians enable row level security;
alter table public.service_fleet enable row level security;

drop policy if exists service_technicians_admin_read on public.service_technicians;
create policy service_technicians_admin_read on public.service_technicians
for select to authenticated
using (public.is_admin() or id = auth.uid());

drop policy if exists service_fleet_admin_manage on public.service_fleet;
create policy service_fleet_admin_manage on public.service_fleet
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists service_fleet_technician_read on public.service_fleet;
create policy service_fleet_technician_read on public.service_fleet
for select to authenticated
using (driver_id = auth.uid() or public.is_admin());

grant select on public.service_technicians to authenticated;
grant select, insert, update, delete on public.service_fleet to authenticated;

notify pgrst, 'reload schema';
