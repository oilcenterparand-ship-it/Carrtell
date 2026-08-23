create table if not exists public.mega_menu_promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  badge text not null default '',
  button_text text not null default 'مشاهده محصولات',
  image_url text not null default '',
  link_url text not null default '/shop',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mega_menu_promotions enable row level security;
drop policy if exists mega_menu_promotions_public_read on public.mega_menu_promotions;
create policy mega_menu_promotions_public_read on public.mega_menu_promotions for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists mega_menu_promotions_admin_manage on public.mega_menu_promotions;
create policy mega_menu_promotions_admin_manage on public.mega_menu_promotions for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.mega_menu_promotions(title, subtitle, badge, button_text, link_url, is_active)
select 'ویژه صنایع و ناوگان سنگین', 'روغن و فیلتر صنعتی با بسته‌بندی عمده', 'فروش عمده', 'مشاهده محصولات', '/shop?category=industrial-diesel', true
where not exists (select 1 from public.mega_menu_promotions);
