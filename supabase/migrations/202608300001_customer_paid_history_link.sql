-- Carrtell: attach previously paid guest bookings/orders to the verified customer.
-- Safe and idempotent: only rows with the exact verified profile phone are claimed.

create or replace function public.carrtell_normalize_ir_phone(value text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when regexp_replace(coalesce(value, ''), '\\D', '', 'g') ~ '^989[0-9]{9}$'
      then '0' || substring(regexp_replace(value, '\\D', '', 'g') from 3)
    when regexp_replace(coalesce(value, ''), '\\D', '', 'g') ~ '^9[0-9]{9}$'
      then '0' || regexp_replace(value, '\\D', '', 'g')
    else regexp_replace(coalesce(value, ''), '\\D', '', 'g')
  end;
$$;

create or replace function public.carrtell_claim_my_paid_history()
returns setof public.service_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  verified_phone text;
begin
  if caller is null then
    raise exception 'ورود به حساب کاربری لازم است.';
  end if;

  select public.carrtell_normalize_ir_phone(u.phone)
  into verified_phone
  from auth.users u
  where u.id = caller
    and u.phone_confirmed_at is not null;

  if verified_phone !~ '^09[0-9]{9}$' then
    raise exception 'شماره موبایل تأییدشده حساب پیدا نشد.';
  end if;

  update public.service_requests
  set customer_user_id = caller,
      guest_token = null
  where customer_user_id is null
    and payment_status = 'paid'
    and public.carrtell_normalize_ir_phone(customer_phone) = verified_phone;

  update public.orders
  set user_id = caller
  where user_id is null
    and (payment_status = 'paid' or status = 'paid')
    and public.carrtell_normalize_ir_phone(customer_phone) = verified_phone;

  return query
  select sr.*
  from public.service_requests sr
  where sr.customer_user_id = caller
  order by sr.created_at desc;
end;
$$;

revoke all on function public.carrtell_claim_my_paid_history() from public;
grant execute on function public.carrtell_claim_my_paid_history() to authenticated;

notify pgrst, 'reload schema';
