# Carrtell Staff Auth Session Fix V4.6

## هدف
این Hotfix مشکل باقی‌مانده‌ی ورود پنل مدیریت را اصلاح می‌کند؛ حالتی که `staff-password-login` نام کاربری/رمز را قبول می‌کرد اما مرورگر پس از ورود دوباره به `/admin/login` برمی‌گشت.

## علت
نسخه قبلی بعد از اعتبارسنجی `admin/admin` یک Magic Link `token_hash` می‌ساخت و Frontend آن را به Session تبدیل می‌کرد. این مسیر برای نشست مدیریت قابل اتکا نبود و Agent نشان داد RBAC مدیریت پس از ورود در مرورگر پایدار نمی‌ماند.

## اصلاح
1. Edge Function بعد از اعتبارسنجی Carrtell، کاربر Supabase Auth متناظر را ایجاد/بازیابی و Password همان کاربر را Sync می‌کند.
2. Frontend سپس از `supabase.auth.signInWithPassword` استفاده می‌کند تا یک Session استاندارد و قابل Refresh ساخته شود.
3. برای نقش `admin` بلافاصله `get_my_admin_access()` بررسی می‌شود. اگر RBAC واقعاً فعال نباشد Login موفق اعلام نمی‌شود.
4. تست Admin دیگر `/admin/login` را به اشتباه به عنوان URL موفق قبول نمی‌کند؛ باید واقعاً وارد `/admin/dashboard` شود.

## فایل‌های تغییرکرده
- `src/auth/staffPasswordAuth.ts`
- `supabase/functions/staff-password-login/index.ts`
- `tests/e2e/persona-admin.spec.ts`

## SQL
SQL جدید لازم نیست.

## نصب
ZIP را در ریشه پروژه Carrtell Extract و Replace کنید.

سپس فقط Edge Function تغییرکرده را Deploy کنید:

```powershell
npx supabase functions deploy staff-password-login --no-verify-jwt
```

بعد تست:

```powershell
npm run typecheck
npm run build
.\agent.ps1 PERSONAS
```

## نتیجه مورد انتظار
- Production Browser Gate: PASS
- Admin login gate: PASS
- Authenticated Admin: PASS
- Customer: PASS
- Technician: PASS

## امنیت
هیچ Supabase Service Role Key، کلید Kavenegar، کلید Neshan یا Secret دیگری وارد Frontend نشده است. Password فقط هنگام Login از طریق HTTPS به Edge Function و سپس Supabase Auth منتقل می‌شود.
