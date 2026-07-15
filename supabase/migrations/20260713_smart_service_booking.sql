-- Carrtell stage 34: smart on-site service booking
create extension if not exists pgcrypto;

create table if not exists public.booking_services (
  id text primary key,
  title text not null,
  description text,
  icon text,
  base_labor_fee numeric not null default 0,
  estimated_minutes integer not null default 30,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  recommended_categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_time_slots (
  id text primary key,
  label text not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 1 check (capacity > 0),
  remaining integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.service_pricing_settings (
  id text primary key default 'default',
  travel_fee numeric not null default 0,
  night_fee numeric not null default 0,
  holiday_fee numeric not null default 0,
  out_of_area_fee numeric not null default 0,
  night_start_hour integer not null default 18,
  club_discount_percent numeric not null default 0,
  service_area_cities jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_slot_reservations (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid,
  slot_id text references public.booking_time_slots(id) on delete set null,
  booking_date date not null,
  created_at timestamptz not null default now()
);

alter table if exists public.service_requests add column if not exists service_ids jsonb not null default '[]'::jsonb;
alter table if exists public.service_requests add column if not exists service_items jsonb not null default '[]'::jsonb;
alter table if exists public.service_requests add column if not exists suggested_product_ids jsonb not null default '[]'::jsonb;
alter table if exists public.service_requests add column if not exists booking_slot_id text;
alter table if exists public.service_requests add column if not exists booking_slot_label text;
alter table if exists public.service_requests add column if not exists pricing_breakdown jsonb not null default '{}'::jsonb;
alter table if exists public.service_requests add column if not exists estimated_total numeric not null default 0;
alter table if exists public.service_requests add column if not exists city text;

insert into public.booking_services (id,title,description,icon,base_labor_fee,estimated_minutes,sort_order,recommended_categories)
values
('oil-change','تعویض روغن موتور','تعویض روغن و کنترل سطح مایعات','🛢️',180000,35,1,'["روغن موتور","فیلتر روغن"]'),
('periodic','سرویس دوره‌ای','بازدید کامل اقلام مصرفی خودرو','🔧',320000,60,2,'["روغن موتور","فیلتر روغن","فیلتر هوا","فیلتر کابین"]'),
('gearbox','تعویض روغن گیربکس','تعویض روغن گیربکس دستی یا اتوماتیک','⚙️',450000,75,3,'["روغن گیربکس"]'),
('coolant','تعویض ضدیخ و ضدجوش','تخلیه و جایگزینی مایع خنک‌کننده','❄️',260000,50,4,'["ضدیخ","ضدجوش"]'),
('brake','بازدید و تعویض لنت','بازدید لنت و تعویض در صورت نیاز','🛞',380000,60,5,'["لنت"]')
on conflict (id) do nothing;

insert into public.booking_time_slots (id,label,start_time,end_time,capacity,remaining)
values
('slot-9-11','۹ تا ۱۱','09:00','11:00',3,3),
('slot-11-13','۱۱ تا ۱۳','11:00','13:00',3,3),
('slot-14-16','۱۴ تا ۱۶','14:00','16:00',2,2),
('slot-16-18','۱۶ تا ۱۸','16:00','18:00',2,2),
('slot-18-20','۱۸ تا ۲۰','18:00','20:00',2,2)
on conflict (id) do nothing;

insert into public.service_pricing_settings (id,travel_fee,night_fee,holiday_fee,out_of_area_fee,night_start_hour,club_discount_percent,service_area_cities)
values ('default',150000,120000,100000,250000,18,5,'["پرند","تهران","اسلامشهر","چهاردانگه"]')
on conflict (id) do nothing;

create or replace function public.get_booking_slots_for_date(p_date date)
returns table(id text,label text,start_time time,end_time time,capacity integer,remaining integer,is_active boolean)
language sql stable security definer set search_path=public as $$
  select s.id,s.label,s.start_time,s.end_time,s.capacity,
    greatest(s.capacity - count(r.id)::integer,0) as remaining,s.is_active
  from booking_time_slots s
  left join booking_slot_reservations r on r.slot_id=s.id and r.booking_date=p_date
  where s.is_active=true
  group by s.id,s.label,s.start_time,s.end_time,s.capacity,s.is_active
  order by s.start_time;
$$;

alter table public.booking_services enable row level security;
alter table public.booking_time_slots enable row level security;
alter table public.service_pricing_settings enable row level security;
alter table public.booking_slot_reservations enable row level security;

drop policy if exists "public read booking services" on public.booking_services;
create policy "public read booking services" on public.booking_services for select using (true);
drop policy if exists "public read booking slots" on public.booking_time_slots;
create policy "public read booking slots" on public.booking_time_slots for select using (true);
drop policy if exists "public read service pricing" on public.service_pricing_settings;
create policy "public read service pricing" on public.service_pricing_settings for select using (true);
-- Existing admin/service-role policies may be added according to the project's auth model.
