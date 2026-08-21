-- Carrtell V4.9 - Paid order -> service CRM + technician mission lifecycle
-- Safe/idempotent migration. No secrets are stored here.

create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists service_draft jsonb;

alter table public.service_requests
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists source text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists service_started_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists service_requests_order_id_uidx
  on public.service_requests(order_id)
  where order_id is not null;

create index if not exists service_requests_assigned_status_idx
  on public.service_requests(assigned_driver_id, status);

create table if not exists public.service_crm_events (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists service_crm_events_request_idx
  on public.service_crm_events(service_request_id, created_at desc);

alter table public.service_crm_events enable row level security;

drop policy if exists service_crm_events_admin_read on public.service_crm_events;
create policy service_crm_events_admin_read
on public.service_crm_events for select to authenticated
using (public.is_admin());

drop policy if exists service_crm_events_technician_read on public.service_crm_events;
create policy service_crm_events_technician_read
on public.service_crm_events for select to authenticated
using (
  exists (
    select 1 from public.service_requests sr
    where sr.id = service_request_id
      and (sr.assigned_driver_id = auth.uid() or sr.driver_id = auth.uid())
  )
);

grant select on public.service_crm_events to authenticated;

-- Explicit technician access for assigned missions.
drop policy if exists service_requests_technician_select on public.service_requests;
create policy service_requests_technician_select
on public.service_requests for select to authenticated
using (assigned_driver_id = auth.uid() or driver_id = auth.uid() or public.is_admin());

drop policy if exists service_requests_technician_update on public.service_requests;
create policy service_requests_technician_update
on public.service_requests for update to authenticated
using (assigned_driver_id = auth.uid() or driver_id = auth.uid() or public.is_admin())
with check (assigned_driver_id = auth.uid() or driver_id = auth.uid() or public.is_admin());

create or replace function public.carrtell_attach_order_service_draft(
  p_order_id uuid,
  p_service jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.orders;
begin
  update public.orders
  set service_draft = coalesce(p_service, '{}'::jsonb),
      updated_at = now()
  where id = p_order_id
    and (user_id = auth.uid() or public.is_admin())
  returning * into result;

  if result.id is null then
    raise exception 'سفارش پیدا نشد یا دسترسی ندارید.';
  end if;
  if lower(coalesce(result.delivery_type, '')) <> 'service' then
    raise exception 'این سفارش برای سرویس در محل ثبت نشده است.';
  end if;
  return result;
end;
$$;

revoke all on function public.carrtell_attach_order_service_draft(uuid,jsonb) from public;
grant execute on function public.carrtell_attach_order_service_draft(uuid,jsonb) to authenticated;

create or replace function public.carrtell_create_service_request_from_paid_order(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  d jsonb;
  request_id uuid;
  request_number_value text;
  date_text text;
  time_text text;
  title_text text;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then return null; end if;
  if lower(coalesce(o.delivery_type, '')) <> 'service' then return null; end if;
  if coalesce(o.payment_status, '') <> 'paid' and coalesce(o.status, '') <> 'paid' then return null; end if;

  select id into request_id from public.service_requests where order_id = o.id limit 1;
  if request_id is not null then return request_id; end if;

  d := coalesce(o.service_draft, '{}'::jsonb);
  date_text := nullif(d->>'preferred_date', '');
  time_text := nullif(d->>'preferred_time', '');
  title_text := coalesce(nullif(d->>'service_title', ''), 'سرویس در محل سفارش ' || coalesce(o.order_number, o.id::text));
  request_number_value := 'SR-' || to_char(now(), 'YYMMDD-HH24MISS') || '-' || substr(replace(o.id::text, '-', ''), 1, 4);

  insert into public.service_requests (
    id, request_number, order_id, source,
    customer_name, customer_phone, customer_user_id,
    vehicle_id, vehicle_title,
    current_km, last_service_km, service_interval_km,
    address_id, address_text, latitude, longitude,
    preferred_date, preferred_time, scheduled_at,
    service_title, service_items, estimated_total,
    note, status, payment_status, payment_reference, paid_at,
    created_at, updated_at
  ) values (
    gen_random_uuid(), request_number_value, o.id, 'paid_order',
    o.customer_name, o.customer_phone, o.user_id,
    o.car_id, coalesce(nullif(d->>'vehicle_title',''), o.car_name, 'خودروی مشتری'),
    coalesce(nullif(d->>'current_km','')::integer, 0),
    coalesce(nullif(d->>'last_service_km','')::integer, 0),
    coalesce(nullif(d->>'service_interval_km','')::integer, 5000),
    o.address_id, coalesce(nullif(d->>'address_text',''), o.address_text, o.customer_address, 'آدرس ثبت نشده'),
    coalesce(nullif(d->>'latitude','')::double precision, o.latitude),
    coalesce(nullif(d->>'longitude','')::double precision, o.longitude),
    coalesce(date_text, to_char(now(), 'YYYY-MM-DD')),
    coalesce(time_text, '00:00'),
    coalesce(nullif(d->>'scheduled_at','')::timestamptz, now()),
    title_text,
    coalesce(d->'service_items', o.items, '[]'::jsonb),
    o.total_amount,
    coalesce(nullif(d->>'customer_note',''), o.customer_note),
    'pending_review', 'paid', o.payment_reference, coalesce(o.paid_at, now()),
    now(), now()
  ) returning id into request_id;

  insert into public.service_crm_events(service_request_id, order_id, event_type, to_status, payload)
  values (request_id, o.id, 'paid_order_received', 'pending_review', jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'total_amount', o.total_amount
  ));

  if to_regclass('public.admin_notifications') is not null then
    begin
      execute 'insert into public.admin_notifications(type,title,message,order_id,is_read) values ($1,$2,$3,$4,false)'
      using 'paid_onsite_service', 'سرویس پرداخت‌شده آماده تخصیص است',
        'سفارش ' || coalesce(o.order_number, o.id::text) || ' برای ' || coalesce(o.customer_name, 'مشتری') || ' آماده انتخاب سرویس‌کار است.',
        o.id;
    exception when others then
      null; -- اعلان نباید چرخه پرداخت/سرویس را متوقف کند.
    end;
  end if;

  return request_id;
end;
$$;

revoke all on function public.carrtell_create_service_request_from_paid_order(uuid) from public;
grant execute on function public.carrtell_create_service_request_from_paid_order(uuid) to authenticated;

create or replace function public.carrtell_sync_paid_service_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.delivery_type, '')) <> 'service'
     or (coalesce(new.payment_status, '') <> 'paid' and coalesce(new.status, '') <> 'paid') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform public.carrtell_create_service_request_from_paid_order(new.id);
  elsif coalesce(old.payment_status, '') is distinct from coalesce(new.payment_status, '')
     or coalesce(old.status, '') is distinct from coalesce(new.status, '') then
    perform public.carrtell_create_service_request_from_paid_order(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_carrtell_sync_paid_service_order on public.orders;
create trigger trg_carrtell_sync_paid_service_order
after insert or update on public.orders
for each row execute function public.carrtell_sync_paid_service_order();

create or replace function public.carrtell_log_service_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.service_crm_events(service_request_id, order_id, event_type, from_status, to_status, actor_id)
    values (new.id, new.order_id, 'status_changed', old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_carrtell_log_service_status_event on public.service_requests;
create trigger trg_carrtell_log_service_status_event
after update of status on public.service_requests
for each row execute function public.carrtell_log_service_status_event();

-- Backfill already-paid on-site orders that have no service request yet.
do $$
declare r record;
begin
  for r in
    select o.id
    from public.orders o
    where lower(coalesce(o.delivery_type, '')) = 'service'
      and (o.payment_status = 'paid' or o.status = 'paid')
      and not exists (select 1 from public.service_requests sr where sr.order_id = o.id)
  loop
    perform public.carrtell_create_service_request_from_paid_order(r.id);
  end loop;
end $$;

notify pgrst, 'reload schema';
