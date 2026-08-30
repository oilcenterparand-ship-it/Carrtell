import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test('staff login issues a device-independent one-time session token', () => {
  const edge = read('supabase/functions/staff-password-login/index.ts');
  const client = read('src/auth/staffPasswordAuth.ts');
  expect(edge).toContain("type:'magiclink'");
  expect(edge).toContain('token_hash:tokenHash');
  expect(client.indexOf('if (data.token_hash)')).toBeLessThan(client.indexOf('else if (data.email)'));
});

test('product hover text keeps full name and price and uses themed media canvas', () => {
  const shop = read('src/pages/ShopPage.tsx');
  expect(shop).toContain("const imageBg = theme.cardImageBackground || '#101a2c'");
  expect(shop).toContain('title={`${product.name} | قیمت ${formatPrice(finalPrice)} تومان`}');
  expect(shop).not.toContain('const hoverDetails =');
});

test('booking product selection preserves the card and only adds a green check', () => {
  const book = read('src/pages/BookPage.tsx');
  expect(book).toContain('aria-pressed={active} className="ct-book-product-card');
  expect(book).toContain('ct-book-product-check');
  expect(book).toContain('setSelectedProductIds');
});

test('travel estimate exposes actionable Neshan and schema errors', () => {
  const edge = read('supabase/functions/service-travel-estimate/index.ts');
  const client = read('src/customer/services/serviceTravelApi.ts');
  expect(edge).toContain("status === 485 ? 'neshan_routing_not_enabled'");
  expect(edge).toContain("new URL('https://api.neshan.org/v1/distance-matrix')");
  expect(edge).toContain("routeSource = 'distance-matrix-traffic'");
  expect(edge).toContain("error: 'pricing_schema_unavailable'");
  expect(client).toContain('سرویس مسیریابی برای کلید نشان فعال نشده است.');
  expect(client).toContain('context.clone().json()');
});
