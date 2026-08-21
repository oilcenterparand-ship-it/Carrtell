# Carrtell Driver Android

این پروژه Android مستقل برای سرویس‌کار Carrtell است و فقط مسیرهای `/driver/*` روی `https://carrtell.ir` را داخل اپ باز می‌کند.
لینک‌های خارج از پنل (نشان، تماس، مرورگر) به اپ مناسب سیستم تحویل داده می‌شوند.

## Build
1. پوشه `android-driver` را با Android Studio باز کنید.
2. Android SDK 35 و JDK 17 نصب باشد.
3. Gradle Sync را اجرا کنید.
4. از منوی Build > Build APK(s) استفاده کنید.

خروجی Debug معمولاً در این مسیر ساخته می‌شود:
`android-driver/app/build/outputs/apk/debug/app-debug.apk`

Package name: `ir.carrtell.driver`

## اعلان
نسخه فعلی اعلان Native را وقتی خود پنل مأموریت جدید را تشخیص می‌دهد نمایش می‌دهد. برای Push واقعی در زمانی که اپ کاملاً بسته است باید FCM در Sprint بعدی با فایل `google-services.json` پروژه Firebase پیکربندی شود. تا آن زمان SMS مأموریت مسیر پشتیبان است.
