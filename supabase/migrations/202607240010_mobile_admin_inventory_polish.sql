create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  address text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.warehouses (name, code, sort_order)
values
  ('انبار فروشگاه', 'store', 10),
  ('انبار مرکزی پرند', 'parand-central', 20)
on conflict (name) do nothing;

alter table public.products add column if not exists warehouse_id uuid references public.warehouses(id) on delete set null;
alter table public.products add column if not exists oil_base text;
alter table public.orders add column if not exists fulfillment_warehouse_id uuid references public.warehouses(id) on delete set null;

alter table public.warehouses enable row level security;
drop policy if exists "warehouses readable" on public.warehouses;
create policy "warehouses readable" on public.warehouses for select using (true);
drop policy if exists "warehouses admin write" on public.warehouses;
create policy "warehouses admin write" on public.warehouses for all using (public.is_admin()) with check (public.is_admin());

insert into public.oil_specs(type,title,sort_order,is_active)
select x.type,x.title,x.sort_order,true
from (values
 ('base','تمام سنتتیک',10),
 ('base','نیمه سنتتیک',20),
 ('base','معدنی',30),
 ('base','گیاهی',40)
) as x(type,title,sort_order)
where not exists (select 1 from public.oil_specs o where o.type=x.type and o.title=x.title);

do $$
declare c record;
begin
  for c in select conname from pg_constraint where conrelid='public.oil_specs'::regclass and contype='c' loop
    if pg_get_constraintdef((select oid from pg_constraint where conname=c.conname and conrelid='public.oil_specs'::regclass)) ilike '%type%' then
      execute format('alter table public.oil_specs drop constraint %I', c.conname);
    end if;
  end loop;
exception when undefined_table then null;
end $$;

alter table public.oil_specs add constraint oil_specs_type_check check (type in ('grade','quality','base'));
