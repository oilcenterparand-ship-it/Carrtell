Carrtell Recommendation Engine Patch

بعد از کپی فایل‌ها:

1) SQL زیر را در Supabase اجرا کن:
docs/sql/2026_recommendation_engine.sql

2) در ریشه پروژه اجرا کن:
node scripts/apply-recommendation-patch.mjs

مسیرهای جدید:
/my-car/products
/admin/recommendations

قانون مهم:
این سیستم AI آزاد نیست. فقط محصولات active + موجود + سازگار با خودرو و پکیج‌های ساخته‌شده توسط مدیر را پیشنهاد می‌دهد.
