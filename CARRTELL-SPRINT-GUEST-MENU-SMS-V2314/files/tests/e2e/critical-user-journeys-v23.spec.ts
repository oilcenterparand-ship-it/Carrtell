import { test, expect, type Page } from '@playwright/test';

const car = {
  id: '11111111-1111-4111-8111-111111111111', brand: 'سایپا', model: 'پراید', trim: '131', engine: 'M13',
  is_active: true, service_interval_km: 5000,
};

const product = {
  id: '22222222-2222-4222-8222-222222222222', name: 'روغن موتور تست سازگار پراید', brand: 'Carrtell QA',
  category: 'engine-oil', price: 890000, stock: 8, is_active: true,
  is_featured: false, is_best_seller: false, compatible_all_cars: false,
  recommendation_reason: 'مناسب برای سرویس انتخابی و خودروی تست',
};

const service = {
  id: '33333333-3333-4333-8333-333333333333', title: 'تعویض روغن موتور', description: 'تعویض روغن و کنترل سطح مایعات',
  icon: '🛢️', base_labor_fee: 180000, estimated_minutes: 35, is_active: true,
  sort_order: 1, recommended_categories: ['روغن موتور', 'فیلتر روغن'],
};

const slot = {
  id: '44444444-4444-4444-8444-444444444444', label: '۹ تا ۱۱', start_time: '09:00', end_time: '11:00',
  capacity: 3, remaining: 3, is_active: true,
};

async function mockBookingBackend(page: Page) {
  let requestRow: any = null;
  const trace = {
    cars: 0,
    products: 0,
    compatibility: 0,
    services: 0,
    pricing: 0,
    packages: 0,
    packageItems: 0,
    restUrls: [] as string[],
  };



  await page.route('**/auth/v1/otp**', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/auth/v1/verify**', async route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ access_token: 'qa-token', refresh_token: 'qa-refresh', token_type: 'bearer', expires_in: 3600, user: { id: 'qa-user', phone: '+989121234567' } }),
  }));

  await page.route('**/rest/v1/**', async route => {
    const url = new URL(route.request().url());
    const path = decodeURIComponent(url.pathname);
    const table = path.split('/').filter(Boolean).at(-1) || '';
    trace.restUrls.push(`${route.request().method()} ${path}${url.search}`);
    const method = route.request().method();
    const json = (value: unknown, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'Content-Range': Array.isArray(value) ? `0-${Math.max(0, value.length - 1)}/${value.length}` : '0-0/1' },
      body: JSON.stringify(value),
    });

    if (table === 'cars') { trace.cars += 1; return json([car]); }
    if (table === 'products') { trace.products += 1; return json([product]); }
    if (table === 'product_compatible_cars') {
      trace.compatibility += 1;
      return json([{ product_id: product.id, car_id: car.id }]);
    }
    if (table === 'booking_services') { trace.services += 1; return json([service]); }
    if (table === 'service_pricing_settings') {
      trace.pricing += 1;
      return json({ id: 'default', travel_fee: 150000, night_fee: 0, holiday_fee: 0, out_of_area_fee: 0, night_start_hour: 18, club_discount_percent: 0, service_area_cities: ['پرند'] });
    }
    if (table === 'customer_addresses') return json([]);
    if (table === 'car_packages') {
      trace.packages += 1;
      return json([{
        id: '55555555-5555-4555-8555-555555555555',
        title: 'پکیج سرویس روغن پراید',
        category_title: 'سرویس دوره‌ای',
        car_id: car.id,
        is_active: true,
        sort_order: 1,
        description: 'پکیج آماده برای خودروی تست',
      }]);
    }
    if (table === 'car_package_items') {
      trace.packageItems += 1;
      return json([{
        id: '66666666-6666-4666-8666-666666666666',
        package_id: '55555555-5555-4555-8555-555555555555',
        product_id: product.id,
        quantity: 1,
        products: product,
      }]);
    }
    if (path.endsWith('/service_requests') && method === 'POST') {
      const body = route.request().postDataJSON() as any;
      requestRow = Array.isArray(body) ? body[0] : body;
      return json([], 201);
    }
    if (path.endsWith('/service_requests') && method === 'GET') return json(requestRow || {});

    return json([]);
  });

  await page.route('**/rest/v1/rpc/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const json = (value: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
    if (path.endsWith('/get_booking_slots_for_date')) return json([slot]);
    if (path.endsWith('/reserve_booking_slot')) return json([{ success: true, message: 'ok' }]);
    if (path.endsWith('/pay_service_request_test')) return json([{ ...(requestRow || {}), payment_status: 'paid', payment_reference: 'QA-PAY-123', paid_at: new Date().toISOString() }]);
    if (path.endsWith('/get_service_request_guest')) return json([requestRow || {}]);
    return json([]);
  });

  return trace;
}

test.describe('Carrtell v2.3 critical user journeys', () => {
  test('guest hamburger menu stays fully public and contains no login gate', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'باز کردن منو' });
    await expect(menu).toBeVisible();
    await menu.click();

    const drawer = page.locator('.ct-new-drawer');
    await expect(drawer).toBeVisible();
    expect(page.url()).not.toContain('/login-otp');

    await expect(drawer.locator('a[href="/login-otp"]')).toHaveCount(0);
    await expect(drawer.getByTestId('guest-drawer-public-note')).toContainText('خرید و رزرو بدون ورود');
    await expect(drawer.getByRole('link', { name: 'سرویس در محل' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'فروشگاه' })).toBeVisible();
  });

  test('header cart icon really opens MiniCart and reaches cart page', async ({ page }) => {
    await page.addInitScript((cart) => sessionStorage.setItem('carrtell_cart_v1', JSON.stringify(cart)), {
      [product.id]: { product, quantity: 1 },
    });
    await page.goto('/shop');
    const cartButton = page.getByTestId('header-cart-button');
    await expect(cartButton).toBeVisible();
    await cartButton.click();
    const panel = page.getByTestId('mini-cart-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(product.name)).toBeVisible();
    await panel.getByRole('link', { name: 'رفتن به سبد خرید' }).click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByText(product.name)).toBeVisible();
  });

  test('service -> vehicle -> compatible product/package -> time -> address -> payment works', async ({ page }) => {
    const backendTrace = await mockBookingBackend(page);
    await page.goto('/book');

    // 1) service first
    await expect(page.locator('[data-booking-step="service"]')).toBeVisible();
    await page.getByRole('button', { name: /تعویض روغن موتور/ }).click();
    await page.getByRole('button', { name: /ادامه/ }).click();

    // 2) vehicle second
    await expect(page.locator('[data-booking-step="vehicle"]')).toBeVisible();
    await page.locator('.ct-book-car-trigger').click();
    const modal = page.locator('.ct-book-car-modal');
    await modal.locator('select').selectOption('سایپا');
    const targetCar = modal.locator('[data-car-id="11111111-1111-4111-8111-111111111111"]');
    await expect(targetCar).toBeVisible();
    await targetCar.click();
    await modal.getByRole('button', { name: 'تأیید خودرو' }).click();
    await page.getByRole('button', { name: /ادامه/ }).click();

    // 3) recommendations must actually exist after vehicle selection
    const recommendations = page.locator('[data-booking-step="recommendations"]');
    await expect(recommendations).toBeVisible();

    await expect.poll(
      () => ({
        cars: backendTrace.cars > 0,
        products: backendTrace.products > 0,
        compatibility: backendTrace.compatibility > 0,
        services: backendTrace.services > 0,
        pricing: backendTrace.pricing > 0,
        packages: backendTrace.packages > 0,
        packageItems: backendTrace.packageItems > 0,
      }),
      {
        message: `Recommendation sources missing. REST trace: ${JSON.stringify(backendTrace.restUrls)}`,
        timeout: 5000,
      },
    ).toEqual({
      cars: true,
      products: true,
      compatibility: true,
      services: true,
      pricing: true,
      packages: true,
      packageItems: true,
    });

    const diagnostic = async () => ({
      backendTrace: { ...backendTrace },
      recommendationText: (await recommendations.innerText()).slice(0, 2000),
      url: page.url(),
    });

    await expect(
      recommendations.getByText('پکیج سرویس روغن پراید'),
      `Package missing after backend completed: ${JSON.stringify(await diagnostic())}`,
    ).toBeVisible();

    await expect(
      recommendations.getByText(product.name),
      `Compatible product missing after backend completed: ${JSON.stringify(await diagnostic())}`,
    ).toBeVisible();
    await recommendations.getByRole('button', { name: /پکیج سرویس روغن پراید/ }).click();
    await page.getByRole('button', { name: /ادامه/ }).click();

    // 4) date/time
    await expect(page.locator('[data-booking-step="time"]')).toBeVisible();
    await page.getByRole('button', { name: /۹ تا ۱۱/ }).click();
    await page.getByRole('button', { name: /ادامه/ }).click();

    // 5) contact + OTP + address
    await expect(page.locator('[data-booking-step="address"]')).toBeVisible();
    await page.getByPlaceholder('نام مشتری').fill('کاربر تست کارتل');
    await page.getByPlaceholder('09123456789').fill('09121234567');
    await page.getByRole('button', { name: 'تأیید شماره' }).click();
    await page.getByPlaceholder('کد تأیید').fill('123456');
    await page.getByRole('button', { name: 'ثبت کد' }).click();
    await expect(page.getByText('شماره موبایل با موفقیت تأیید شد.')).toBeVisible();
    await page.getByPlaceholder(/آدرس کامل/).fill('پرند، میدان استقلال، تست خودکار Carrtell');
    await page.getByRole('button', { name: /ادامه/ }).click();

    // 6) review and payment page
    const review = page.locator('[data-booking-step="review"]');
    await expect(review).toBeVisible();
    await expect(review.getByText(product.name)).toBeVisible();
    await page.getByRole('button', { name: /ثبت رزرو و رفتن به پرداخت/ }).click();
    await expect(page).toHaveURL(/\/service-payment\//);
    await expect(page.getByRole('heading', { name: 'پرداخت رزرو سرویس' })).toBeVisible();
    await page.getByRole('button', { name: /پرداخت آزمایشی و ادامه/ }).click();
    await expect(page.getByRole('heading', { name: 'پرداخت سرویس با موفقیت ثبت شد' })).toBeVisible();
    await expect(page.getByText('مایل هستید با همین شماره برایتان حساب کاربری ساخته شود؟')).toBeVisible();
  await expect(page.getByRole('button', { name: 'بله، حسابم را بساز' })).toBeVisible();
  });
});
