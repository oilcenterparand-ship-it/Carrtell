# Carrtell V5.2.1 — Hotfix نهایی رزرو، OTP و ساخت حساب

مبنای توسعه: Branch `sprint/guest-checkout-search-car-picker` و سورس واقعی Commit `c3b7c9817b88173d4325ed828092fb8f87aa887b`.

## اصلاحات
- خطای OTP اشتباه مستقیماً زیر کادر کد نمایش داده می‌شود.
- خطای OTP منقضی‌شده با پیام فارسی مشخص نمایش داده می‌شود.
- حذف یک خدمت دیگر محصولات، تعداد محصولات یا پکیج انتخاب‌شده را پاک نمی‌کند.
- داخل سبد رزرو، جمع خدمات و محصولات جدا نمایش داده می‌شود.
- بعد از پرداخت، مشتری می‌تواند با همان شماره موبایل تأییدشده حساب بسازد.
- نام کاربری به‌صورت خودکار شماره موبایل است.
- کاربر رمز و تکرار رمز را وارد می‌کند و سپس رزرو به حساب متصل و وارد داشبورد می‌شود.
- OTP دوم برای ساخت حساب اضافه نشده است.

## فایل‌های Runtime
- `src/pages/BookPage.tsx`
- `src/pages/ServicePaymentPage.tsx`

## QA
- `tests/e2e/v521-source-contract.spec.ts`

## SQL
ندارد.

## Edge Function
Edge Function جدید ندارد. از `customer-credentials` موجود استفاده می‌شود.

## نصب
ZIP طوری ساخته شده که پوشه اضافه در ریشه ندارد. محتویات ZIP را مستقیماً روی ریشه پروژه Extract و Replace کنید.

سپس:
```powershell
npm run typecheck
npm run build
npx playwright test tests/e2e/v521-source-contract.spec.ts
.\agent.ps1 PERSONAS
```

## اصلاح R2
- تست اصلی `critical-user-journeys-v23.spec.ts` با UI جدید سبد رزرو هماهنگ شد.
- انتظار قدیمی «مبلغ فعلی انتخاب‌ها / 1,220,000» حذف شد.
- انتظار جدید: خدمات 180,000 + محصولات 890,000.
- UI ساخت حساب پس از پرداخت نیز در همان journey بررسی می‌شود.

## اصلاح R3
- خطای Playwright strict mode در تشخیص «رمز عبور» رفع شد.
- Selector رمز اصلی و تکرار رمز با `exact: true` از هم جدا شدند.
