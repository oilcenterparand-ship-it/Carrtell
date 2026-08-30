begin;

-- Safe/idempotent SQL for the Supabase SQL Editor.
alter table public.service_pricing_settings add column if not exists travel_per_km_fee numeric not null default 10000;
alter table public.service_pricing_settings add column if not exists travel_origin_latitude double precision not null default 35.6505318;
alter table public.service_pricing_settings add column if not exists travel_origin_longitude double precision not null default 51.2740074;
alter table public.service_pricing_settings add column if not exists service_center_latitude double precision not null default 35.6892;
alter table public.service_pricing_settings add column if not exists service_center_longitude double precision not null default 51.3890;
alter table public.service_pricing_settings add column if not exists service_radius_km numeric not null default 40;
alter table public.service_pricing_settings add column if not exists traffic_zone_surcharge_percent numeric not null default 30;
alter table public.service_pricing_settings add column if not exists traffic_zone_polygon jsonb not null default '[[35.6595,51.3819],[35.7218,51.3892],[35.723,51.407],[35.7212,51.426],[35.7188,51.443],[35.704,51.447],[35.688,51.449],[35.674,51.447],[35.66,51.444]]'::jsonb;

update public.service_pricing_settings
set travel_fee = 200000,
    travel_per_km_fee = 10000,
    travel_origin_latitude = 35.6505318,
    travel_origin_longitude = 51.2740074,
    service_center_latitude = 35.6892,
    service_center_longitude = 51.3890,
    service_radius_km = 40,
    traffic_zone_surcharge_percent = 30,
    updated_at = now()
where id = 'default';

create table if not exists public.service_travel_quotes (
  id uuid primary key default gen_random_uuid(), destination_latitude double precision not null,
  destination_longitude double precision not null, route_distance_meters integer not null,
  billable_distance_km integer not null, base_fee numeric not null, distance_fee numeric not null,
  traffic_surcharge numeric not null default 0, traffic_zone boolean not null default false,
  total_fee numeric not null, expires_at timestamptz not null default (now() + interval '30 minutes'),
  used_at timestamptz, created_at timestamptz not null default now()
);
alter table public.service_requests add column if not exists travel_quote_id uuid references public.service_travel_quotes(id);
alter table public.service_travel_quotes enable row level security;
revoke all on public.service_travel_quotes from anon, authenticated;

create or replace function public.apply_service_travel_quote()
returns trigger language plpgsql security definer set search_path = public as $$
declare q public.service_travel_quotes%rowtype; old_travel numeric;
begin
  if new.travel_quote_id is null then
    if new.booking_slot_id is not null then raise exception 'A valid travel quote is required'; end if;
    return new;
  end if;
  select * into q from public.service_travel_quotes where id = new.travel_quote_id for update;
  if not found or q.used_at is not null or q.expires_at <= now() then raise exception 'Travel quote is invalid or expired'; end if;
  if abs(coalesce(new.latitude, 0) - q.destination_latitude) > 0.00001 or abs(coalesce(new.longitude, 0) - q.destination_longitude) > 0.00001 then raise exception 'Travel quote destination mismatch'; end if;
  old_travel := coalesce((new.pricing_breakdown->>'travel')::numeric, 0);
  new.pricing_breakdown := coalesce(new.pricing_breakdown, '{}'::jsonb) || jsonb_build_object('travel', q.total_fee, 'trafficSurcharge', q.traffic_surcharge, 'routeDistanceKm', round(q.route_distance_meters::numeric / 1000, 1), 'billableDistanceKm', q.billable_distance_km, 'travelBaseFee', q.base_fee, 'travelDistanceFee', q.distance_fee, 'trafficZone', case when q.traffic_zone then 1 else 0 end);
  new.estimated_total := greatest(0, coalesce(new.estimated_total, 0) - old_travel + q.total_fee);
  update public.service_travel_quotes set used_at = now() where id = q.id;
  return new;
end; $$;
drop trigger if exists service_requests_apply_travel_quote on public.service_requests;
create trigger service_requests_apply_travel_quote before insert on public.service_requests for each row execute function public.apply_service_travel_quote();

commit;

select id, travel_fee, travel_per_km_fee, travel_origin_latitude, travel_origin_longitude,
       service_radius_km, traffic_zone_surcharge_percent
from public.service_pricing_settings
where id = 'default';
