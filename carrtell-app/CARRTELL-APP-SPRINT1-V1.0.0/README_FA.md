# Carrtell App — Sprint 1

## مبنا
این Sprint فقط بر اساس ساختار واقعی ارسال‌شده ساخته شده:
- Expo 57.0.19
- App.tsx خام Expo
- app.json فعلی
- بدون تغییر package.json

## تحویل
- معماری پایه `src/`
- Home
- Shop
- Booking
- Cart
- Profile
- Bottom Navigation
- تم مشکی/طلایی Carrtell
- UI اولیه موبایل
- Service scaffold برای Sprint 2

## مهم
در Sprint 1 هیچ اتصال ساختگی Supabase اضافه نشده است.
اتصال واقعی باید بعد از بررسی API/env واقعی اپ انجام شود.
هیچ Secret داخل فرانت موبایل قرار نمی‌گیرد.

## فایل‌های تغییرکرده
- App.tsx
- src/components/BottomNav.tsx
- src/components/SectionHeader.tsx
- src/screens/HomeScreen.tsx
- src/screens/ShopScreen.tsx
- src/screens/BookingScreen.tsx
- src/screens/CartScreen.tsx
- src/screens/ProfileScreen.tsx
- src/theme/colors.ts
- src/types/navigation.ts
- src/services/README.md

## SQL
ندارد.

## نصب
```powershell
cd "D:\carrtell\Carrtell-v0.2-current\carrtell-app"

Expand-Archive -LiteralPath ".\CARRTELL-APP-SPRINT1-V1.0.0.zip" -DestinationPath "." -Force

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\CARRTELL-APP-SPRINT1-V1.0.0\install-app-sprint1.ps1"
```

## تست
```powershell
npx tsc --noEmit
npx expo start -c
```
