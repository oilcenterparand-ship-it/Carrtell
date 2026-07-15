begin;

alter table if exists public.products
  add column if not exists recommendation_reason text,
  add column if not exists recommendation_priority integer not null default 0,
  add column if not exists related_product_ids uuid[] not null default '{}',
  add column if not exists upsell_title text not null default 'همراه این محصول پیشنهاد می‌کنیم';

create index if not exists products_recommendation_priority_idx
  on public.products (recommendation_priority desc);

notify pgrst, 'reload schema';

commit;
