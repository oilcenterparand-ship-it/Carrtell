alter table if exists public.customer_reviews
  add column if not exists product_id uuid references public.products(id) on delete set null;

create index if not exists customer_reviews_product_id_idx
  on public.customer_reviews(product_id);

notify pgrst, 'reload schema';
