-- Carrtell Sprint 2026-08-15
-- Align the live order_items table with the checkout function already present in source migrations.
alter table public.order_items
  add column if not exists item_type text not null default 'product';

update public.order_items set item_type = 'product' where item_type is null or btrim(item_type) = '';
