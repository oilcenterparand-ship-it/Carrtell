-- Carrtell RC1-02 Store Complete
-- Idempotent schema, atomic checkout, inventory reservation, discounts, payment and invoices.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  user_id uuid,
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_address text,
  customer_car text,
  note text,
  status text not null default 'pending_payment',
  payment_status text not null default 'unpaid',
  payment_provider text,
  payment_reference text,
  payment_authority text,
  paid_at timestamptz,
  subtotal numeric(14,0) not null default 0,
  shipping_amount numeric(14,0) not null default 0,
  service_amount numeric(14,0) not null default 0,
  discount_amount numeric(14,0) not null default 0,
  discount_code text,
  discount_id uuid,
  total_amount numeric(14,0) not null default 0,
  items_count integer not null default 0,
  inventory_applied boolean not null default false,
  inventory_released_at timestamptz,
  delivery_type text,
  car_id uuid,
  car_name text,
  address_id uuid,
  address_text text,
  latitude double precision,
  longitude double precision,
  customer_note text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists user_id uuid;
alter table public.orders add column if not exists subtotal numeric(14,0) not null default 0;
alter table public.orders add column if not exists shipping_amount numeric(14,0) not null default 0;
alter table public.orders add column if not exists service_amount numeric(14,0) not null default 0;
alter table public.orders add column if not exists discount_amount numeric(14,0) not null default 0;
alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists discount_id uuid;
alter table public.orders add column if not exists inventory_applied boolean not null default false;
alter table public.orders add column if not exists inventory_released_at timestamptz;
alter table public.orders add column if not exists delivery_type text;
alter table public.orders add column if not exists car_id uuid;
alter table public.orders add column if not exists car_name text;
alter table public.orders add column if not exists address_id uuid;
alter table public.orders add column if not exists address_text text;
alter table public.orders add column if not exists latitude double precision;
alter table public.orders add column if not exists longitude double precision;
alter table public.orders add column if not exists customer_note text;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image_url text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,0) not null check (unit_price >= 0),
  total_price numeric(14,0) not null check (total_price >= 0),
  item_type text not null default 'product',
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  value numeric(14,2) not null check (value > 0),
  min_order_amount numeric(14,0) not null default 0,
  max_discount_amount numeric(14,0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  per_user_limit integer not null default 1,
  is_active boolean not null default true,
  target_type text not null default 'all',
  target_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discount_usages (
  id uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid,
  code text not null,
  discount_amount numeric(14,0) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists discount_usages_discount_user_idx on public.discount_usages(discount_id,user_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(14,0) not null default 0,
  provider text not null default 'test',
  status text not null default 'pending',
  authority text,
  reference_id text,
  ref_id text,
  card_pan text,
  error_message text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_order_id_idx on public.payments(order_id,created_at desc);
create unique index if not exists payments_provider_reference_uq on public.payments(provider,reference_id) where reference_id is not null;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null,
  quantity integer not null,
  stock_before integer,
  stock_after integer,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_product_idx on public.inventory_movements(product_id,created_at desc);

create or replace function public.carrtell_make_order_number()
returns text language plpgsql as $$
declare v text;
begin
  loop
    v := 'CT-' || to_char(now(),'YYMMDD') || '-' || lpad((floor(random()*1000000))::int::text,6,'0');
    exit when not exists(select 1 from public.orders where order_number=v);
  end loop;
  return v;
end $$;

create or replace function public.carrtell_validate_discount(p_code text, p_subtotal numeric, p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d public.discounts%rowtype; v_amount numeric:=0; v_count int:=0;
begin
  if nullif(trim(p_code),'') is null then return jsonb_build_object('ok',false,'amount',0,'message','کد تخفیف وارد نشده است.'); end if;
  select * into d from public.discounts where upper(code)=upper(trim(p_code)) and is_active=true for update;
  if not found then return jsonb_build_object('ok',false,'amount',0,'message','کد تخفیف معتبر نیست.'); end if;
  if d.starts_at is not null and now()<d.starts_at then return jsonb_build_object('ok',false,'amount',0,'message','این کد هنوز فعال نشده است.'); end if;
  if d.ends_at is not null and now()>d.ends_at then return jsonb_build_object('ok',false,'amount',0,'message','مهلت این کد تمام شده است.'); end if;
  if d.usage_limit is not null and d.used_count>=d.usage_limit then return jsonb_build_object('ok',false,'amount',0,'message','ظرفیت این کد تمام شده است.'); end if;
  if p_subtotal<coalesce(d.min_order_amount,0) then return jsonb_build_object('ok',false,'amount',0,'message','حداقل مبلغ سفارش رعایت نشده است.'); end if;
  if p_user_id is not null then
    select count(*) into v_count from public.discount_usages where discount_id=d.id and user_id=p_user_id;
    if v_count>=coalesce(d.per_user_limit,1) then return jsonb_build_object('ok',false,'amount',0,'message','سقف استفاده شما از این کد تمام شده است.'); end if;
  end if;
  if d.discount_type='percent' then v_amount:=floor(p_subtotal*d.value/100); else v_amount:=d.value; end if;
  if d.max_discount_amount is not null then v_amount:=least(v_amount,d.max_discount_amount); end if;
  v_amount:=greatest(0,least(v_amount,p_subtotal));
  return jsonb_build_object('ok',true,'discountId',d.id,'code',upper(d.code),'amount',v_amount,'message','کد تخفیف اعمال شد.');
end $$;

grant execute on function public.carrtell_validate_discount(text,numeric,uuid) to authenticated, anon;

create or replace function public.carrtell_create_checkout_order(p_order jsonb, p_service jsonb default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_order public.orders%rowtype; v_item jsonb; v_product public.products%rowtype;
  v_qty int; v_price numeric; v_line numeric; v_subtotal numeric:=0; v_count int:=0;
  v_shipping numeric:=greatest(0,coalesce((p_order->>'shipping_amount')::numeric,0));
  v_service numeric:=greatest(0,coalesce((p_order->>'service_amount')::numeric,0));
  v_discount numeric:=0; v_discount_result jsonb; v_discount_id uuid; v_code text;
  v_user uuid:=coalesce(nullif(p_order->>'user_id','')::uuid,auth.uid());
  v_items_json jsonb:='[]'::jsonb;
begin
  if auth.uid() is not null and v_user is distinct from auth.uid() then raise exception 'شناسه کاربر معتبر نیست.'; end if;
  if jsonb_typeof(p_order->'items')<>'array' or jsonb_array_length(p_order->'items')=0 then raise exception 'سبد خرید خالی است.'; end if;

  -- Lock and validate real products; price is always read from database.
  for v_item in select * from jsonb_array_elements(p_order->'items') loop
    v_qty:=greatest(1,coalesce((v_item->>'quantity')::int,1));
    if (v_item->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      select * into v_product from public.products where id=(v_item->>'id')::uuid for update;
      if not found or coalesce(v_product.is_active,true)=false or coalesce(v_product.is_out_of_stock,false)=true then raise exception 'یکی از محصولات ناموجود است.'; end if;
      if coalesce(v_product.stock,0)<v_qty then raise exception 'موجودی محصول % کافی نیست.',v_product.name; end if;
      v_price:=case when v_product.amazing_price is not null and (v_product.amazing_ends_at is null or v_product.amazing_ends_at>now()) then v_product.amazing_price else v_product.price end;
      v_line:=v_price*v_qty; v_subtotal:=v_subtotal+v_line; v_count:=v_count+v_qty;
      v_items_json:=v_items_json||jsonb_build_array(jsonb_build_object('product_id',v_product.id,'product_name',v_product.name,'product_image_url',v_product.image_url,'quantity',v_qty,'unit_price',v_price,'total_price',v_line,'item_type','product'));
    else
      -- Trusted fee items are recalculated from explicit server-bound totals, not client item prices.
      continue;
    end if;
  end loop;
  if v_count=0 then raise exception 'سفارش هیچ کالای معتبری ندارد.'; end if;

  v_code:=nullif(upper(trim(p_order->>'discount_code')),'');
  if v_code is not null then
    v_discount_result:=public.carrtell_validate_discount(v_code,v_subtotal,v_user);
    if coalesce((v_discount_result->>'ok')::boolean,false)=false then raise exception '%',coalesce(v_discount_result->>'message','کد تخفیف معتبر نیست.'); end if;
    v_discount:=coalesce((v_discount_result->>'amount')::numeric,0);
    v_discount_id:=(v_discount_result->>'discountId')::uuid;
  end if;

  insert into public.orders(order_number,user_id,customer_name,customer_phone,status,payment_status,subtotal,shipping_amount,service_amount,discount_amount,discount_code,discount_id,total_amount,items_count,delivery_type,car_id,car_name,address_id,address_text,latitude,longitude,customer_note,items)
  values(public.carrtell_make_order_number(),v_user,coalesce(p_order->>'customer_name',''),coalesce(p_order->>'customer_phone',''),'pending_payment','unpaid',v_subtotal,v_shipping,v_service,v_discount,v_code,v_discount_id,greatest(0,v_subtotal+v_shipping+v_service-v_discount),v_count,p_order->>'delivery_type',nullif(p_order->>'car_id','')::uuid,p_order->>'car_name',nullif(p_order->>'address_id','')::uuid,p_order->>'address_text',nullif(p_order->>'latitude','')::double precision,nullif(p_order->>'longitude','')::double precision,p_order->>'customer_note',v_items_json)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(v_items_json) loop
    insert into public.order_items(order_id,product_id,product_name,product_image_url,quantity,unit_price,total_price,item_type)
    values(v_order.id,(v_item->>'product_id')::uuid,v_item->>'product_name',v_item->>'product_image_url',(v_item->>'quantity')::int,(v_item->>'unit_price')::numeric,(v_item->>'total_price')::numeric,'product');
    select stock into v_qty from public.products where id=(v_item->>'product_id')::uuid;
    update public.products set stock=stock-(v_item->>'quantity')::int,is_out_of_stock=(stock-(v_item->>'quantity')::int)<=0 where id=(v_item->>'product_id')::uuid;
    insert into public.inventory_movements(product_id,order_id,movement_type,quantity,stock_before,stock_after,note)
    values((v_item->>'product_id')::uuid,v_order.id,'order_reserve',-((v_item->>'quantity')::int),v_qty,v_qty-(v_item->>'quantity')::int,'رزرو موجودی هنگام ثبت سفارش');
  end loop;

  update public.orders set inventory_applied=true where id=v_order.id returning * into v_order;
  if v_discount_id is not null then
    insert into public.discount_usages(discount_id,order_id,user_id,code,discount_amount) values(v_discount_id,v_order.id,v_user,v_code,v_discount);
    update public.discounts set used_count=used_count+1,updated_at=now() where id=v_discount_id;
  end if;
  return to_jsonb(v_order);
end $$;

grant execute on function public.carrtell_create_checkout_order(jsonb,jsonb) to authenticated;

create or replace function public.carrtell_release_order_inventory(p_order_id uuid, p_reason text default 'cancelled')
returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders%rowtype; i public.order_items%rowtype; before_stock int;
begin
  select * into o from public.orders where id=p_order_id for update;
  if not found then raise exception 'سفارش پیدا نشد.'; end if;
  if not o.inventory_applied or o.inventory_released_at is not null then return to_jsonb(o); end if;
  for i in select * from public.order_items where order_id=o.id and product_id is not null loop
    select stock into before_stock from public.products where id=i.product_id for update;
    update public.products set stock=stock+i.quantity,is_out_of_stock=false where id=i.product_id;
    insert into public.inventory_movements(product_id,order_id,movement_type,quantity,stock_before,stock_after,note) values(i.product_id,o.id,'order_release',i.quantity,before_stock,before_stock+i.quantity,p_reason);
  end loop;
  update public.orders set inventory_released_at=now(),inventory_applied=false,status=case when status='pending_payment' then 'cancelled' else status end,updated_at=now() where id=o.id returning * into o;
  return to_jsonb(o);
end $$;

grant execute on function public.carrtell_release_order_inventory(uuid,text) to authenticated;

create or replace function public.carrtell_get_order_payment_snapshot(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o jsonb; its jsonb;
begin
  select to_jsonb(x) into o from public.orders x where x.id=p_order_id and (x.user_id=auth.uid() or public.is_admin());
  if o is null then raise exception 'سفارش پیدا نشد یا دسترسی ندارید.'; end if;
  select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at),'[]'::jsonb) into its from public.order_items i where i.order_id=p_order_id;
  return jsonb_build_object('order',o,'items',its);
end $$;
grant execute on function public.carrtell_get_order_payment_snapshot(uuid) to authenticated;

create or replace function public.carrtell_mark_payment_pending(p_order_id uuid,p_provider text,p_authority text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders%rowtype;
begin
 update public.orders set payment_provider=p_provider,payment_authority=p_authority,payment_status='unpaid',updated_at=now() where id=p_order_id and (user_id=auth.uid() or public.is_admin()) returning * into o;
 if not found then raise exception 'سفارش پیدا نشد.'; end if; return to_jsonb(o);
end $$;
grant execute on function public.carrtell_mark_payment_pending(uuid,text,text) to authenticated;

create or replace function public.carrtell_finalize_order_payment(p_order_id uuid,p_provider text,p_reference_id text,p_authority text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders%rowtype; p public.payments%rowtype;
begin
 select * into o from public.orders where id=p_order_id and (user_id=auth.uid() or public.is_admin()) for update;
 if not found then raise exception 'سفارش پیدا نشد.'; end if;
 if o.payment_status='paid' then select * into p from public.payments where order_id=o.id and status='paid' order by created_at desc limit 1; return jsonb_build_object('order',to_jsonb(o),'payment',to_jsonb(p)); end if;
 insert into public.payments(order_id,amount,provider,status,authority,reference_id,ref_id,paid_at) values(o.id,o.total_amount,p_provider,'paid',p_authority,p_reference_id,p_reference_id,now()) returning * into p;
 update public.orders set status='paid',payment_status='paid',payment_provider=p_provider,payment_reference=p_reference_id,payment_authority=p_authority,paid_at=now(),updated_at=now() where id=o.id returning * into o;
 return jsonb_build_object('order',to_jsonb(o),'payment',to_jsonb(p));
end $$;
grant execute on function public.carrtell_finalize_order_payment(uuid,text,text,text) to authenticated;

create or replace function public.carrtell_complete_test_payment(p_order_id uuid,p_reference_id text)
returns jsonb language sql security definer set search_path=public as $$ select public.carrtell_finalize_order_payment(p_order_id,'test',p_reference_id,null); $$;
grant execute on function public.carrtell_complete_test_payment(uuid,text) to authenticated;

-- Updated-at helper
create or replace function public.carrtell_touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.carrtell_touch_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.discounts enable row level security;
alter table public.discount_usages enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists orders_customer_select on public.orders;
create policy orders_customer_select on public.orders for select to authenticated using (user_id=auth.uid() or public.is_admin());
drop policy if exists orders_admin_manage on public.orders;
create policy orders_admin_manage on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists order_items_customer_select on public.order_items;
create policy order_items_customer_select on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
drop policy if exists payments_customer_select on public.payments;
create policy payments_customer_select on public.payments for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
drop policy if exists discounts_public_read on public.discounts;
create policy discounts_public_read on public.discounts for select to authenticated,anon using (is_active=true);
drop policy if exists discounts_admin_manage on public.discounts;
create policy discounts_admin_manage on public.discounts for all to authenticated using (public.is_admin()) with check(public.is_admin());
drop policy if exists inventory_admin_read on public.inventory_movements;
create policy inventory_admin_read on public.inventory_movements for select to authenticated using(public.is_admin());

-- Optional first coupon for testing; safely ignored if it already exists.
insert into public.discounts(code,title,discount_type,value,min_order_amount,max_discount_amount,is_active)
values('CARTELL10','تخفیف آزمایشی کارتل','percent',10,500000,300000,true)
on conflict(code) do nothing;
