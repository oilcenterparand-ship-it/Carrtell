-- Carrtell SMS system base tables
create table if not exists public.sms_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'manual' check (provider in ('manual','kavenegar','melipayamak','farazsms')),
  is_enabled boolean not null default false,
  sender_number text,
  api_key text,
  api_secret text,
  username text,
  password text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sms_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  title text not null,
  body text not null,
  is_enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  message text not null,
  template_key text,
  related_type text,
  related_id uuid,
  status text not null default 'pending' check (status in ('pending','sent','failed','disabled','manual')),
  provider text default 'manual',
  provider_response jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

alter table public.sms_settings enable row level security;
alter table public.sms_templates enable row level security;
alter table public.sms_logs enable row level security;

-- Development-friendly policies. Tighten these before production if needed.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sms_settings' and policyname='Allow authenticated read sms settings') then
    create policy "Allow authenticated read sms settings" on public.sms_settings for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sms_settings' and policyname='Allow authenticated write sms settings') then
    create policy "Allow authenticated write sms settings" on public.sms_settings for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sms_templates' and policyname='Allow authenticated read sms templates') then
    create policy "Allow authenticated read sms templates" on public.sms_templates for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sms_templates' and policyname='Allow authenticated write sms templates') then
    create policy "Allow authenticated write sms templates" on public.sms_templates for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sms_logs' and policyname='Allow authenticated read sms logs') then
    create policy "Allow authenticated read sms logs" on public.sms_logs for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sms_logs' and policyname='Allow authenticated write sms logs') then
    create policy "Allow authenticated write sms logs" on public.sms_logs for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into public.sms_templates(template_key, title, body, is_enabled)
values
('order_created','ثبت سفارش','سفارش شما در کارتل با کد {{order_code}} ثبت شد و در انتظار بررسی است.', true),
('order_status_changed','تغییر وضعیت سفارش','وضعیت سفارش {{order_code}} به «{{status_label}}» تغییر کرد.', true),
('service_assigned','تخصیص سرویس‌کار','سرویس‌کار کارتل برای درخواست سرویس شما تخصیص داده شد. کد پیگیری: {{service_code}}', true),
('service_on_the_way','اعزام سرویس‌کار','سرویس‌کار کارتل در مسیر شماست. کد پیگیری: {{service_code}}', true),
('service_completed','پایان سرویس','سرویس خودروی شما توسط کارتل انجام شد. ثبت نظر: {{review_link}}', true),
('review_link','لینک نظرسنجی','از انتخاب کارتل ممنونیم. لطفاً نظر خود را ثبت کنید: {{review_link}}', true)
on conflict (template_key) do nothing;

insert into public.sms_settings(provider, is_enabled)
select 'manual', false
where not exists (select 1 from public.sms_settings);
