-- Carrtell V3.4.4 - safe/idempotent SQL for Supabase SQL Editor
begin;

alter table public.product_categories
  add column if not exists landing_url text not null default '';

update public.product_categories
set landing_url = '/industrial'
where coalesce(landing_url, '') = ''
  and (
    slug = 'industrial-diesel'
    or replace(replace(title, '‌', ' '), 'ي', 'ی') in ('روغن های سنگین و صنعتی', 'روغن‌های سنگین و صنعتی')
  );

update public.mega_menu_promotions
set link_url = '/industrial', updated_at = now()
where link_url = '/shop?category=industrial-diesel'
   or title = 'ویژه صنایع و ناوگان سنگین';

commit;

select title, slug, landing_url
from public.product_categories
where landing_url <> ''
order by sort_order, title;

select title, link_url
from public.mega_menu_promotions
where title = 'ویژه صنایع و ناوگان سنگین';
