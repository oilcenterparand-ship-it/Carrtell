-- Carrtell RC1-04: ظرفیت اتمیک رزرو، وضعیت‌های سرویس و آماده‌سازی نقشه/تکنسین
create extension if not exists pgcrypto;

alter table if exists public.booking_slot_reservations
  add column if not exists status text not null default 'active';

create unique index if not exists booking_slot_reservations_request_uidx
  on public.booking_slot_reservations(service_request_id)
  where service_request_id is not null;

create index if not exists booking_slot_reservations_slot_date_idx
  on public.booking_slot_reservations(slot_id, booking_date)
  where status = 'active';

create or replace function public.reserve_booking_slot(
  p_slot_id text,
  p_booking_date date,
  p_service_request_id uuid
)
returns table(success boolean, remaining integer, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_used integer;
begin
  select capacity into v_capacity
  from public.booking_time_slots
  where id = p_slot_id and is_active = true
  for update;

  if v_capacity is null then
    return query select false, 0, 'بازه زمانی معتبر یا فعال نیست.'::text;
    return;
  end if;

  select count(*)::integer into v_used
  from public.booking_slot_reservations
  where slot_id = p_slot_id
    and booking_date = p_booking_date
    and status = 'active';

  if v_used >= v_capacity then
    return query select false, 0, 'ظرفیت این بازه تکمیل شده است.'::text;
    return;
  end if;

  insert into public.booking_slot_reservations(service_request_id, slot_id, booking_date, status)
  values (p_service_request_id, p_slot_id, p_booking_date, 'active')
  on conflict (service_request_id) where service_request_id is not null
  do update set slot_id = excluded.slot_id, booking_date = excluded.booking_date, status = 'active';

  return query select true, greatest(v_capacity - v_used - 1, 0), 'رزرو انجام شد.'::text;
end;
$$;

grant execute on function public.reserve_booking_slot(text,date,uuid) to anon, authenticated;

create or replace function public.release_booking_slot(p_service_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.booking_slot_reservations
  set status = 'released'
  where service_request_id = p_service_request_id and status = 'active';
  return found;
end;
$$;

grant execute on function public.release_booking_slot(uuid) to authenticated;

create or replace function public.get_booking_slots_for_date(p_date date)
returns table(id text,label text,start_time time,end_time time,capacity integer,remaining integer,is_active boolean)
language sql stable security definer set search_path=public as $$
  select s.id,s.label,s.start_time,s.end_time,s.capacity,
    greatest(s.capacity - count(r.id)::integer,0) as remaining,s.is_active
  from public.booking_time_slots s
  left join public.booking_slot_reservations r
    on r.slot_id=s.id and r.booking_date=p_date and r.status='active'
  where s.is_active=true
  group by s.id,s.label,s.start_time,s.end_time,s.capacity,s.is_active
  order by s.start_time;
$$;

grant execute on function public.get_booking_slots_for_date(date) to anon, authenticated;

alter table if exists public.service_requests
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists technician_latitude numeric,
  add column if not exists technician_longitude numeric,
  add column if not exists technician_location_updated_at timestamptz;

create or replace function public.release_slot_when_service_cancelled()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
    update public.booking_slot_reservations set status='released'
      where service_request_id=new.id and status='active';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_release_slot_when_service_cancelled on public.service_requests;
create trigger trg_release_slot_when_service_cancelled
before update of status on public.service_requests
for each row execute function public.release_slot_when_service_cancelled();
