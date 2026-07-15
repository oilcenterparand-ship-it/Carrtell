alter table if exists public.products
  add column if not exists recommendation_reason text,
  add column if not exists recommendation_priority integer not null default 0;

create index if not exists products_recommendation_priority_idx
  on public.products (recommendation_priority desc);
