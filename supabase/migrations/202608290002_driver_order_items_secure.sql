-- Secure warehouse pick-list for the technician assigned to a service request.
create or replace function public.carrtell_get_my_mission_order_items(p_service_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_order_id uuid;
  result jsonb;
begin
  if auth.uid() is null then raise exception 'ورود سرویس‌کار الزامی است.'; end if;

  select sr.order_id into linked_order_id
  from public.service_requests sr
  where sr.id = p_service_request_id
    and (sr.assigned_driver_id = auth.uid() or sr.driver_id = auth.uid() or public.is_admin());

  if not found then raise exception 'این مأموریت به حساب شما تخصیص داده نشده است.'; end if;
  if linked_order_id is null then return '[]'::jsonb; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'product_id', i.product_id,
    'product_name', i.product_name,
    'product_image_url', i.product_image_url,
    'quantity', i.quantity
  ) order by i.created_at), '[]'::jsonb)
  into result
  from public.order_items i
  where i.order_id = linked_order_id
    and coalesce(i.item_type, 'product') = 'product';

  return result;
end;
$$;

revoke all on function public.carrtell_get_my_mission_order_items(uuid) from public;
grant execute on function public.carrtell_get_my_mission_order_items(uuid) to authenticated;
notify pgrst, 'reload schema';
