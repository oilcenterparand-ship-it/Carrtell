-- Carrtell: atomic admin order editing, technician assignment and customer wallet checkout/top-up.
alter table public.orders add column if not exists assigned_technician_id uuid references public.service_technicians(id) on delete set null;
alter table public.orders add column if not exists wallet_used numeric(14,0) not null default 0;

-- Wallet balance is server-owned. Customers can read it, but cannot directly forge credit.
drop policy if exists "wallet owner insert" on public.customer_wallets;
drop policy if exists "wallet owner update" on public.customer_wallets;
revoke insert, update, delete on public.customer_wallets from authenticated;
drop policy if exists wallet_admin_read on public.customer_wallets;
create policy wallet_admin_read on public.customer_wallets for select to authenticated using (public.is_admin());
drop policy if exists wallet_transactions_admin_read on public.wallet_transactions;
create policy wallet_transactions_admin_read on public.wallet_transactions for select to authenticated using (public.is_admin());

create or replace function public.carrtell_get_or_create_my_wallet(p_phone text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); w public.customer_wallets%rowtype;
begin
  if uid is null then raise exception 'برای استفاده از کیف پول وارد حساب شوید.'; end if;
  insert into public.customer_wallets(user_id,phone,referral_code)
  values(uid,nullif(trim(coalesce(p_phone,'')),''),'CARRTELL-'||substr(replace(uid::text,'-',''),1,8))
  on conflict(user_id) do update set phone=coalesce(public.customer_wallets.phone,excluded.phone),updated_at=now()
  returning * into w;
  return to_jsonb(w);
end $$;
grant execute on function public.carrtell_get_or_create_my_wallet(text) to authenticated;

create or replace function public.carrtell_admin_adjust_wallet(p_wallet_id uuid,p_points_delta integer default 0,p_credit_delta numeric default 0,p_title text default 'اصلاح توسط مدیریت')
returns jsonb language plpgsql security definer set search_path=public as $$
declare w public.customer_wallets%rowtype;
begin
  if not public.is_admin() then raise exception 'فقط مدیر اجازه اصلاح کیف پول را دارد.'; end if;
  select * into w from public.customer_wallets where id=p_wallet_id for update;
  if not found then raise exception 'کیف پول پیدا نشد.'; end if;
  update public.customer_wallets set points=greatest(0,points+p_points_delta),credit_toman=greatest(0,credit_toman+p_credit_delta),updated_at=now() where id=w.id returning * into w;
  insert into public.wallet_transactions(wallet_id,user_id,type,title,description,points_delta,credit_delta) values(w.id,w.user_id,'admin_adjustment',p_title,'اصلاح دستی ثبت‌شده توسط مدیر',p_points_delta,p_credit_delta);
  return to_jsonb(w);
end $$;
grant execute on function public.carrtell_admin_adjust_wallet(uuid,integer,numeric,text) to authenticated;

create table if not exists public.order_adjustments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  old_total numeric(14,0) not null,
  new_total numeric(14,0) not null,
  wallet_credit numeric(14,0) not null default 0,
  note text,
  created_at timestamptz not null default now()
);
alter table public.order_adjustments enable row level security;
drop policy if exists order_adjustments_admin_read on public.order_adjustments;
create policy order_adjustments_admin_read on public.order_adjustments for select to authenticated using (public.is_admin());

create unique index if not exists wallet_transactions_order_type_uq
  on public.wallet_transactions(order_id, type) where order_id is not null and type in ('order_refund','wallet_topup');

create or replace function public.carrtell_admin_replace_order_items(p_order_id uuid, p_items jsonb, p_note text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  o public.orders%rowtype; item jsonb; old_total numeric; new_total numeric := 0; new_count integer := 0;
  refund numeric := 0; w public.customer_wallets%rowtype; saved_items jsonb;
begin
  if not public.is_admin() then raise exception 'فقط مدیر اجازه ویرایش سفارش را دارد.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'سفارش باید حداقل یک قلم داشته باشد.'; end if;
  select * into o from public.orders where id=p_order_id for update;
  if not found then raise exception 'سفارش پیدا نشد.'; end if;
  old_total := o.total_amount + coalesce(o.wallet_used,0);
  delete from public.order_items where order_id=p_order_id;
  for item in select * from jsonb_array_elements(p_items) loop
    if coalesce((item->>'quantity')::integer,0) <= 0 or coalesce((item->>'unit_price')::numeric,0) < 0 then raise exception 'تعداد یا قیمت نامعتبر است.'; end if;
    insert into public.order_items(order_id,product_id,product_name,product_image_url,quantity,unit_price,total_price,item_type)
    values(p_order_id,nullif(item->>'product_id','')::uuid,coalesce(nullif(item->>'product_name',''),'قلم سفارش'),nullif(item->>'product_image_url',''),(item->>'quantity')::integer,(item->>'unit_price')::numeric,(item->>'quantity')::integer*(item->>'unit_price')::numeric,coalesce(nullif(item->>'item_type',''),'product'));
    new_total := new_total + (item->>'quantity')::integer*(item->>'unit_price')::numeric;
    new_count := new_count + (item->>'quantity')::integer;
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('order_item_id',i.id,'product_id',i.product_id,'product_name',i.product_name,'product_image_url',i.product_image_url,'quantity',i.quantity,'unit_price',i.unit_price,'total_price',i.total_price,'item_type',i.item_type) order by i.created_at),'[]'::jsonb)
    into saved_items from public.order_items i where i.order_id=p_order_id;
  if (o.payment_status='paid' or o.status='paid') and new_total>old_total then
    raise exception 'مبلغ سفارش پرداخت‌شده نباید افزایش یابد؛ برای قلم اضافه سفارش جدید بسازید.';
  end if;
  update public.orders set subtotal=new_total,wallet_used=least(coalesce(o.wallet_used,0),new_total),total_amount=greatest(0,new_total-least(coalesce(o.wallet_used,0),new_total)),items_count=new_count,items=saved_items,updated_at=now() where id=p_order_id;
  if (o.payment_status='paid' or o.status='paid') and old_total>new_total and o.user_id is not null then
    refund := old_total-new_total;
    insert into public.customer_wallets(user_id,phone,referral_code) values(o.user_id,o.customer_phone,'CARRTELL-'||substr(replace(o.user_id::text,'-',''),1,8)) on conflict(user_id) do nothing;
    select * into w from public.customer_wallets where user_id=o.user_id for update;
    update public.customer_wallets set credit_toman=credit_toman+refund,updated_at=now() where id=w.id;
    insert into public.wallet_transactions(wallet_id,user_id,type,title,description,credit_delta,order_id)
    values(w.id,o.user_id,'order_refund','برگشت اختلاف سفارش','اصلاح اقلام سفارش '||coalesce(o.order_number,o.id::text),refund,o.id)
    on conflict(order_id,type) where order_id is not null and type in ('order_refund','wallet_topup') do update set credit_delta=excluded.credit_delta,description=excluded.description;
  end if;
  insert into public.order_adjustments(order_id,admin_user_id,old_total,new_total,wallet_credit,note) values(o.id,auth.uid(),old_total,new_total,refund,p_note);
  return jsonb_build_object('order',(select to_jsonb(x) from public.orders x where x.id=o.id),'items',saved_items,'wallet_credit',refund);
end $$;
grant execute on function public.carrtell_admin_replace_order_items(uuid,jsonb,text) to authenticated;

create or replace function public.carrtell_assign_order_technician(p_order_id uuid,p_technician_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders%rowtype;
begin
  if not public.is_admin() then raise exception 'فقط مدیر اجازه تخصیص سرویس‌کار را دارد.'; end if;
  if p_technician_id is not null and not exists(select 1 from public.service_technicians where id=p_technician_id and is_active=true) then raise exception 'سرویس‌کار فعال نیست.'; end if;
  update public.orders set assigned_technician_id=p_technician_id,updated_at=now() where id=p_order_id returning * into o;
  if not found then raise exception 'سفارش پیدا نشد.'; end if;
  return to_jsonb(o);
end $$;
grant execute on function public.carrtell_assign_order_technician(uuid,uuid) to authenticated;

create or replace function public.carrtell_create_wallet_topup_order(p_amount numeric)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); o public.orders%rowtype; profile jsonb; phone text; full_name text;
begin
  if uid is null then raise exception 'برای شارژ کیف پول وارد حساب شوید.'; end if;
  if p_amount < 50000 or p_amount > 50000000 then raise exception 'مبلغ شارژ باید بین ۵۰ هزار تا ۵۰ میلیون تومان باشد.'; end if;
  select to_jsonb(p) into profile from public.profiles p where p.id=uid;
  phone:=coalesce(profile->>'phone',''); full_name:=coalesce(profile->>'full_name','مشتری Carrtell');
  insert into public.orders(order_number,user_id,customer_name,customer_phone,status,payment_status,subtotal,total_amount,items_count,delivery_type,items)
  values('WAL-'||to_char(now(),'YYMMDDHH24MISS')||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,4),uid,full_name,phone,'pending_payment','unpaid',p_amount,p_amount,1,'wallet_topup',jsonb_build_array(jsonb_build_object('product_name','شارژ کیف پول Carrtell','quantity',1,'unit_price',p_amount,'total_price',p_amount,'item_type','wallet_topup')))
  returning * into o;
  insert into public.order_items(order_id,product_name,quantity,unit_price,total_price,item_type) values(o.id,'شارژ کیف پول Carrtell',1,p_amount,p_amount,'wallet_topup');
  return to_jsonb(o);
end $$;
grant execute on function public.carrtell_create_wallet_topup_order(numeric) to authenticated;

create or replace function public.carrtell_credit_paid_wallet_topup()
returns trigger language plpgsql security definer set search_path=public as $$
declare w public.customer_wallets%rowtype; amount numeric;
begin
  if new.delivery_type<>'wallet_topup' or new.payment_status<>'paid' or coalesce(old.payment_status,'')='paid' then return new; end if;
  amount:=new.subtotal;
  insert into public.customer_wallets(user_id,phone,referral_code) values(new.user_id,new.customer_phone,'CARRTELL-'||substr(replace(new.user_id::text,'-',''),1,8)) on conflict(user_id) do nothing;
  select * into w from public.customer_wallets where user_id=new.user_id for update;
  update public.customer_wallets set credit_toman=credit_toman+amount,updated_at=now() where id=w.id;
  insert into public.wallet_transactions(wallet_id,user_id,type,title,description,credit_delta,order_id)
  values(w.id,new.user_id,'wallet_topup','شارژ آنلاین کیف پول','پرداخت موفق '||new.order_number,amount,new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists trg_credit_paid_wallet_topup on public.orders;
create trigger trg_credit_paid_wallet_topup after update of payment_status on public.orders for each row execute function public.carrtell_credit_paid_wallet_topup();

create or replace function public.carrtell_apply_wallet_to_order(p_order_id uuid,p_requested numeric default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders%rowtype; w public.customer_wallets%rowtype; amount numeric; remaining numeric;
begin
  select * into o from public.orders where id=p_order_id and user_id=auth.uid() for update;
  if not found then raise exception 'سفارش پیدا نشد یا متعلق به این حساب نیست.'; end if;
  if o.payment_status='paid' then raise exception 'این سفارش قبلاً پرداخت شده است.'; end if;
  select * into w from public.customer_wallets where user_id=auth.uid() for update;
  if not found or w.credit_toman<=0 then raise exception 'اعتبار کیف پول کافی نیست.'; end if;
  amount:=least(w.credit_toman,o.total_amount,greatest(0,coalesce(p_requested,o.total_amount)));
  if amount<=0 then raise exception 'مبلغ قابل استفاده صفر است.'; end if;
  update public.customer_wallets set credit_toman=credit_toman-amount,updated_at=now() where id=w.id;
  insert into public.wallet_transactions(wallet_id,user_id,type,title,description,credit_delta,order_id) values(w.id,auth.uid(),'order_payment','پرداخت سفارش با کیف پول',o.order_number,-amount,o.id);
  remaining:=o.total_amount-amount;
  update public.orders set wallet_used=wallet_used+amount,total_amount=remaining,updated_at=now() where id=o.id returning * into o;
  if remaining=0 then
    update public.orders set status='paid',payment_status='paid',payment_provider='wallet',payment_reference='WALLET-'||o.id::text,paid_at=now(),updated_at=now() where id=o.id returning * into o;
    insert into public.payments(order_id,amount,provider,status,reference_id,ref_id,paid_at) values(o.id,amount,'wallet','paid','WALLET-'||o.id::text,'WALLET-'||o.id::text,now());
  end if;
  return jsonb_build_object('order',to_jsonb(o),'wallet_balance',w.credit_toman-amount,'applied',amount,'remaining',remaining);
end $$;
grant execute on function public.carrtell_apply_wallet_to_order(uuid,numeric) to authenticated;
