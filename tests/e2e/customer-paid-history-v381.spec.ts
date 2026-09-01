import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('verified booking is attached to the current authenticated customer', () => {
  const booking = read('src/pages/BookPage.tsx');
  const api = read('src/customer/services/serviceRequestsApi.ts');
  expect(booking).not.toContain("customer_user_id: bookingStartedAsGuestRef.current === true");
  expect(api).toContain("supabase.rpc('carrtell_claim_my_paid_history')");
});

test('customer profile combines shop orders and service bookings', () => {
  const dashboard = read('src/pages/DashboardPage.tsx');
  expect(dashboard).toContain('getServiceRequestsByPhone');
  expect(dashboard).toContain('serviceOrders.filter');
  expect(dashboard).toContain('پرداخت موفق');
  expect(dashboard).toContain('مشاهده جزئیات');
  expect(dashboard).toContain('embeddedOrderItems(order)');
  expect(dashboard).toContain('!request.order_id || !userOrders.some');
});

test('service fee rows never use clipped pill labels', () => {
  const booking = read('src/pages/BookPage.tsx');
  const css = read('src/index.css');
  expect(booking).toContain('ct-book-service-line');
  expect(booking).toContain('جمع خدمات');
  expect(css).toContain('overflow-wrap:anywhere');
  expect(css).not.toContain('.ct-book-service-chips small{max-width:130px');
});

test('history migration only claims paid rows for the verified phone', () => {
  const migration = read('supabase/migrations/202608300001_customer_paid_history_link.sql');
  expect(migration).toContain("payment_status = 'paid'");
  expect(migration).toContain('auth.uid()');
  expect(migration).toContain('u.phone_confirmed_at is not null');
  expect(migration).toContain('carrtell_normalize_ir_phone(u.phone)');
  expect(migration).not.toContain('coalesce(p.phone,u.phone)');
  expect(migration).toContain('carrtell_normalize_ir_phone(customer_phone) = verified_phone');
  expect(migration).toContain("grant execute on function public.carrtell_claim_my_paid_history() to authenticated");
});

test('compatible-products shortcut points to an all-products compatibility route', () => {
  const app = read('src/App.tsx');
  const home = read('src/pages/HomePage.tsx');
  const compatible = read('src/pages/MyCarProductsPage.tsx');
  expect(home).toContain("to: '/my-car/products'");
  expect(app).toContain('path="/my-car/products"');
  expect(app).toContain('element={<MyCarProductsPage />}');
  expect(compatible).toContain('getProducts()');
  expect(compatible).toContain('همه محصولات فروشگاه');
  expect(compatible).toContain('selectedCarId={selectedCarId || undefined}');
  expect(compatible).toContain('onChangeQuantity={changeQuantity}');
  expect(compatible).not.toContain('کیلومتر خودرو');
  expect(compatible).not.toContain('getMyCarRecommendations');
});
