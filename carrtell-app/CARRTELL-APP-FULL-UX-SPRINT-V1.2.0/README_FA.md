# Carrtell App — Full UX Sprint V1.2.0

این Sprint تمام پیشنهادهای UI/UX مطرح‌شده را روی اپ Expo فعلی پیاده می‌کند.

## Home
- Header کوچک و کاربردی.
- انتخاب خودرو در ابتدای تجربه.
- فقط دو CTA اصلی: خرید محصولات و سرویس در محل.
- محصولات مناسب خودروی فعال.
- دسته‌بندی‌های جمع‌وجور.
- پیشنهاد ویژه امروز.
- داشبورد کوچک خودرو.
- برندهای محبوب.
- یادآوری سرویس.

## Store
- Search واقعی Local.
- Category filter.
- Compatible-first toggle.
- Grid دو ستونه ProductCard.
- افزودن سریع به سبد.
- نمایش Badge سازگاری خودرو.

## Cart
- لیست واقعی کالاهای Local.
- افزایش/کاهش تعداد.
- کد تخفیف آزمایشی `CARRTELL`.
- خلاصه کالاها، ارسال، تخفیف و جمع نهایی.
- فقط یک CTA اصلی.

## Booking
Wizard پنج مرحله‌ای:
1. خودرو
2. سرویس
3. محل
4. تاریخ و ساعت
5. خلاصه و تأیید

## Profile
- هدر کاربر.
- خودروی فعال.
- سفارش‌ها، رزروها، خودروها، آدرس‌ها، علاقه‌مندی، تخفیف و پشتیبانی.
- خروج از حساب.

## Bottom Navigation
- خانه / فروشگاه / رزرو / سبد / پروفایل
- Badge تعداد سبد
- Glow کمتر و رزرو برجسته

## مهم
- این Sprint عمداً بدون Supabase واقعی است.
- داده‌ها Local Mock هستند تا ظاهر و جریان کاربر تأیید شود.
- هیچ Secret داخل اپ قرار نگرفته.
- package.json و app.json تغییر نکرده‌اند.
- SQL ندارد.

## فایل‌های واقعی تغییرکرده
- App.tsx
- src/components/BottomNav.tsx
- src/components/ProductCard.tsx
- src/screens/HomeScreen.tsx
- src/screens/ShopScreen.tsx
- src/screens/CartScreen.tsx
- src/screens/BookingScreen.tsx
- src/screens/ProfileScreen.tsx
- src/theme/colors.ts
- src/types/models.ts
- src/types/navigation.ts
- src/services/mockData.ts
- src/services/format.ts

## نصب
```powershell
cd "D:\carrtell\Carrtell-v0.2-current\carrtell-app"

Expand-Archive -LiteralPath ".\CARRTELL-APP-FULL-UX-SPRINT-V1.2.0.zip" -DestinationPath "." -Force

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\CARRTELL-APP-FULL-UX-SPRINT-V1.2.0\install-app-full-ux-120.ps1"
```

## تست
```powershell
npx tsc --noEmit
npx expo start -c
```

بعد QR را با Expo Go سازگار با SDK 57 باز کنید.
