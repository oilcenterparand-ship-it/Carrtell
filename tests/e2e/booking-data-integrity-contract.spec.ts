import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test.describe('Booking value integrity across customer, admin and technician', () => {
  test('service titles and labor fees are saved and displayed', () => {
    const book = read('src/pages/BookPage.tsx');
    const admin = read('src/admin/pages/ServiceRequests.tsx');
    const driverDetail = read('src/pages/DriverJobDetail.tsx');
    const driverLegacy = read('src/pages/DriverPage.tsx');

    expect(book).toContain('money(service.base_labor_fee)');
    expect(book).toContain('service_items: selectedServices.map');
    expect(book).toContain('labor_fee: item.base_labor_fee');
    expect(admin).toContain('request.service_items.map');
    expect(admin).toContain('service.labor_fee');
    expect(driverDetail).toContain('job.service_items.map');
    expect(driverDetail).toContain('service.labor_fee');
    expect(driverLegacy).toContain('task.service_items.map');
  });

  test('optional address details are persisted and visible after assignment', () => {
    const book = read('src/pages/BookPage.tsx');
    const requestApi = read('src/customer/services/serviceRequestsApi.ts');
    const admin = read('src/admin/pages/ServiceRequests.tsx');
    const dispatch = read('src/admin/pages/Dispatch.tsx');
    const driverApi = read('src/driver/services/driverJobsApi.ts');
    const driverDetail = read('src/pages/DriverJobDetail.tsx');
    const driverDashboard = read('src/pages/DriverDashboard.tsx');

    expect(book).toContain('توضیحات تکمیلی: ${addressDetails.trim()}');
    expect(book).toContain('address_text: addressText');
    expect(requestApi).toContain('address_text: input.address_text.trim()');
    expect(admin).toContain('request.address_text');
    expect(dispatch).toContain('row.address_text');
    expect(driverApi).toContain("supabase.from('service_requests').select('*')");
    expect(driverDetail).toContain('job.address_text');
    expect(driverDashboard).toContain('job.address_text');
  });

  test('displayed total is built from the same persisted pricing values', () => {
    const book = read('src/pages/BookPage.tsx');
    expect(book).toContain('const estimatedTotal = servicePrice.total + productTotal');
    expect(book).toContain('products: productTotal');
    expect(book).toContain('total: estimatedTotal');
    expect(book).toContain('estimated_total: estimatedTotal');
  });
});
