-- Carrtell: OTP login storage + manually managed access users
create extension if not exists pgcrypto;

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists otp_codes_phone_created_idx
  on public.otp_codes (phone, created_at desc);

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone text not null unique,
  role text not null default 'customer' check (role in ('admin', 'driver', 'customer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_access_phone_idx on public.user_access (phone);

alter table public.otp_codes enable row level security;
alter table public.user_access enable row level security;

-- The current project uses its own phone OTP flow from the browser.
-- These policies keep that existing flow operational. Before production,
-- move OTP generation/verification to an Edge Function and restrict policies.
drop policy if exists "otp request insert" on public.otp_codes;
create policy "otp request insert"
  on public.otp_codes for insert
  to anon, authenticated
  with check (true);

drop policy if exists "otp verify select" on public.otp_codes;
create policy "otp verify select"
  on public.otp_codes for select
  to anon, authenticated
  using (true);

drop policy if exists "otp verify update" on public.otp_codes;
create policy "otp verify update"
  on public.otp_codes for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "user access read" on public.user_access;
create policy "user access read"
  on public.user_access for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "user access manage" on public.user_access;
create policy "user access manage"
  on public.user_access for all
  to anon, authenticated
  using (true)
  with check (true);
