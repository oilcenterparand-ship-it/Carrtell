# Carrtell Error Boundary Patch

این پچ جلوی صفحه سفید شدن سایت را می‌گیرد.

## فایل‌ها
- `src/components/ErrorBoundary.tsx`
- `src/main.tsx`

## نکته مهم
`AuthProvider` در `main.tsx` حفظ شده و داخل `ErrorBoundary` قرار گرفته است؛ بنابراین خطای `useAuth باید داخل AuthProvider استفاده شود` دوباره برنمی‌گردد.

## SQL
نیاز ندارد.
