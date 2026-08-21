import { expect, test } from '@playwright/test';

const publicRoutes = ['/', '/shop', '/book'];

for (const route of publicRoutes) {
  test(`public route ${route} renders without a fatal blank page`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);

    const fatal = consoleErrors.filter((x) => /uncaught|syntaxerror|referenceerror/i.test(x));
    expect(fatal, `Fatal console errors on ${route}`).toEqual([]);
  });
}

test('mobile viewport has no major horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(4);
});

test('public browsing does not immediately force an auth route', async ({ page }) => {
  await page.goto('/shop', { waitUntil: 'domcontentloaded' });
  expect(page.url()).not.toMatch(/login|signin|auth/i);
});
