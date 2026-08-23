# Patch Manifest — Carrtell Auth Freeze Fix V3.1.3

- `src/auth/authRequest.ts`: timeout مشترک و قطعی درخواست‌های ورود.
- `src/auth/authApi.ts`: ورود مستقیم مشتری با شماره موبایل و fallback نام کاربری.
- `src/auth/staffPasswordAuth.ts`: timeout ورود ادمین و سرویس‌کار.
- `src/pages/OtpLoginPage.tsx`: جلوگیری از درخواست تکراری هنگام loading.
- `src/admin/pages/AdminLogin.tsx`: ورود مستقیم ادمین با fallback حساب‌های قدیمی.
- `supabase/functions/customer-credentials/index.ts`: timeout ارتباط داخلی Auth.
- `tests/e2e/auth-login-freeze.spec.ts`: تست کاربر و ادمین در حالت خطا.
- `agent-category.ps1`: اجرای regression ورود.
- SQL: ندارد.
