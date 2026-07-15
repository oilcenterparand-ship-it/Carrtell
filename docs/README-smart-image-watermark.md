# Carrtell Smart Image System

این پچ ابزار مشترک برای آپلود عکس‌های بهینه‌شده Carrtell است.

## قابلیت‌ها
- تبدیل خودکار عکس به WebP
- کاهش حجم قبل از آپلود
- کوچک‌سازی براساس maxWidth/maxHeight
- واترمارک متنی
- واترمارک لوگویی
- انتخاب جایگاه و شفافیت واترمارک
- خروجی public URL از Supabase Storage

## فایل‌های مهم
- `src/lib/smartImage.ts` موتور فشرده‌سازی و واترمارک داخل مرورگر
- `src/admin/services/smartUploadApi.ts` آپلود به Supabase Storage
- `database/smart_image_watermark_settings.sql` تنظیمات دیتابیس و Storage

## نمونه استفاده در فرم محصول
```ts
import { smartUploadImage } from '../services/smartUploadApi';

const result = await smartUploadImage(file, 'products', {
  watermarkEnabled: true,
  watermarkTextEnabled: true,
  watermarkLogoEnabled: true,
  watermarkText: 'Carrtell.ir',
  watermarkLogoUrl: settings.watermark_logo_url,
  watermarkOpacity: 0.2,
  watermarkPosition: 'bottom-right',
});

// result.publicUrl را داخل image_url محصول ذخیره کن.
```
