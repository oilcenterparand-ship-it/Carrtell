import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(file), 'utf8');

test.describe('Service travel pricing contracts', () => {
  test('route pricing remains server-side and matches business rules', async () => {
    const edge = read('supabase/functions/service-travel-estimate/index.ts');
    const migration = read('supabase/migrations/202608240004_service_travel_distance_pricing.sql');
    const book = read('src/pages/BookPage.tsx');

    expect(edge).toContain("Deno.env.get('NESHAN_SERVICE_API_KEY')");
    expect(edge).toContain("new URL('https://api.neshan.org/v4/direction')");
    expect(edge).toContain("error: 'outside_service_area'");
    expect(edge).toContain('Math.ceil(distanceMeters / 1000)');
    expect(edge).toContain('insidePolygon(latitude, longitude, polygon)');
    expect(edge).toContain("from('service_travel_quotes').insert");
    expect(migration).toContain('travel_fee = 200000');
    expect(migration).toContain('travel_per_km_fee = 10000');
    expect(migration).toContain('service_radius_km = 40');
    expect(migration).toContain('traffic_zone_surcharge_percent = 30');
    expect(migration).toContain('apply_service_travel_quote');
    expect(migration).toContain('Travel quote destination mismatch');
    expect(book).not.toContain("data-testid=\"booking-travel-estimate\"");
    expect(book).toContain("data-testid=\"booking-location-priced\"");
    expect(book).not.toContain('فاصله مسیر:');
    expect(book).not.toContain('هزینه رفت‌وآمد:');
    expect(book).toContain('data-testid="booking-cost-breakdown"');
    expect(book).toContain('ایاب‌وذهاب');
    expect(book).toContain('ct-book-service-chips');
    expect(book).not.toContain('<span>هزینه شب</span>');
    expect(read('src/customer/services/serviceBookingApi.ts')).toContain('const night = 0;');
    expect(book).toContain('compactDesktop');
    expect(read('src/admin/pages/ServiceBookingSettings.tsx')).toContain('traffic_zone_polygon');
    expect(read('src/customer/services/serviceBookingApi.ts')).toContain("throw new Error(error?.message || 'ذخیره قیمت‌گذاری در سرور انجام نشد.')");
    expect(book).not.toContain('NESHAN_SERVICE_API_KEY');
  });

  test('service payment and invoice show the travel breakdown', async () => {
    expect(read('src/pages/ServicePaymentPage.tsx')).toContain('افزایش طرح ترافیک');
    expect(read('src/utils/serviceInvoiceImage.ts')).toContain('هزینه رفت‌وآمد');
    expect(read('src/utils/serviceInvoiceImage.ts')).toContain('افزایش محدوده طرح ترافیک');
  });
});
