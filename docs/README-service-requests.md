# Carrtell Service Requests Patch

این پچ صفحه رزرو سرویس در محل را به جریان کیلومتری وصل می‌کند و یک صفحه مدیریت درخواست‌های سرویس به پنل ادمین اضافه می‌کند.

## فایل‌های تغییرکرده

- `src/pages/BookPage.tsx`
- `src/customer/services/serviceRequestsApi.ts`
- `src/admin/services/serviceRequestsApi.ts`
- `src/admin/pages/ServiceRequests.tsx`
- `src/App.tsx`
- `src/admin/hooks/useAdminRoutes.ts`
- `src/admin/components/Sidebar.tsx`

## مسیر پنل مدیریت

```txt
/admin/service-requests
```

## SQL پیشنهادی Supabase

اگر جدول `service_requests` را نداری، این SQL را در Supabase SQL Editor اجرا کن:

```sql
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  vehicle_id uuid null,
  vehicle_title text not null,
  current_km integer not null default 0,
  last_service_km integer not null default 0,
  service_interval_km integer not null default 5000,
  next_service_km integer not null default 0,
  address_id uuid null,
  address_text text not null,
  latitude double precision null,
  longitude double precision null,
  preferred_date text not null,
  preferred_time text not null,
  service_title text not null default 'سرویس دوره‌ای روغن و فیلتر',
  note text null,
  technician_name text null,
  status text not null default 'pending_review' check (status in ('pending_review','confirmed','dispatching','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists service_requests_customer_phone_idx on public.service_requests(customer_phone);
create index if not exists service_requests_status_idx on public.service_requests(status);
create index if not exists service_requests_created_at_idx on public.service_requests(created_at desc);
```

اگر فعلاً جدول ساخته نشود، فرم از `localStorage` fallback استفاده می‌کند، ولی برای پنل واقعی باید جدول Supabase ساخته شود.
