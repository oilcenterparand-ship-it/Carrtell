begin;

alter table public.service_requests
  add column if not exists guest_token uuid;

create unique index if not exists service_requests_guest_token_uidx
  on public.service_requests(guest_token)
  where guest_token is not null;

alter table public.service_requests enable row level security;

drop policy if exists service_requests_guest_insert on public.service_requests;
create policy service_requests_guest_insert
on public.service_requests
for insert
to anon
with check (
  customer_user_id is null
  and guest_token is not null
  and status = 'pending_review'
  and payment_status = 'pending'
  and payment_reference is null
  and paid_at is null
  and assigned_driver_id is null
  and assigned_driver_name is null
  and assigned_driver_phone is null
);

grant insert on public.service_requests to anon;

create or replace function public.get_service_request_guest(
  p_request_id uuid,
  p_guest_token uuid
)
returns public.service_requests
language sql
stable
security definer
set search_path = public
as $$
  select sr
  from public.service_requests sr
  where sr.id = p_request_id
    and sr.guest_token = p_guest_token
  limit 1;
$$;

revoke all on function public.get_service_request_guest(uuid, uuid) from public;
grant execute on function public.get_service_request_guest(uuid, uuid) to anon, authenticated;

create or replace function public.pay_service_request_guest_test(
  p_request_id uuid,
  p_guest_token uuid
)
returns public.service_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.service_requests;
begin
  update public.service_requests
  set payment_status = 'paid',
      payment_reference = 'TEST-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text,
      paid_at = now()
  where id = p_request_id
    and guest_token = p_guest_token
    and customer_user_id is null
    and payment_status = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'درخواست مهمان معتبر نیست یا قبلاً پرداخت شده است.';
  end if;

  return result;
end;
$$;

revoke all on function public.pay_service_request_guest_test(uuid, uuid) from public;
grant execute on function public.pay_service_request_guest_test(uuid, uuid) to anon, authenticated;

-- Checkout RPC: grant anonymous execution only if the known two-jsonb signature exists.
do $$
begin
  if to_regprocedure('public.carrtell_create_checkout_order(jsonb,jsonb)') is not null then
    execute 'grant execute on function public.carrtell_create_checkout_order(jsonb,jsonb) to anon, authenticated';
  end if;
end $$;

commit;
