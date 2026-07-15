-- Carrtell stage 35: operational reporting fields (safe / idempotent)
alter table if exists public.products add column if not exists min_stock integer default 5;
alter table if exists public.products add column if not exists cost_price numeric default 0;
alter table if exists public.products add column if not exists last_purchase_at timestamptz;
alter table if exists public.orders add column if not exists cost_total numeric default 0;
alter table if exists public.orders add column if not exists service_cost numeric default 0;
alter table if exists public.orders add column if not exists gross_profit numeric generated always as (coalesce(total_amount,0)-coalesce(cost_total,0)) stored;
create index if not exists idx_products_stock_min_stock on public.products(stock,min_stock);
create index if not exists idx_orders_status_created_at on public.orders(status,created_at desc);
create index if not exists idx_service_requests_status_created_at on public.service_requests(status,created_at desc);
