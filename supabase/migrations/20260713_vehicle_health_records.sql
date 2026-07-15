create extension if not exists pgcrypto;

create table if not exists public.service_catalog_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  emoji text default '🔧',
  category text default 'سایر',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_service_history add column if not exists service_request_id uuid;
alter table public.customer_service_history add column if not exists source text default 'customer';
alter table public.customer_service_history add column if not exists performed_by_name text;
alter table public.customer_service_history add column if not exists service_date date default current_date;
alter table public.customer_service_history add column if not exists changed_items jsonb default '[]'::jsonb;
alter table public.customer_service_history add column if not exists warning_notes text;
alter table public.customer_service_history add column if not exists odometer_image_url text;
alter table public.customer_service_history add column if not exists before_image_url text;
alter table public.customer_service_history add column if not exists after_image_url text;
alter table public.customer_service_history add column if not exists invoice_image_url text;

create index if not exists customer_service_history_phone_vehicle_idx on public.customer_service_history(customer_phone, vehicle_id, service_date desc);
create index if not exists service_catalog_items_active_sort_idx on public.service_catalog_items(is_active, sort_order);

alter table public.service_catalog_items enable row level security;
drop policy if exists "public read service catalog" on public.service_catalog_items;
create policy "public read service catalog" on public.service_catalog_items for select using (true);
drop policy if exists "authenticated manage service catalog" on public.service_catalog_items;
create policy "authenticated manage service catalog" on public.service_catalog_items for all to authenticated using (true) with check (true);

insert into public.service_catalog_items (title, emoji, category, sort_order)
select * from (values
 ('روغن موتور','🛢️','روغن و مایعات',10),('فیلتر روغن','🔩','فیلترها',20),('فیلتر هوا','🌬️','فیلترها',30),('فیلتر کابین','🧼','فیلترها',40),('فیلتر بنزین','⛽','فیلترها',50),('روغن گیربکس','⚙️','روغن و مایعات',60),('ضدیخ و ضدجوش','❄️','روغن و مایعات',70),('روغن ترمز','🛑','روغن و مایعات',80),('شمع موتور','⚡','قطعات مصرفی',90),('تسمه','🔗','قطعات مصرفی',100),('لنت جلو','🛞','ترمز',110),('لنت عقب','🛞','ترمز',120),('برف‌پاک‌کن','🌧️','قطعات مصرفی',130)
) as seed(title,emoji,category,sort_order)
where not exists (select 1 from public.service_catalog_items);
