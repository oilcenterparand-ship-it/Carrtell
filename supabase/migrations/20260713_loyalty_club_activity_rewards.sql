-- Carrtell Club: wallets, activity rewards and configurable levels
create table if not exists public.loyalty_settings (
  id text primary key default 'default',
  purchase_point_rate numeric not null default 0.01,
  point_to_toman integer not null default 100,
  review_points integer not null default 50,
  review_photo_points integer not null default 80,
  health_record_points integer not null default 100,
  referral_points integer not null default 250,
  package_purchase_points integer not null default 150,
  first_onsite_service_points integer not null default 300,
  referral_reward_toman integer not null default 100000,
  referred_discount_toman integer not null default 50000,
  bronze_min integer not null default 0,
  silver_min integer not null default 1000,
  gold_min integer not null default 3000,
  diamond_min integer not null default 7000,
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  phone text,
  points integer not null default 0,
  credit_toman integer not null default 0,
  referral_code text unique,
  tier text not null default 'bronze' check (tier in ('bronze','silver','gold','diamond')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.customer_wallets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text,
  description text,
  points_delta integer not null default 0,
  credit_delta integer not null default 0,
  order_id uuid,
  reward_key text,
  created_at timestamptz not null default now()
);
create unique index if not exists wallet_transactions_unique_reward on public.wallet_transactions(user_id, reward_key) where reward_key is not null;

insert into public.loyalty_settings(id) values ('default') on conflict (id) do nothing;

alter table public.loyalty_settings enable row level security;
alter table public.customer_wallets enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "loyalty settings readable" on public.loyalty_settings;
create policy "loyalty settings readable" on public.loyalty_settings for select using (true);
drop policy if exists "wallet owner read" on public.customer_wallets;
create policy "wallet owner read" on public.customer_wallets for select using (auth.uid() = user_id);
drop policy if exists "wallet owner insert" on public.customer_wallets;
create policy "wallet owner insert" on public.customer_wallets for insert with check (auth.uid() = user_id);
drop policy if exists "wallet owner update" on public.customer_wallets;
create policy "wallet owner update" on public.customer_wallets for update using (auth.uid() = user_id);
drop policy if exists "transactions owner read" on public.wallet_transactions;
create policy "transactions owner read" on public.wallet_transactions for select using (auth.uid() = user_id);
drop policy if exists "transactions owner insert" on public.wallet_transactions;
create policy "transactions owner insert" on public.wallet_transactions for insert with check (auth.uid() = user_id);
