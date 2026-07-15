# Carrtell Admin Reviews Patch

این پچ بخش «نظرات مشتریان» را به پنل مدیریت اضافه و در منوی ادمین قابل مشاهده می‌کند.

فایل‌های تغییر یافته/اضافه شده:

- `src/App.tsx`
- `src/admin/hooks/useAdminRoutes.ts`
- `src/admin/components/Sidebar.tsx`
- `src/admin/pages/Reviews.tsx`
- `src/admin/services/customerReviewsApi.ts`

مسیر پنل:

`/admin/reviews`

اگر جدول نظرات در Supabase هنوز ساخته نشده بود، این SQL را در SQL Editor اجرا کن:

```sql
create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  customer_name text,
  customer_phone text,
  rating int not null default 5 check (rating between 1 and 5),
  comment text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.customer_reviews enable row level security;

create policy if not exists "Public can create reviews"
on public.customer_reviews
for insert
to anon, authenticated
with check (true);

create policy if not exists "Public can read approved reviews"
on public.customer_reviews
for select
to anon, authenticated
using (is_approved = true);
```

نکته: اگر ادمین با کلید anon اطلاعات همه نظرات را نمی‌بیند، باید policy مخصوص ادمین/role پروژه را جداگانه اضافه کنیم.
