# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: persona-admin.spec.ts >> Persona: Admin >> authenticated admin can open critical management sections
- Location: tests\e2e\persona-admin.spec.ts:23:3

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/admin\/login(?:\?|$)/
Received string: "http://127.0.0.1:4173/admin/login"
Timeout: 20000ms

Call log:
  - Expect "not toHaveURL" with timeout 20000ms
    43 × locator resolved to <html lang="fa" dir="rtl" class="ct-theme-ready" data-ct-theme-base="dark" data-ct-user-mode="system" data-ct-resolved-mode="dark" data-ct-theme-preset="premium-dark">…</html>
       - unexpected value "http://127.0.0.1:4173/admin/login"

```

```yaml
- link "🛠 تست سلامت مسیرها":
  - /url: /admin/navigation-audit
- main:
  - img
  - heading "ورود به پنل مدیریت" [level=1]
  - paragraph: ورود مدیران با نام کاربری و رمز عبور؛ بدون OTP
  - text: نام کاربری
  - img
  - textbox "مثلاً amin": admin
  - text: رمز عبور
  - img
  - textbox "رمز عبور": "12345678"
  - button:
    - img
  - alert: پاسخ سرور ورود بیش از حد طول کشید. دوباره تلاش کنید.
  - button "ورود امن"
  - paragraph: نام کاربری و رمز موقت از تنظیمات مرکزی مدیریت قابل تغییر است.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { auditBasicUx, assertNoRuntimeErrors, attachFeedback, watchRuntime } from './helpers/personaAudit';
  3  | 
  4  | const username = process.env.CARRTELL_ADMIN_USERNAME || 'admin';
  5  | const password = process.env.CARRTELL_ADMIN_PASSWORD || 'admin';
  6  | const adminRoutes = [
  7  |   '/admin/dashboard', '/admin/products', '/admin/orders', '/admin/service-requests',
  8  |   '/admin/dispatch', '/admin/inventory', '/admin/customers-crm', '/admin/settings',
  9  |   '/admin/home-content',
  10 |   '/admin/navigation-audit', '/admin/system-health', '/admin/bug-reports',
  11 | ];
  12 | 
  13 | test.describe('Persona: Admin', () => {
  14 |   test('admin login gate is healthy', async ({ page }, testInfo) => {
  15 |     const runtime = watchRuntime(page);
  16 |     await page.goto('/admin/dashboard');
  17 |     await expect(page).toHaveURL(/\/admin\/login/);
  18 |     await expect(page.getByRole('heading', { name: /ورود به پنل مدیریت/ })).toBeVisible();
  19 |     await auditBasicUx(page, testInfo, 'admin/login');
  20 |     await assertNoRuntimeErrors(runtime, testInfo, 'admin/auth', new URL(page.url()).pathname);
  21 |   });
  22 | 
  23 |   test('authenticated admin can open critical management sections', async ({ page }, testInfo) => {
  24 |     test.skip(testInfo.project.name !== 'desktop-chrome', 'admin route sweep runs on desktop');
  25 |     await page.goto('/admin/login');
  26 |     await page.getByPlaceholder(/مثلاً amin|نام کاربری/).fill(username);
  27 |     await page.getByPlaceholder(/رمز عبور/).fill(password);
  28 |     await page.getByRole('button', { name: /ورود امن|ورود/ }).click();
> 29 |     await expect(page).not.toHaveURL(/\/admin\/login(?:\?|$)/, { timeout: 20_000 });
     |                            ^ Error: expect(page).not.toHaveURL(expected) failed
  30 |     await expect(page).toHaveURL(/\/admin\/(?:dashboard|$)/, { timeout: 20_000 });
  31 |     await expect(page.getByText('کار امروز', { exact: true })).toBeVisible();
  32 |     await expect(page.getByRole('link', { name: /عملیات سرویس/ }).first()).toBeVisible();
  33 | 
  34 |     for (const route of adminRoutes) {
  35 |       const runtime = watchRuntime(page);
  36 |       await page.goto(route);
  37 |       await expect(page).not.toHaveURL(/\/admin\/login/);
  38 |       await expect(page.locator('body')).toBeVisible();
  39 |       const text = (await page.locator('body').innerText()).trim();
  40 |       expect(text.length, `blank admin page: ${route}`).toBeGreaterThan(20);
  41 |       await auditBasicUx(page, testInfo, `admin${route.replace('/admin', '')}`);
  42 |       await assertNoRuntimeErrors(runtime, testInfo, 'admin/routes', route);
  43 |       if (route === '/admin/home-content') await expect(page.getByTestId('admin-mega-menu-promotion-form')).toBeVisible();
  44 |     }
  45 |   });
  46 | });
  47 | 
```