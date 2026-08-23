-- Carrtell Industrial/Diesel Catalog V1
-- Idempotent category tree + many-to-many product assignment.

create extension if not exists pgcrypto;

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories(id) on delete restrict,
  title text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  icon_emoji text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_not_self_parent check (parent_id is null or parent_id <> id)
);

alter table public.product_categories add column if not exists parent_id uuid references public.product_categories(id) on delete restrict;
alter table public.product_categories add column if not exists image_url text;
alter table public.product_categories add column if not exists icon_emoji text;
alter table public.product_categories add column if not exists updated_at timestamptz not null default now();
create unique index if not exists product_categories_slug_uq on public.product_categories(slug);
create index if not exists product_categories_parent_sort_idx on public.product_categories(parent_id, sort_order, title);

create table if not exists public.product_category_assignments (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.product_categories(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(product_id, category_id)
);
create index if not exists product_category_assignments_category_idx on public.product_category_assignments(category_id, product_id);
create unique index if not exists product_category_one_primary_uq on public.product_category_assignments(product_id) where is_primary;

insert into public.product_categories(title, slug, icon_emoji, sort_order, is_active) values
('روغن موتور','engine-oil','🛢️',10,true),
('فیلتر روغن','oil-filter','⚙️',20,true),
('فیلتر هوا','air-filter','🌬️',30,true),
('فیلتر کابین','cabin-filter','🌀',40,true),
('واسکازین / روغن گیربکس','gear-oil','⚙️',50,true),
('روغن هیدرولیک','hydraulic-oil','💧',60,true),
('ضدیخ','antifreeze','❄️',70,true),
('مکمل','additive','🧪',80,true),
('دیزلی و صنعتی','industrial-diesel','🏭',200,true),
('روغن موتور دیزلی','diesel-engine-oil','🚛',210,true),
('روغن هیدرولیک صنعتی','industrial-hydraulic-oil','💧',220,true),
('واسکازین و روغن گیربکس صنعتی','industrial-gear-oil','⚙️',230,true),
('فیلترهای صنعتی و دیزلی','industrial-filters','🧰',240,true),
('فیلتر روغن صنعتی و دیزلی','industrial-oil-filter','⚙️',241,true),
('فیلتر هوای صنعتی و دیزلی','industrial-air-filter','🌬️',242,true),
('فیلتر گازوئیل','diesel-fuel-filter','⛽',243,true),
('فیلتر آب‌گیر گازوئیل','diesel-water-separator','💧',244,true),
('فیلتر هیدرولیک فرمان','steering-hydraulic-filter','🔩',245,true)
on conflict(slug) do update set title=excluded.title, icon_emoji=coalesce(public.product_categories.icon_emoji, excluded.icon_emoji);

update public.product_categories set parent_id=(select id from public.product_categories where slug='industrial-diesel')
where slug in ('diesel-engine-oil','industrial-hydraulic-oil','industrial-gear-oil','industrial-filters');
update public.product_categories set parent_id=(select id from public.product_categories where slug='industrial-filters')
where slug in ('industrial-oil-filter','industrial-air-filter','diesel-fuel-filter','diesel-water-separator','steering-hydraulic-filter');

insert into public.product_category_assignments(product_id, category_id, is_primary)
select p.id, c.id, true from public.products p join public.product_categories c on c.slug=p.category
where nullif(trim(p.category),'') is not null
on conflict(product_id, category_id) do nothing;

alter table public.product_categories enable row level security;
alter table public.product_category_assignments enable row level security;
drop policy if exists product_categories_public_read on public.product_categories;
create policy product_categories_public_read on public.product_categories for select to anon, authenticated using (is_active);
drop policy if exists product_categories_admin_manage on public.product_categories;
create policy product_categories_admin_manage on public.product_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists product_category_assignments_public_read on public.product_category_assignments;
create policy product_category_assignments_public_read on public.product_category_assignments for select to anon, authenticated using (true);
drop policy if exists product_category_assignments_admin_manage on public.product_category_assignments;
create policy product_category_assignments_admin_manage on public.product_category_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.product_categories, public.product_category_assignments to anon, authenticated;
grant insert, update, delete on public.product_categories, public.product_category_assignments to authenticated;

-- Rollback (data-preserving): drop table public.product_category_assignments; alter table public.product_categories drop column parent_id;
