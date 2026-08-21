create extension if not exists pgcrypto;

create table if not exists public.staff_login_settings (
  role text primary key check (role in ('admin','technician')),
  username text not null,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.staff_login_settings enable row level security;
revoke all on public.staff_login_settings from anon, authenticated;

insert into public.staff_login_settings(role, username, password_hash)
values
  ('admin', 'admin', encode(digest('admin', 'sha256'), 'hex')),
  ('technician', 'admin', encode(digest('admin', 'sha256'), 'hex'))
on conflict (role) do nothing;
