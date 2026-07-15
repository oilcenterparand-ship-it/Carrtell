alter table public.products
add column if not exists card_features text;

comment on column public.products.card_features is
'متن کوتاه ویژگی‌های اصلی که روی کارت محصول نمایش داده می‌شود';
