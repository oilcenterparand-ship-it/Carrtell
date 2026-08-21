-- Carrtell OTP Reliability / sms_logs compatibility
-- Safe, idempotent migration for the production schema observed on 2026-08-19.

alter table public.sms_logs
  add column if not exists provider text default 'kavenegar',
  add column if not exists template_key text;

update public.sms_logs
set provider = 'kavenegar'
where provider is null;

create index if not exists sms_logs_phone_created_at_idx
  on public.sms_logs (phone, created_at desc);

NOTIFY pgrst, 'reload schema';
