# Patch Manifest — CARRTELL-SPRINT-POLISH-01

- Base: آخرین فایل `project.zip` آپلودشده در 2026-08-02
- Scope: Mobile bottom navigation + booking mobile polish
- Database migration: ندارد
- Secrets changed: خیر
- Files added to patch: 5
- Source files replaced: 3

## Source changes
- `src/components/MobileBottomNav.tsx`
  - route matching اصلاح شد
  - keyboard/modal visibility اصلاح شد
  - accessibility state اضافه شد
- `src/pages/BookPage.tsx`
  - مدیریت کلاس `ct-modal-open` برای مودال انتخاب خودرو
- `src/index.css`
  - Floating active circle
  - Carrtell red glow
  - Safe Area و spacing رزرو
  - Reduced Motion

## Validation
- TypeScript typecheck: PASS
- Production build: NOT COMPLETED (registry dependency unavailable in delivery environment)
