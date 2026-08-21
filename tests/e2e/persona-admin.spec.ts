import { test, expect } from '@playwright/test';
import { auditBasicUx, assertNoRuntimeErrors, attachFeedback, watchRuntime } from './helpers/personaAudit';

const username = process.env.CARRTELL_ADMIN_USERNAME || 'admin';
const password = process.env.CARRTELL_ADMIN_PASSWORD || 'admin';
const adminRoutes = [
  '/admin/dashboard', '/admin/products', '/admin/orders', '/admin/service-requests',
  '/admin/dispatch', '/admin/inventory', '/admin/customers-crm', '/admin/settings',
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
    await page.goto('/admin/login');
    await page.getByPlaceholder(/مثلاً amin|نام کاربری/).fill(username);
    await page.getByPlaceholder(/رمز عبور/).fill(password);
    await page.getByRole('button', { name: /ورود امن|ورود/ }).click();
    await expect(page).not.toHaveURL(/\/admin\/login(?:\?|$)/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/admin\/(?:dashboard|$)/, { timeout: 20_000 });
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
    }
  });
});
