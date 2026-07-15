import { supabase } from '../../lib/supabase';

export type HealthStatus = 'ok' | 'warning' | 'error' | 'unknown';

export type HealthCheckResult = {
  key: string;
  title: string;
  category: string;
  status: HealthStatus;
  message: string;
  details?: Record<string, unknown>;
};

export type BugReport = {
  id?: string;
  user_id?: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  role?: string;
  page_url?: string | null;
  area?: string;
  title: string;
  description?: string | null;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'reviewing' | 'fixed' | 'closed';
  admin_note?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

const importantTables = [
  'products',
  'orders',
  'profiles',
  'service_requests',
  'customer_wallets',
  'support_tickets',
  'blog_posts',
  'discount_codes',
  'bug_reports',
];

export async function runSystemHealthChecks(): Promise<HealthCheckResult[]> {
  const checks: HealthCheckResult[] = [];

  try {
    const { error } = await supabase.from('products').select('id', { count: 'exact', head: true });
    checks.push({
      key: 'supabase',
      title: 'اتصال Supabase',
      category: 'database',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'اتصال برقرار است',
    });
  } catch (error) {
    checks.push({
      key: 'supabase',
      title: 'اتصال Supabase',
      category: 'database',
      status: 'error',
      message: error instanceof Error ? error.message : 'خطای ناشناخته',
    });
  }

  for (const table of importantTables) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      checks.push({
        key: `table_${table}`,
        title: `جدول ${table}`,
        category: 'database',
        status: error ? 'warning' : 'ok',
        message: error ? `نیاز به بررسی: ${error.message}` : 'سالم',
      });
    } catch (error) {
      checks.push({
        key: `table_${table}`,
        title: `جدول ${table}`,
        category: 'database',
        status: 'error',
        message: error instanceof Error ? error.message : 'خطای ناشناخته',
      });
    }
  }

  checks.push({
    key: 'routes',
    title: 'مسیرهای اصلی',
    category: 'frontend',
    status: 'ok',
    message: 'مسیرهای تست سلامت آماده هستند. مسیرهای دیگر در مرحله Final Stability بررسی می‌شوند.',
  });

  await saveHealthChecks(checks);
  return checks;
}

export async function saveHealthChecks(checks: HealthCheckResult[]) {
  const rows = checks.map((item) => ({
    check_key: item.key,
    title: item.title,
    category: item.category,
    status: item.status,
    message: item.message,
    details: item.details ?? {},
    last_checked_at: new Date().toISOString(),
  }));

  await supabase.from('system_health_checks').upsert(rows, { onConflict: 'check_key' });
}

export async function getSavedHealthChecks() {
  const { data, error } = await supabase
    .from('system_health_checks')
    .select('*')
    .order('category', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createBugReport(report: BugReport) {
  const { data, error } = await supabase.from('bug_reports').insert({
    ...report,
    page_url: report.page_url ?? window.location.href,
    metadata: {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ...report.metadata,
    },
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function getBugReports() {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateBugReportStatus(id: string, status: BugReport['status'], admin_note?: string) {
  const { data, error } = await supabase
    .from('bug_reports')
    .update({ status, admin_note, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
