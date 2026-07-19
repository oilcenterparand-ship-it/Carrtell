-- Carrtell: next service mileage is always entered manually by staff/technician.

alter table if exists public.service_requests
  add column if not exists next_service_set_by uuid references auth.users(id),
  add column if not exists next_service_set_at timestamptz;

alter table if exists public.customer_service_history
  add column if not exists next_service_set_by uuid references auth.users(id),
  add column if not exists next_service_set_at timestamptz;

comment on column public.service_requests.next_service_km is
  'Manual mileage entered by technician/admin; must never be calculated from an interval.';
comment on column public.customer_service_history.next_service_km is
  'Manual mileage entered by technician/admin; must never be calculated from an interval.';

-- Protect obviously invalid values while allowing legacy/null rows.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'service_requests_next_km_after_current') then
    alter table public.service_requests add constraint service_requests_next_km_after_current
      check (next_service_km is null or coalesce(completed_current_km, final_km, current_km, 0) = 0
        or next_service_km > coalesce(completed_current_km, final_km, current_km, 0)) not valid;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'service_history_next_km_after_service') then
    alter table public.customer_service_history add constraint service_history_next_km_after_service
      check (next_service_km is null or service_km = 0 or next_service_km > service_km) not valid;
  end if;
end $$;
