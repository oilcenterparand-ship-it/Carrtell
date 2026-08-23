import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Carrtell V5.2.1 source contracts', () => {
  test('booking OTP and cart regressions remain fixed', async () => {
    const source = fs.readFileSync(path.resolve('src/pages/BookPage.tsx'), 'utf8');

    expect(source).toContain("setOtpVerifyError('کد اشتباه است.')");
    expect(source).toContain("setOtpVerifyError('کد منقضی شده، دوباره تلاش کنید.')");
    expect(source).toContain('data-testid="booking-otp-error"');
    expect(source).toContain('const serviceLaborTotal = useMemo');
    expect(source).toContain('>خدمات</span>');
    expect(source).toContain('>محصولات</span>');

    const toggleStart = source.indexOf('function toggleService');
    const toggleEnd = source.indexOf('function toggleProduct', toggleStart);
    const toggleBody = source.slice(toggleStart, toggleEnd);
    expect(toggleBody).not.toContain('setSelectedProductIds([])');
    expect(toggleBody).not.toContain('setProductQuantities({})');
    expect(toggleBody).not.toContain('setSelectedPackageIds([])');
  });

  test('post-payment account activation requires password and mobile username', async () => {
    const source = fs.readFileSync(path.resolve('src/pages/ServicePaymentPage.tsx'), 'utf8');

    expect(source).toContain("import { setCustomerCredentials } from '../auth/authApi'");
    expect(source).toContain("await setCustomerCredentials(username, accountPassword)");
    expect(source).toContain('await claimGuestServiceRequest(requestId)');
    expect(source).toContain('aria-label="نام کاربری"');
    expect(source).toContain('aria-label="رمز عبور"');
    expect(source).toContain('aria-label="تکرار رمز عبور"');
    expect(source).toContain('ساخت حساب و ورود');
  });
});
