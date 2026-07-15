alter table public.products
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists specifications jsonb not null default '{}'::jsonb;
