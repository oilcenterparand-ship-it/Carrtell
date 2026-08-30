begin;

create table if not exists public.mega_menu_tiles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  badge text not null default '',
  image_url text not null default '',
  link_url text not null default '/shop',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mega_menu_tiles enable row level security;

drop policy if exists mega_menu_tiles_public_read on public.mega_menu_tiles;
create policy mega_menu_tiles_public_read
on public.mega_menu_tiles
for select
to anon, authenticated
using (is_active or public.is_admin());

drop policy if exists mega_menu_tiles_admin_manage on public.mega_menu_tiles;
create policy mega_menu_tiles_admin_manage
on public.mega_menu_tiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.mega_menu_tiles(title, subtitle, badge, image_url, link_url, sort_order, is_active)
select seed.title, seed.subtitle, seed.badge, seed.image_url, seed.link_url, seed.sort_order, true
from (values
  ('محصولات نظافت خودرویی', 'درخشش و مراقبت حرفه‌ای', 'تمیزی', '/images/mega-menu/car-cleaning.webp', '/shop?q=نظافت', 1),
  ('فروش ویژه مکمل‌های سوخت', 'توان بیشتر، مصرف بهتر', 'فروش ویژه', '/images/mega-menu/fuel-additives.webp', '/shop?q=مکمل%20سوخت', 2),
  ('پکیج‌های تعویض روغن اقتصادی و به‌صرفه', 'انتخاب کامل برای سرویس دوره‌ای', 'اقتصادی', '/images/mega-menu/economy-oil-change.webp', '/?quick=packages', 3),
  ('محصولات تزئینی خودرو', 'جزئیات متفاوت برای خودرو', 'خاص', '/images/mega-menu/car-accessories.webp', '/shop?q=تزئینی', 4)
) as seed(title, subtitle, badge, image_url, link_url, sort_order)
where not exists (select 1 from public.mega_menu_tiles);

update public.mega_menu_tiles
set
  title = 'پکیج‌های تعویض روغن اقتصادی و به‌صرفه',
  subtitle = 'انتخاب کامل برای سرویس دوره‌ای',
  updated_at = now()
where image_url = '/images/mega-menu/economy-oil-change.webp';

commit;
