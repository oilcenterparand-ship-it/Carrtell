begin;

alter table public.service_requests
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'service_requests_payment_status_check'
      and conrelid = 'public.service_requests'::regclass
  ) then
    alter table public.service_requests
      add constraint service_requests_payment_status_check
      check (payment_status in ('pending','paid','failed'));
  end if;
end $$;

create index if not exists service_requests_customer_user_id_idx
  on public.service_requests(customer_user_id);

alter table public.service_requests enable row level security;

drop policy if exists service_requests_customer_select on public.service_requests;
create policy service_requests_customer_select
on public.service_requests for select
to authenticated
using (customer_user_id = auth.uid() or public.is_admin());

drop policy if exists service_requests_customer_insert on public.service_requests;
create policy service_requests_customer_insert
on public.service_requests for insert
to authenticated
with check (customer_user_id = auth.uid() or public.is_admin());

create or replace function public.pay_service_request_test(p_request_id uuid)
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
    and (customer_user_id = auth.uid() or public.is_admin())
  returning * into result;

  if result.id is null then
    raise exception 'درخواست سرویس برای این کاربر پیدا نشد.';
  end if;

  return result;
end;
$$;

revoke all on function public.pay_service_request_test(uuid) from public;
grant execute on function public.pay_service_request_test(uuid) to authenticated;

commit;
