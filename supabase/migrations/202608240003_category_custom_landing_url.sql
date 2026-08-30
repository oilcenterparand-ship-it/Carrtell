-- Dynamic per-category destination. Empty values keep the normal shop/category journey.
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
