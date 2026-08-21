# Carrtell v2.3.22 — Booking OTP State Fix

## علت خطا

Verify پیامکی موفق بود و `phoneVerified` نیز فعال می‌شد، اما ایجاد Session توسط Supabase باعث Refresh شدن `AuthProvider` می‌شد. Effect مربوط به کاربر واردشده، پیام موفقیت مستقیم Verify را با پیام «شماره موبایل از حساب کاربری شما تأیید شده است» جایگزین می‌کرد؛ به همین دلیل دو تست CRITICAL روی Desktop و iPhone شکست می‌خوردند.

## اصلاح

- اگر شماره در همین Journey قبلاً Verify شده باشد، Effect حساب کاربری دیگر State و پیام OTP را overwrite نمی‌کند.
- تست CRITICAL علاوه بر پیام موفقیت، تماس واقعی با endpoint Verify و غیرفعال‌شدن دکمه «تأیید شد» را کنترل می‌کند.
- Assertion حذف یا ضعیف نشده است.

## نصب

پوشه Patch را در ریشه پروژه قرار دهید و اجرا کنید:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\CARRTELL-SPRINT-BOOKING-OTP-STATE-V2322\install-v2322.ps1
```

این Sprint SQL ندارد.

## تست الزامی

```powershell
npm run typecheck
npm run build
.\agent.ps1 CRITICAL
```

شرط پذیرش: هر ۲۱ تست باید Pass شوند و Retry/Failure باقی نماند. تا پیش از `0 failed`، پوشه `dist` روی Production بارگذاری نشود.

## Rollback

Installer پیش از جایگزینی، دو فایل قبلی را در پوشه `backup-v2322-*` داخل ریشه پروژه ذخیره می‌کند.
