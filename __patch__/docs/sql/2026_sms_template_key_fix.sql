-- Carrtell SMS Template Key Fix
-- سازگار با نسخه‌های قبلی جدول sms_templates که ستون template_key اجباری دارند

alter table if exists public.sms_templates
  add column if not exists code text,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- اگر template_key وجود دارد ولی code خالی است، code را از template_key پر کن
update public.sms_templates
set code = template_key
where code is null and template_key is not null;

-- اگر code وجود دارد ولی template_key خالی است، template_key را از code پر کن
update public.sms_templates
set template_key = code
where template_key is null and code is not null;

-- قالب‌های اصلی پیامک؛ هر دو ستون template_key و code پر می‌شوند
insert into public.sms_templates(template_key, code, title, body, is_active)
values
  ('otp_login', 'otp_login', 'کد ورود', 'کد ورود شما به کارتل: {{code}}', true),
  ('order_created', 'order_created', 'ثبت سفارش', 'سفارش شما در کارتل با کد {{order_code}} ثبت شد.', true),
  ('payment_success', 'payment_success', 'پرداخت موفق', 'پرداخت سفارش {{order_code}} با موفقیت انجام شد.', true),
  ('order_status', 'order_status', 'تغییر وضعیت سفارش', 'وضعیت سفارش {{order_code}}: {{status}}', true),
  ('driver_assigned', 'driver_assigned', 'اعزام سرویس‌کار', 'سرویس‌کار کارتل برای سفارش {{order_code}} تعیین شد.', true),
  ('review_link', 'review_link', 'لینک نظرسنجی', 'نظر شما برای کارتل مهم است: {{link}}', true)
on conflict do nothing;

-- اطمینان از فعال بودن قالب‌های اصلی
update public.sms_templates
set is_active = true,
    updated_at = now()
where coalesce(code, template_key) in (
  'otp_login',
  'order_created',
  'payment_success',
  'order_status',
  'driver_assigned',
  'review_link'
);
