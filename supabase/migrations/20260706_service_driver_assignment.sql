-- Carrtell service driver assignment
-- اجرا در Supabase SQL Editor

alter table if exists public.service_requests
  add column if not exists assigned_driver_id uuid null,
  add column if not exists assigned_driver_name text null,
  add column if not exists assigned_driver_phone text null,
  add column if not exists driver_note text null,
  add column if not exists completion_note text null,
  add column if not exists consumed_products text null,
  add column if not exists before_image_url text null,
  add column if not exists after_image_url text null,
  add column if not exists completed_current_km integer null,
  add column if not exists assigned_at timestamptz null,
  add column if not exists started_at timestamptz null,
  add column if not exists arrived_at timestamptz null,
  add column if not exists completed_at timestamptz null;

create index if not exists service_requests_assigned_driver_id_idx
  on public.service_requests (assigned_driver_id);

create index if not exists service_requests_status_idx
  on public.service_requests (status);

-- وضعیت‌های جدید پیشنهادی:
-- pending_review / confirmed / assigned / dispatching / en_route / arrived / in_progress / completed / cancelled
