import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test.describe('Technician availability and automatic CRM assignment', () => {
  const sql = read('supabase/migrations/202608270005_technician_availability_auto_assignment.sql');

  test('technician can declare tomorrow working hours with a five-job cap', () => {
    expect(sql).toContain('service_technician_availability');
    expect(sql).toContain('set_my_tomorrow_availability');
    expect(sql).toContain('max_jobs integer not null default 5');
    expect(sql).toContain('technician_id = auth.uid()');
    const dashboard = read('src/driver/pages/DriverDashboard.tsx');
    expect(dashboard).toContain('برای فردا آمادگی دارم');
    expect(dashboard).toContain('setMyTomorrowAvailability');
    expect(sql).toContain('Retry already-paid requests');
    expect(sql).toContain("and payment_status = 'paid'");
  });

  test('only paid requests inside free hours are assigned without time collision', () => {
    expect(sql).toContain("coalesce(new.payment_status, '') <> 'paid'");
    expect(sql).toContain('requested_time >= a.start_time');
    expect(sql).toContain('requested_time < a.end_time');
    expect(sql).toContain('conflict.preferred_time::time = requested_time');
    expect(sql).toContain("conflict.status not in ('cancelled')");
  });

  test('one technician is filled to five before moving to the next', () => {
    expect(sql).toContain('having count(sr.id) < least(a.max_jobs, 5)');
    expect(sql).toContain('order by count(sr.id) desc');
    expect(sql).toContain("pg_advisory_xact_lock(hashtext('carrtell-auto-assign-' || requested_date::text))");
    expect(sql).toContain("new.status := 'assigned'");
    expect(sql).toContain('new.queue_position := chosen.assigned_count + 1');
  });
});
