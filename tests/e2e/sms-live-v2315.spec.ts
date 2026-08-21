import { test, expect } from '@playwright/test';

test.describe('Carrtell v2.3.15 real SMS diagnostic', () => {
  test('real Supabase OTP request reaches configured SMS hook', async ({ page }) => {
    const phone = process.env.CARRTELL_SMS_TEST_PHONE?.trim();

    test.skip(!phone, 'CARRTELL_SMS_TEST_PHONE is required.');
    expect(phone).toMatch(/^09\d{9}$/);

    const consoleLines: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (['error', 'warning'].includes(msg.type())) {
        consoleLines.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/login-otp');

    const phoneInput = page.getByPlaceholder('شماره موبایل؛ 09xxxxxxxxx');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill(phone);

    const otpResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/auth\/v1\/otp(?:\?|$)/.test(response.url()),
      { timeout: 15000 },
    );

    await page.getByRole('button', { name: 'دریافت کد ورود' }).click();

    const otpResponse = await otpResponsePromise;
    const status = otpResponse.status();
    const rawBody = await otpResponse.text().catch(() => '');
    let parsedBody: unknown = rawBody;

    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      // Keep raw response text for diagnostics.
    }

    const diagnostic = {
      otpHttpStatus: status,
      otpResponse: parsedBody,
      currentUrl: page.url(),
      consoleLines,
      pageErrors,
    };

    if (status < 200 || status >= 300) {
      throw new Error(
        `REAL SMS FAILED at Supabase Auth /otp: ${JSON.stringify(diagnostic)}`,
      );
    }

    const otpCodeGroup = page.getByLabel('کد تأیید شش رقمی');
    const successNotice = page.getByRole('status');

    await expect
      .poll(
        async () => ({
          otpInputsVisible: await otpCodeGroup.isVisible().catch(() => false),
          notice: await successNotice.textContent().catch(() => null),
        }),
        {
          timeout: 10000,
          message: `Supabase /otp returned success but UI did not enter OTP state: ${JSON.stringify(diagnostic)}`,
        },
      )
      .toMatchObject({ otpInputsVisible: true });

    const noticeText = (await successNotice.textContent().catch(() => '')) || '';
    console.log(
      `[CARRTELL_SMS_DIAGNOSTIC] Supabase OTP accepted. status=${status}; notice=${noticeText}`,
    );
    console.log(
      '[CARRTELL_SMS_DIAGNOSTIC] اگر پیامک به گوشی نرسید ولی این تست PASS شد، مشکل بعد از Supabase Auth و در مسیر Hook/Kavenegar delivery است؛ Edge Function Logs و sms_logs را بررسی کنید.',
    );
  });
});
