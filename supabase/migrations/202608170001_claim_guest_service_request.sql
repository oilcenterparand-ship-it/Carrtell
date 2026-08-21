begin;

create or replace function public.claim_service_request_guest(
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
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'برای فعال‌سازی حساب، تأیید شماره موبایل لازم است.';
  end if;

  update public.service_requests
  set customer_user_id = caller,
      guest_token = null
  where id = p_request_id
    and guest_token = p_guest_token
    and customer_user_id is null
    and payment_status = 'paid'
  returning * into result;

  if result.id is null then
    raise exception 'رزرو مهمان معتبر نیست، پرداخت نشده یا قبلاً به حسابی متصل شده است.';
  end if;

  return result;
end;
$$;

revoke all on function public.claim_service_request_guest(uuid, uuid) from public;
grant execute on function public.claim_service_request_guest(uuid, uuid) to authenticated;

commit;
