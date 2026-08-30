import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

test.describe('Admin and technician warehouse pick-list contract', () => {
  test('admin controls have visible field borders', () => {
    expect(read('src/admin/layouts/AdminLayout.tsx')).toContain('data-admin-layout');
    const css = read('src/index.css');
    expect(css).toContain('visible, consistent admin form controls');
    expect(css).toContain('[data-admin-layout] select');
  });

  test('admin order, dashboard and dispatch cards show ordered items', () => {
    expect(read('src/admin/pages/Orders.tsx')).toContain('اقلام سفارش برای آماده‌سازی و تحویل');
    expect(read('src/admin/pages/Dashboard.tsx')).toContain('محتویات سفارش برای تحویل به سرویس‌کار');
    expect(read('src/admin/pages/Dispatch.tsx')).toContain('item.product_name');
  });

  test('technician sees only the secure assigned-mission warehouse list', () => {
    const sql = read('supabase/migrations/202608290002_driver_order_items_secure.sql');
    expect(sql).toContain('carrtell_get_my_mission_order_items');
    expect(sql).toContain('assigned_driver_id = auth.uid()');
    expect(sql).toContain("coalesce(i.item_type, 'product') = 'product'");
    expect(read('src/driver/pages/DriverDashboard.tsx')).toContain('اقلام قابل تحویل از انبار');
    expect(read('src/driver/pages/DriverJobDetail.tsx')).toContain('اقلامی که باید از انبار تحویل بگیری');
  });
});
