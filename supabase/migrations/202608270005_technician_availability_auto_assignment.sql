-- Carrtell automatic technician availability and mission assignment.

create table if not exists public.service_technician_availability (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.service_technicians(id) on delete cascade,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  max_jobs integer not null default 5 check (max_jobs between 1 and 5),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (technician_id, work_date),
  check (end_time > start_time)
);

create index if not exists service_technician_availability_lookup_idx
  on public.service_technician_availability(work_date, is_available, start_time, end_time);

alter table public.service_technician_availability enable row level security;

drop policy if exists technician_availability_own_read on public.service_technician_availability;
create policy technician_availability_own_read on public.service_technician_availability
for select to authenticated using (technician_id = auth.uid() or public.is_admin());

drop policy if exists technician_availability_own_insert on public.service_technician_availability;
create policy technician_availability_own_insert on public.service_technician_availability
for insert to authenticated with check (technician_id = auth.uid() or public.is_admin());

drop policy if exists technician_availability_own_update on public.service_technician_availability;
create policy technician_availability_own_update on public.service_technician_availability
for update to authenticated using (technician_id = auth.uid() or public.is_admin())
with check (technician_id = auth.uid() or public.is_admin());

grant select, insert, update on public.service_technician_availability to authenticated;

create or replace function public.set_my_tomorrow_availability(
  p_start_time time,
  p_end_time time
)
returns public.service_technician_availability
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.service_technician_availability;
  tomorrow_date date := (timezone('Asia/Tehran', now()))::date + 1;
begin
  if auth.uid() is null or not exists (
    select 1 from public.service_technicians
    where id = auth.uid() and is_active = true
  ) then
    raise exception 'حساب سرویس‌کار فعال نیست.';
  end if;
  if p_end_time <= p_start_time then
    raise exception 'ساعت پایان باید بعد از ساعت شروع باشد.';
  end if;

  insert into public.service_technician_availability
    (technician_id, work_date, start_time, end_time, max_jobs, is_available, updated_at)
  values
    (auth.uid(), tomorrow_date, p_start_time, p_end_time, 5, true, now())
  on conflict (technician_id, work_date) do update set
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    max_jobs = 5,
    is_available = true,
    updated_at = now()
  returning * into result;

  -- Retry already-paid requests that were waiting for a technician to declare availability.
  update public.service_requests
  set preferred_time = preferred_time
  where assigned_driver_id is null
    and payment_status = 'paid'
    and preferred_date::date = tomorrow_date
    and preferred_time::time >= p_start_time
    and preferred_time::time < p_end_time;

  return result;
end;
$$;

revoke all on function public.set_my_tomorrow_availability(time,time) from public;
grant execute on function public.set_my_tomorrow_availability(time,time) to authenticated;

create or replace function public.auto_assign_service_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen record;
  requested_date date;
  requested_time time;
begin
  if coalesce(new.payment_status, '') <> 'paid'
     or new.assigned_driver_id is not null
     or new.preferred_date is null
     or new.preferred_time is null then
    return new;
  end if;

  requested_date := new.preferred_date::date;
  requested_time := new.preferred_time::time;

  -- Serialize assignment for the requested day to prevent concurrent overbooking.
  perform pg_advisory_xact_lock(hashtext('carrtell-auto-assign-' || requested_date::text));

  select
    t.id,
    t.full_name,
    t.phone,
    a.id as availability_id,
    count(sr.id)::integer as assigned_count
  into chosen
  from public.service_technician_availability a
  join public.service_technicians t on t.id = a.technician_id and t.is_active = true
  left join public.service_requests sr
    on sr.assigned_driver_id = t.id
   and sr.preferred_date::date = requested_date
   and sr.status not in ('cancelled')
  where a.work_date = requested_date
    and a.is_available = true
    and requested_time >= a.start_time
    and requested_time < a.end_time
    and not exists (
      select 1 from public.service_requests conflict
      where conflict.assigned_driver_id = t.id
        and conflict.preferred_date::date = requested_date
        and conflict.preferred_time::time = requested_time
        and conflict.status not in ('cancelled')
    )
  group by t.id, t.full_name, t.phone, a.id, a.max_jobs, a.created_at
  having count(sr.id) < least(a.max_jobs, 5)
  order by count(sr.id) desc, a.created_at asc, t.id asc
  limit 1;

  if chosen.id is not null then
    new.assigned_driver_id := chosen.id;
    new.driver_id := chosen.id;
    new.assigned_driver_name := chosen.full_name;
    new.assigned_driver_phone := chosen.phone;
    new.technician_name := chosen.full_name;
    new.status := 'assigned';
    new.assigned_at := now();
    new.scheduled_at := coalesce(new.scheduled_at, (requested_date::text || 'T' || requested_time::text)::timestamp at time zone 'Asia/Tehran');
    new.queue_position := chosen.assigned_count + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_assign_paid_service_request on public.service_requests;
create trigger trg_auto_assign_paid_service_request
before insert or update of payment_status, preferred_date, preferred_time on public.service_requests
for each row execute function public.auto_assign_service_request();

notify pgrst, 'reload schema';
