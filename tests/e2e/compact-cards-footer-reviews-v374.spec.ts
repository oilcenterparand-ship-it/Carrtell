import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('shop cards and grid use the compact V3.7.4 dimensions', () => {
  const shop = read('src/pages/ShopPage.tsx');
  const grid = read('src/components/shop/ShopProductGrid.tsx');
  const css = read('src/index.css');
  expect(shop).toContain("grid ? 'h-[252px]' : 'h-[246px]'");
  expect(shop).toContain("grid ? 'h-[98px]' : 'h-[94px]'");
  expect(shop).toContain('text-[12px] font-black');
  expect(grid).toContain('gap-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9');
  expect(css).toContain('20% denser desktop visual language');
});

test('customer reviews live in the footer and include the purchased experience', () => {
  const home = read('src/pages/HomePage.tsx');
  const footer = read('src/components/Footer.tsx');
  const api = read('src/admin/services/customerReviewsApi.ts');
  expect(home).not.toContain('نظر مشتریان');
  expect(footer).toContain('ct-footer-review');
  expect(footer).toContain('استفاده‌شده: {activeReview.experience_label}');
  expect(footer).toContain('setInterval');
  expect(api).toContain('experience_label');
  expect(api).toContain("from('service_requests')");
});
