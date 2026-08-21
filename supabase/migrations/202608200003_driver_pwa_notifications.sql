begin;

insert into public.sms_templates(template_key, title, body, is_enabled)
values (
  'technician_mission_assigned',
  'ماموریت جدید سرویس‌کار',
  'ماموریت جدید Carrtell برای {{customer_name}} به شما تخصیص داده شد. کد: {{service_code}}. پنل سرویس‌کار را باز کنید.',
  true
)
on conflict (template_key) do update
set title = excluded.title,
    body = excluded.body,
    is_enabled = true,
    updated_at = now();

commit;
