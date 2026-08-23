import { expect, test } from '@playwright/test';

test.describe('Login requests never leave the UI frozen', () => {
  test('customer password login returns control after a rejected request', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) => route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
    }));
    await page.route('**/functions/v1/customer-credentials', (route) => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'نام کاربری یا رمز عبور صحیح نیست.' }),
    }));

    await page.goto('/login-otp');
    await page.getByRole('button', { name: 'نام کاربری و رمز' }).click();
    await page.getByPlaceholder('شماره موبایل / نام کاربری').fill('09120000000');
    await page.getByPlaceholder('رمز عبور').fill('wrong-password');
    const submit = page.getByRole('button', { name: 'ورود', exact: true });
    await submit.click();
    await expect(page.getByRole('status')).toBeVisible();
    await expect(submit).toBeEnabled();
  });

  test('admin login returns control after a rejected request', async ({ page }) => {
    await page.route('**/auth/v1/token**', (route) => route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
    }));
    await page.route('**/functions/v1/staff-password-login', (route) => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'نام کاربری یا رمز عبور صحیح نیست.' }),
    }));

    await page.goto('/admin/login');
    await page.getByPlaceholder(/مثلاً amin|نام کاربری/).fill('invalid-admin');
    await page.getByPlaceholder('رمز عبور').fill('wrong-password');
    const submit = page.getByRole('button', { name: 'ورود امن' });
    await submit.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(submit).toBeEnabled();
  });
});
