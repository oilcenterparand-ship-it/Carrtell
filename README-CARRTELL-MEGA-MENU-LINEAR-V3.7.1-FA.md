# Carrtell Mega Menu V3.7.1

این هات‌فیکس چیدمان Mega Menu دسکتاپ را اصلاح می‌کند:

- دسته‌های اصلی و زیرشاخه‌ها به‌صورت ردیف متنی کامل نمایش داده می‌شوند.
- شاخه بعدی با قرارگرفتن موس روی ردیف باز می‌شود.
- عرض کادر Mega Menu افزایش یافته است.
- اندازه اجزای داخلی کاهش یافته تا اسکرول داخلی لازم نباشد.
- نسخه موبایل تغییر نکرده است.

## نصب

فایل ZIP را در ریشه پروژه Extract و Replace کنید:

`D:\carrtell\Carrtell-v0.2-current\project`

سپس اجرا کنید:

```powershell
cd "D:\carrtell\Carrtell-v0.2-current\project"
npm run typecheck
npm run build
npx playwright test tests/e2e/dynamic-category-mega-menu.spec.ts
```

این پچ SQL و Deploy تابع Supabase ندارد.
