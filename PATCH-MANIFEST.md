# Patch Manifest — V4.6

| فایل | نوع تغییر | هدف |
|---|---|---|
| `src/auth/staffPasswordAuth.ts` | Modified | ایجاد Session استاندارد Supabase با password login و اعتبارسنجی RBAC ادمین |
| `supabase/functions/staff-password-login/index.ts` | Modified | Sync کردن Auth password بعد از اعتبارسنجی staff settings و حذف وابستگی اصلی به Magic Link |
| `tests/e2e/persona-admin.spec.ts` | Modified | جلوگیری از false-positive و الزام ورود واقعی به dashboard |

SQL: ندارد  
Edge Function deploy: فقط `staff-password-login`  
Secrets: بدون تغییر
