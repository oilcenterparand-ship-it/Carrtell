import { test, expect } from '@playwright/test';
import { auditBasicUx, assertNoRuntimeErrors, attachFeedback, watchRuntime } from './helpers/personaAudit';

const username = process.env.CARRTELL_TECH_USERNAME || 'admin';
const password = process.env.CARRTELL_TECH_PASSWORD || 'admin';

async function loginTechnician(page: import('@playwright/test').Page) {
  await page.goto('/driver/login?returnTo=%2Fdriver');
  await expect(page.getByRole('heading', { name: /ورود سرویس.?کار/ })).toBeVisible();
  await page.getByPlaceholder(/نام کاربری/).fill(username);
  await page.getByPlaceholder(/رمز عبور/).fill(password);
  await page.getByRole('button', { name: /ورود به پنل سرویس.?کار/ }).click();
  await expect(page).toHaveURL(/\/driver(?:$|\/|\?)/, { timeout: 20_000 });
}

test.describe('Persona: Technician', () => {
  test('driver route is protected for anonymous users', async ({ page }, testInfo) => {
    const runtime = watchRuntime(page);
    await page.goto('/driver');
    await expect(page).toHaveURL(/\/driver\/login(?:\?|$)/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /ورود سرویس.?کار/ })).toBeVisible();
    await attachFeedback(testInfo, [{ severity: 'info', area: 'technician/auth', route: '/driver', message: 'مسیر سرویس‌کار برای کاربر ناشناس به صفحه ورود مستقل سرویس‌کار هدایت شد.' }]);
    await assertNoRuntimeErrors(runtime, testInfo, 'technician/auth', '/driver/login');
  });

  test('technician can load panel and operate visible task controls', async ({ page }, testInfo) => {
    const runtime = watchRuntime(page);
    await loginTechnician(page);
    await expect(page.getByText(/آماده دریافت مأموریت/)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('footer')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /ماموریت‌های من/ })).toBeVisible();
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/driver.webmanifest');
    await auditBasicUx(page, testInfo, 'technician/dashboard');

    const task = page.locator('section').filter({ hasText: /ماموریت بعدی|باز کردن ماموریت/ }).first();
    if (await task.isVisible().catch(() => false)) {
      const details = task.getByRole('link', { name: /باز کردن ماموریت/ });
      if (await details.isVisible().catch(() => false)) {
        await expect(details).toHaveAttribute('href', /\/driver\/jobs\//);
      }
    } else {
      await attachFeedback(testInfo, [{ severity: 'info', area: 'technician/jobs', route: '/driver', message: 'هیچ مأموریت فعالی برای سرویس‌کار تست وجود ندارد؛ تست عملیات مأموریت اجرا نشد.' }]);
    }
    await page.goto('/driver/jobs/test');
    await expect(page.getByText('روند ماموریت')).toHaveCount(0);
    await expect(page.getByText('اقدام بعدی')).toBeVisible();
    const nextAction = page.getByRole('button', { name: /قبول ماموریت|شروع حرکت|رسیدم به محل|شروع سرویس/ });
    await expect(nextAction).toHaveCount(1);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/driver.webmanifest');
    await expect(page).toHaveTitle(/Carrtell Driver/);
    await page.goto('/driver');
    await page.getByRole('button', { name: /حساب من/ }).click();
    await expect(page.getByText('Carrtell Driver', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /نصب Carrtell Driver|نصب شده/ })).toBeVisible();
    await assertNoRuntimeErrors(runtime, testInfo, 'technician/dashboard', '/driver');
  });
});
