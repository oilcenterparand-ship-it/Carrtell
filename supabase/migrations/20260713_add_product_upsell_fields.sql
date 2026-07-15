alter table public.products
  add column if not exists related_product_ids uuid[] not null default '{}',
  add column if not exists upsell_title text;

comment on column public.products.related_product_ids is 'Products explicitly selected for the buy-together block';
comment on column public.products.upsell_title is 'Custom title for the buy-together block';
