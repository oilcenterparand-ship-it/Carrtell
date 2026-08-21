import { test, expect } from '@playwright/test';

const fakeCart = {
  "qa-product-1": {
    product: {
      id: "qa-product-1",
      product_id: "qa-product-1",
      name: "QA Carrtell Product",
      price: 750000,
      stock: 10,
      is_active: true,
      is_out_of_stock: false
    },
    quantity: 1
  }
};

test.describe('Carrtell v2.2 shop/cart customer journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((cart) => {
      sessionStorage.setItem('carrtell_cart_v1', JSON.stringify(cart));
    }, fakeCart);
  });

  test('shop is publicly accessible and exposes service shortcut', async ({ page }) => {
    await page.goto('/shop');

    await expect(page.locator('main.ct-shop-page')).toBeVisible();
    expect(page.url()).not.toContain('/login-otp');

    const serviceLink = page.locator('a[href="/book"]').first();
    await expect(serviceLink).toBeVisible();
  });

  test('shop car picker opens on touch/desktop', async ({ page }) => {
    await page.goto('/shop');

    const trigger = page.locator('.ct-shop-car-banner-action');

    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page.locator('.ct-shop-car-picker')).toBeVisible();
    await expect(page.locator('.ct-shop-car-picker select')).toBeVisible();
    await expect(page.locator('.ct-shop-car-picker input')).toBeVisible();
  });

  test('cart is viewable by guest without forced login', async ({ page }) => {
    await page.goto('/cart');

    await expect(page).toHaveURL(/\/cart/);
    expect(page.url()).not.toContain('/login-otp');

    await expect(page.getByText('QA Carrtell Product')).toBeVisible();
  });

  test('cart product detail links use the real product route', async ({ page }) => {
    await page.goto('/cart');

    const link = page
      .getByRole('link', { name: 'QA Carrtell Product' })
      .first();

    await expect(link).toHaveAttribute(
      'href',
      '/shop/product/qa-product-1'
    );
  });

  test('guest checkout does not demand account before payment step', async ({ page }) => {
    await page.goto('/cart');

    const continueButton = page
      .getByRole('button', { name: /ادامه ثبت سفارش/ })
      .first();

    await expect(continueButton).toBeVisible();
    await continueButton.click();

    const nameInput = page
      .getByPlaceholder(/امین|نام/)
      .first();

    const phoneInput = page
      .getByPlaceholder(/09/)
      .first();

    await expect(nameInput).toBeVisible();
    await nameInput.fill('کاربر تست کارتل');

    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('09121234567');

    await page
      .getByRole('button', { name: 'ادامه', exact: true })
      .click();

    await page
      .getByRole('button', { name: /تحویل حضوری/ })
      .click();

    const goPayment = page
      .getByRole('button', { name: /ادامه پرداخت/ });

    await expect(goPayment).toBeEnabled();
    await goPayment.click();

    expect(
      page.url(),
      'guest was forced to OTP before payment'
    ).not.toContain('/login-otp');
  });

  test('mobile shop/cart have no major horizontal overflow', async ({ page }, testInfo) => {
    test.skip(!/android|iphone|mobile/i.test(testInfo.project.name));

    for (const route of ['/shop', '/cart']) {
      await page.goto(route);

      const d = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth
      }));

      expect(
        d.sw - d.cw,
        `${route} overflow = ${d.sw - d.cw}px`
      ).toBeLessThanOrEqual(6);
    }
  });
});