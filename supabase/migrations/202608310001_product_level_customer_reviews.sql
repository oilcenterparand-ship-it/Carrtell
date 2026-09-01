alter table if exists public.customer_reviews
  add column if not exists product_name text;

comment on column public.customer_reviews.product_name is
  'Snapshot of the reviewed order item name; keeps legacy/non-UUID order items reviewable.';

notify pgrst, 'reload schema';
