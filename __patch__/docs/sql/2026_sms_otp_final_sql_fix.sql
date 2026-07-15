-- Carrtell SMS / OTP Final - SQL compatibility fix
-- Fixes missing sms_settings.test_mode and makes the patch safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.sms_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'test',
  is_enabled boolean not null default false,
  test_mode boolean not null default true,
  api_key text,
  sender_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sms_settings
  add column if not exists provider text not null default 'test',
  add column if not exists is_enabled boolean not null default false,
  add column if not exists test_mode boolean not null default true,
  add column if not exists api_key text,
  add column if not exists sender_number text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.sms_templates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  phone text,
  template_code text,
  message text,
  status text not null default 'test',
  provider text default 'test',
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  purpose text not null default 'login',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sms_templates enable row level security;
alter table public.sms_logs enable row level security;
alter table public.sms_settings enable row level security;
alter table public.otp_codes enable row level security;

drop policy if exists "sms settings readable" on public.sms_settings;
create policy "sms settings readable" on public.sms_settings for select using (true);

drop policy if exists "sms settings dev write" on public.sms_settings;
create policy "sms settings dev write" on public.sms_settings for all using (true) with check (true);

drop policy if exists "sms templates readable" on public.sms_templates;
create policy "sms templates readable" on public.sms_templates for select using (true);

drop policy if exists "sms templates dev write" on public.sms_templates;
create policy "sms templates dev write" on public.sms_templates for all using (true) with check (true);

drop policy if exists "sms logs readable" on public.sms_logs;
create policy "sms logs readable" on public.sms_logs for select using (true);

drop policy if exists "sms logs dev write" on public.sms_logs;
create policy "sms logs dev write" on public.sms_logs for all using (true) with check (true);

drop policy if exists "otp dev access" on public.otp_codes;
create policy "otp dev access" on public.otp_codes for all using (true) with check (true);

insert into public.sms_settings(provider, is_enabled, test_mode)
select 'test', false, true
where not exists (select 1 from public.sms_settings);

insert into public.sms_templates(code, title, body)
values
  ('otp_login', 'کد ورود', 'کد ورود شما به کارتل: {{code}}'),
  ('order_created', 'ثبت سفارش', 'سفارش شما با شماره {{order_id}} ثبت شد.'),
  ('payment_success', 'پرداخت موفق', 'پرداخت سفارش {{order_id}} با موفقیت انجام شد.'),
  ('order_status', 'تغییر وضعیت سفارش', 'وضعیت سفارش {{order_id}}: {{status}}'),
  ('driver_assigned', 'اعزام سرویس‌کار', 'سرویس‌کار کارتل برای سفارش {{order_id}} مشخص شد.'),
  ('review_link', 'لینک نظرسنجی', 'از تجربه خود با کارتل برای سفارش {{order_id}} نظر بدهید: {{link}}')
on conflict (code) do nothing;
