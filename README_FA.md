# هات‌فیکس Carrtell — Mobile Drawer Box Model v3.1.1

## مشکل
Agent v3.1 با وجود محدود شدن width منوی همبرگری همچنان روی Android گزارش می‌داد پنل حدود 95٪ عرض صفحه را گرفته است.

## علت واقعی
در CSS مقدار width برای `.ct-new-drawer` محدود شده بود، اما padding پنل خارج از width محاسبه می‌شد (content-box). روی viewport حدود 360px، width برابر 320px بود و با padding دو طرف، عرض واقعی به حدود 344px یا تقریباً 95٪ viewport می‌رسید.

## اصلاح
برای Drawer موبایل `box-sizing: border-box !important` اضافه شد تا padding داخل همان width محاسبه شود.

## فایل تغییرکرده
- `src/index.css`

## SQL
نیاز ندارد.

## نصب
محتویات ZIP را در ریشه پروژه Extract/Merge کنید و فایل هم‌نام را Replace کنید.

## تست
```powershell
npm run typecheck
npm run build
.\agent.ps1 VISUAL
```

خروجی مورد انتظار:
`Visual feedback: 0 error(s), 0 warning(s)`
