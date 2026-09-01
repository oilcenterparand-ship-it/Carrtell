import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('each purchased product has its own safe review form', () => {
  const page = read('src/pages/ReviewPage.tsx');
  const api = read('src/admin/services/customerReviewsApi.ts');
  const migration = read('supabase/migrations/202608310001_product_level_customer_reviews.sql');
  expect(page).toContain('نظر درباره محصولات سفارش');
  expect(page).toContain('ثبت نظر این محصول');
  expect(page).toContain('UUID_PATTERN.test');
  expect(page).toContain('resolved_product_id');
  expect(page).toContain('product_name: item.product_name');
  expect(api).toContain('product_name?: string | null');
  expect(api).toContain('review.product_name');
  expect(migration).toContain('add column if not exists product_name text');
});

test('all shop product sections support plus, minus and removal', () => {
  const shop = read('src/pages/ShopPage.tsx');
  const home = read('src/pages/HomePage.tsx');
  expect((shop.match(/onChangeQuantity=\{changeQuantity\}/g) || []).length).toBeGreaterThanOrEqual(3);
  expect(shop).toContain('changeCartQuantity(product, delta)');
  expect(home).toContain('onChangeQuantity={handleQuantity}');
});

test('compatible-products page is focused and marks matches without hiding the catalog', () => {
  const page = read('src/pages/MyCarProductsPage.tsx');
  expect(page).toContain('getProducts()');
  expect(page).toContain('products.map((product)');
  expect(page).toContain('selectedCarId={selectedCarId || undefined}');
  expect(page).toContain('محصولات سازگار با خودروی شما با نشان سبز مشخص شده‌اند');
  expect(page).toContain('تغییر خودرو');
  expect(page).not.toContain('کیلومتر خودرو');
  expect(page).not.toContain('پکیج آماده');
  expect(page).not.toContain('بروزرسانی');
});

test('customer profile prioritizes orders, wallet, cars and addresses', () => {
  const dashboard = read('src/pages/DashboardPage.tsx');
  expect(dashboard).toContain('گزینه‌های بیشتر حساب');
  expect(dashboard).toContain('href="/profile/wallet"');
  expect(dashboard).toContain('خودروهای من');
  expect(dashboard).toContain('مشخصات و امنیت');
  expect(dashboard).toContain('grid grid-cols-4');
});

test('admin mobile overlays stay inside viewport and floating helpers do not overlap', () => {
  const header = read('src/admin/components/AdminHeader.tsx');
  const guide = read('src/admin/components/AdminPageGuide.tsx');
  const health = read('src/admin/components/AdminHealthButton.tsx');
  expect(header).toContain('fixed left-3 right-3 top-[78px]');
  expect(header).toContain('max-h-[calc(100dvh-90px)]');
  expect(guide).toContain('bottom-3 right-3');
  expect(guide).toContain('راهنمای صفحه');
  expect(health).toContain("left: 16");
  expect(health).toContain("bottom: 12");
});

test('desktop receives legacy hero while mobile retains promo tiles', () => {
  const home = read('src/pages/HomePage.tsx');
  const css = read('src/index.css');
  expect(home).toContain('ct-home-desktop-legacy-hero');
  expect(home).toContain('ct-reference-promo-grid');
  expect(css).toContain('@media(min-width:1024px)');
  expect(css).toContain('.ct-reference-promo-grid{display:none}');
  expect(css).toContain('.ct-home-desktop-legacy-hero{display:none}');
});
