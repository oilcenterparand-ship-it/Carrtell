import { expect, test } from '@playwright/test';

const labels = {
  home: /خانه/,
  shop: /فروشگاه/,
  booking: /رزرو(?:\s*سرویس)?/,
  profile: /پروفایل/,
};

async function clickVisibleLabel(page: import('@playwright/test').Page, label: RegExp) {
  const candidate = page.getByText(label, { exact: false }).filter({ visible: true }).last();
  await expect(candidate).toBeVisible();
  await candidate.click();
}

test.describe('mobile bottom navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shop tab navigates to shop and does not jump to page bottom', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await clickVisibleLabel(page, labels.shop);
    await expect(page).toHaveURL(/\/shop(?:$|[?#])/);
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeLessThan(120);
  });

  test('booking tab navigates to booking route', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await clickVisibleLabel(page, labels.booking);
    await expect(page).toHaveURL(/\/book(?:$|[?#])/);
  });
});
