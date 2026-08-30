import { test, expect } from '@playwright/test';
import { auditBasicUx, assertNoRuntimeErrors, watchRuntime } from './helpers/personaAudit';

const username = process.env.CARRTELL_ADMIN_USERNAME || '';
const password = process.env.CARRTELL_ADMIN_PASSWORD || '';
const adminRoutes = [
  '/admin/dashboard', '/admin/categories', '/admin/products', '/admin/orders', '/admin/service-requests',
  '/admin/dispatch', '/admin/inventory', '/admin/customers-crm', '/admin/settings',
  '/admin/home-content',
  '/admin/discounts', '/admin/service-booking-settings',
  '/admin/navigation-audit', '/admin/system-health', '/admin/bug-reports',
];

test.describe('Persona: Admin', () => {
  test('admin login gate is healthy', async ({ page }, testInfo) => {
    const runtime = watchRuntime(page);
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('heading', { name: /ورود به پنل مدیریت/ })).toBeVisible();
    await auditBasicUx(page, testInfo, 'admin/login');
    await assertNoRuntimeErrors(runtime, testInfo, 'admin/auth', new URL(page.url()).pathname);
  });

  test('authenticated admin can open critical management sections', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'admin route sweep runs on desktop');
    expect(username, 'CARRTELL_ADMIN_USERNAME is required; Carrtell agent scripts prompt for it.').not.toBe('');
    expect(password, 'CARRTELL_ADMIN_PASSWORD is required; Carrtell agent scripts prompt for it securely.').not.toBe('');
    await page.goto('/admin/login');
    await page.getByPlaceholder(/مثلاً amin|نام کاربری/).fill(username);
    await page.getByPlaceholder(/رمز عبور/).fill(password);
    await page.getByRole('button', { name: /ورود امن|ورود/ }).click();
    await expect(page).not.toHaveURL(/\/admin\/login(?:\?|$)/, { timeout: 35_000 });
    await expect(page).toHaveURL(/\/admin\/(?:dashboard|$)/, { timeout: 35_000 });
    await expect(page.getByText('کار امروز', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /عملیات سرویس/ }).first()).toBeVisible();

    for (const route of adminRoutes) {
      const runtime = watchRuntime(page);
      await page.goto(route);
      await expect(page).not.toHaveURL(/\/admin\/login/);
      await expect(page.locator('body')).toBeVisible();
      const text = (await page.locator('body').innerText()).trim();
      expect(text.length, `blank admin page: ${route}`).toBeGreaterThan(20);
      await auditBasicUx(page, testInfo, `admin${route.replace('/admin', '')}`);
      await assertNoRuntimeErrors(runtime, testInfo, 'admin/routes', route);
      if (route === '/admin/home-content') {
        await expect(page.getByTestId('admin-mega-menu-promotion-form')).toBeVisible();
        await expect(page.getByTestId('admin-home-hero-promo-tiles-section')).toBeVisible();
        await expect(page.getByTestId('admin-home-hero-promo-tile-form')).toBeVisible();
        await expect(page.getByTestId('admin-home-slider-banners-section')).toBeVisible();
        await expect(page.getByTestId('admin-home-slider-banner-form')).toBeVisible();
        await expect(page.getByText('تصویر بنر اسلایدی', { exact: true })).toBeVisible();
        const sliderLink = page.getByPlaceholder('لینک مقصد؛ مثال: /shop?category=engine-oil');
        await sliderLink.fill('/industrial');
        await expect(sliderLink).toHaveValue('/industrial');
        const tileLink = page.getByPlaceholder('لینک مقصد؛ مثال: /shop?q=نظافت');
        await tileLink.fill('/shop?q=فیلتر');
        await expect(tileLink).toHaveValue('/shop?q=فیلتر');
        const megaLink = page.getByTestId('admin-mega-menu-promotion-form').getByPlaceholder('لینک مقصد');
        await megaLink.fill('/book');
        await expect(megaLink).toHaveValue('/book');
      }
      if (route === '/admin/categories') {
        await expect(page.getByRole('heading', { name: 'ساخت دسته و زیرشاخه محصولات' })).toBeVisible();
        await expect(page.getByRole('button', { name: '+ دسته اصلی جدید' })).toBeVisible();
        await expect(page.getByRole('button', { name: '+ زیرشاخه جدید' })).toBeVisible();
        await expect(page.getByText('تصویر داخل کارت دسته‌بندی', { exact: true })).toBeVisible();
      }
      if (route === '/admin/products') await expect(page.getByText('شاخه‌های داینامیک محصول', { exact: true })).toBeVisible();
      if (route === '/admin/discounts') {
        await expect(page.getByText('تصویر بنر کمپین', { exact: true })).toBeVisible();
        await expect(page.getByText('شروع کمپین (شمسی)', { exact: true })).toBeVisible();
        await expect(page.getByText('پایان کمپین (شمسی)', { exact: true })).toBeVisible();
      }
      if (route === '/admin/service-booking-settings') {
        await expect(page.getByText('آیکون خدمت', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('زمان تقریبی (دقیقه)', { exact: true }).first()).toBeVisible();
      }
      if (route === '/admin/orders') {
        await expect(page.getByRole('button', { name: 'آنلاین پرداخت‌شده' })).toBeVisible();
      }
    }
  });
});
