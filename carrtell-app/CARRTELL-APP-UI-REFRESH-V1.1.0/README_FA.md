# Carrtell App UI Refresh V1.1.0

این Patch فقط ظاهر Sprint 1 اپ را ارتقا می‌دهد.

## تغییرات
- Home از حالت تمپلیت خشک خارج شد.
- Header جدید و جمع‌وجور.
- Hero عمیق‌تر با Glow، Accent و CTA بهتر.
- Quick Action سه‌تایی.
- کارت انتخاب خودرو بازطراحی شد.
- دسته‌بندی‌ها ظاهر زنده‌تر گرفتند.
- سکشن پیشنهادهای امروز اضافه شد.
- CTA نهایی ورود به فروشگاه اضافه شد.
- Bottom Navigation به Dock شناور با دکمه رزرو برجسته تبدیل شد.
- تم رنگی Carrtell غنی‌تر شد.

## فایل‌های تغییرکرده
- src/screens/HomeScreen.tsx
- src/components/BottomNav.tsx
- src/theme/colors.ts

## دست‌نخورده
- App.tsx navigation logic
- ShopScreen
- BookingScreen
- CartScreen
- ProfileScreen
- package.json
- app.json
- Supabase
- OTP
- Payment

## SQL
ندارد.

## نصب
```powershell
cd "D:\carrtell\Carrtell-v0.2-current\carrtell-app"

Expand-Archive -LiteralPath ".\CARRTELL-APP-UI-REFRESH-V1.1.0.zip" -DestinationPath "." -Force

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\CARRTELL-APP-UI-REFRESH-V1.1.0\install-app-ui-110.ps1"
```

## تست
```powershell
npx tsc --noEmit
npx expo start -c
```
