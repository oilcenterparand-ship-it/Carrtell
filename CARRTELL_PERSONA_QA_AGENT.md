# Carrtell Persona QA Agent v3

این Agent سایت Carrtell را از سه دید مستقل تست می‌کند:

1. **مشتری** — فروشگاه، منو، رزرو سرویس، Bottom Nav، اسکرول و Overlayها.
2. **مدیریت** — Login Gate و در صورت تعریف حساب تست، صفحات حیاتی مدیریت، سفارش، سرویس، اعزام، انبار، CRM و تنظیمات.
3. **سرویس‌کار** — کنترل دسترسی، ورود با حساب سرویس‌کار، پنل مأموریت‌ها و فرم ثبت اطلاعات سرویس.

## خروجی

پس از هر اجرا علاوه بر Playwright HTML Report، Agent دو گزارش می‌سازد:

- `reports/carrtell-agent/latest.md`
- `reports/carrtell-agent/latest.json`

گزارش شامل Pass/Fail/Skipped و بازخورد UX است. Agent به‌صورت خودکار این موارد را هم بررسی می‌کند:

- خطاهای Runtime و JavaScript
- صفحه سفید
- مسیر/Redirect اشتباه
- اسکرول افقی موبایل
- دکمه‌های بسیار کشیده و غیرعادی
- باز شدن Login از مسیر نامربوط
- اسکرول شدن صفحه پشت Modal/Bottom Sheet
- سلامت مسیرهای حیاتی Admin
- سلامت پنل و کنترل‌های سرویس‌کار

## اجرای سریع

```powershell
.\agent.ps1 PERSONAS
```

فقط مشتری:

```powershell
.\agent.ps1 CUSTOMER3
```

فقط مدیریت:

```powershell
.\agent.ps1 ADMIN
```

فقط سرویس‌کار:

```powershell
.\agent.ps1 TECHNICIAN
```

## حساب‌های تست اختیاری

بدون Credential نیز Agent مسیرهای عمومی و Login Gateها را تست می‌کند. برای تست عمیق نقش‌ها، در همان PowerShell متغیرها را تنظیم کن؛ این مقادیر داخل سورس ذخیره نمی‌شوند:

```powershell
$env:CARRTELL_ADMIN_USERNAME="admin-test"
$env:CARRTELL_ADMIN_PASSWORD="YOUR_PASSWORD"
$env:CARRTELL_TECH_USERNAME="technician-test"
$env:CARRTELL_TECH_PASSWORD="YOUR_PASSWORD"
.\agent.ps1 PERSONAS
```

پس از تست می‌توانی متغیرها را پاک کنی:

```powershell
Remove-Item Env:CARRTELL_ADMIN_USERNAME -ErrorAction SilentlyContinue
Remove-Item Env:CARRTELL_ADMIN_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:CARRTELL_TECH_USERNAME -ErrorAction SilentlyContinue
Remove-Item Env:CARRTELL_TECH_PASSWORD -ErrorAction SilentlyContinue
```

**هیچ Secret یا Password جدیدی در Frontend اضافه نشده است.**
