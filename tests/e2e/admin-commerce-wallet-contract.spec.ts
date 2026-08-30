import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test.describe('Admin commerce, campaign and wallet contracts', () => {
  test('campaign banners upload optimized images and use Jalali date-time fields', () => {
    const campaign = read('src/pages/AdminDiscountsCampaignsPage.tsx');
    expect(campaign).toContain('folder="banners"');
    expect(campaign).toContain('JalaliDateTimeInput');
    expect(campaign).toContain('شروع کمپین (شمسی)');
    expect(read('src/admin/services/uploadApi.ts')).toContain("banners: { maxSize: 1600, quality: 0.84 }");
  });

  test('booking services have explained full-size fields and optimized uploaded icons', () => {
    const settings = read('src/admin/pages/ServiceBookingSettings.tsx');
    expect(settings).toContain('folder="service-icons"');
    expect(settings).toContain('زمان تقریبی (دقیقه)');
    expect(settings).toContain('اجرت پایه (تومان)');
    expect(settings).toContain('<textarea rows={3}');
    const book = read('src/pages/BookPage.tsx');
    expect(book).toContain('function ServiceIcon');
  });

  test('order edits, refunds, technician assignment and wallet payments are server-side', () => {
    const sql = read('supabase/migrations/202608290001_admin_order_wallet_workflow.sql');
    for (const contract of ['carrtell_admin_replace_order_items','carrtell_assign_order_technician','carrtell_create_wallet_topup_order','carrtell_apply_wallet_to_order','trg_credit_paid_wallet_topup']) expect(sql).toContain(contract);
    expect(sql).toContain('revoke insert, update, delete on public.customer_wallets from authenticated');
    expect(sql).toContain("'order_refund'");
    const orders = read('src/admin/pages/Orders.tsx');
    expect(orders).toContain('آنلاین پرداخت‌شده');
    expect(orders).toContain('تخصیص سرویس‌کار سفارش');
    expect(orders).toContain('replaceOrderItems');
    expect(read('src/pages/WalletPage.tsx')).toContain('شارژ کیف پول');
    expect(read('src/pages/PaymentPage.tsx')).toContain('استفاده از کیف پول');
  });
});
