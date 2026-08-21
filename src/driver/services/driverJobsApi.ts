import { supabase } from '../../lib/supabase';

export type DriverJobStatus = 'assigned' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export type DriverJob = {
  id: string;
  status?: DriverJobStatus | string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  car_name?: string | null;
  vehicle_title?: string | null;
  current_km?: number | null;
  final_km?: number | null;
  completed_current_km?: number | null;
  service_interval_km?: number | null;
  next_service_km?: number | null;
  address_text?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  driver_id?: string | null;
  assigned_driver_id?: string | null;
  service_vehicle_id?: string | null;
  fleet_vehicle_id?: string | null;
  scheduled_at?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  assigned_at?: string | null;
  accepted_at?: string | null;
  service_started_at?: string | null;
  started_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  used_products?: unknown;
  consumed_products?: string | null;
  driver_notes?: string | null;
  completion_note?: string | null;
  created_at?: string | null;
  queue_position?: number | null;
};

export type DriverJobReportInput = {
  finalKm: number;
  nextServiceKm?: number;
  usedProducts?: string;
  notes?: string;
  serviceType?: string;
  changedItems?: string[];
  warningNotes?: string;
};

const TEST_JOB_ID = 'test';
const TEST_JOB_STORAGE_KEY = 'carrtell_driver_test_job';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeStatus(value?: string | null): DriverJobStatus | string {
  const map: Record<string, DriverJobStatus> = {
    on_way: 'en_route', dispatched: 'en_route', working: 'in_progress', in_service: 'in_progress',
  };
  return map[String(value || '')] || value || 'assigned';
}

function normalizeJob(row: Record<string, any>): DriverJob {
  return {
    ...row,
    id: String(row.id),
    status: normalizeStatus(row.status),
    car_name: row.car_name || row.vehicle_title || 'خودروی مشتری',
    vehicle_title: row.vehicle_title || row.car_name || 'خودروی مشتری',
    final_km: row.final_km ?? row.completed_current_km ?? null,
    driver_id: row.driver_id || row.assigned_driver_id || null,
    assigned_driver_id: row.assigned_driver_id || row.driver_id || null,
    service_vehicle_id: row.service_vehicle_id || row.fleet_vehicle_id || null,
    fleet_vehicle_id: row.fleet_vehicle_id || row.service_vehicle_id || null,
    driver_notes: row.driver_notes || row.completion_note || null,
    scheduled_at: row.scheduled_at || [row.preferred_date, row.preferred_time].filter(Boolean).join('T') || null,
  };
}

function makeDefaultTestJob(): DriverJob {
  const now = new Date().toISOString();
  return { id: TEST_JOB_ID, status: 'assigned', customer_name: 'امین تست', customer_phone: '09120000000', car_name: 'پژو ۲۰۶ تیپ ۲', current_km: 85000, next_service_km: 92000, service_interval_km: 7000, address_text: 'پرند، فاز صفر، خیابان تست، پلاک ۱۲، واحد ۳', latitude: 35.4837, longitude: 50.9187, driver_id: 'test-driver', service_vehicle_id: 'test-vehicle', scheduled_at: now, assigned_at: now, created_at: now, used_products: [], driver_notes: '' };
}

function getStoredTestJob(): DriverJob {
  if (typeof window === 'undefined') return makeDefaultTestJob();
  try { return { ...makeDefaultTestJob(), ...JSON.parse(window.localStorage.getItem(TEST_JOB_STORAGE_KEY) || '{}'), id: TEST_JOB_ID }; } catch { return makeDefaultTestJob(); }
}
function saveStoredTestJob(job: DriverJob) { if (typeof window !== 'undefined') window.localStorage.setItem(TEST_JOB_STORAGE_KEY, JSON.stringify(job)); }
export function resetTestDriverJob() {
  const fresh = makeDefaultTestJob();
  saveStoredTestJob(fresh);
  return fresh;
}
function isTestJobId(id: string) { return id === TEST_JOB_ID; }
function assertValidJobId(id: string) { if (!isTestJobId(id) && !UUID_RE.test(id)) throw new Error('مأموریت پیدا نشد. شناسه مأموریت معتبر نیست.'); }

export async function getCurrentAuthUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function getDriverJobs(statuses?: string[]) {
  const userId = await getCurrentAuthUserId();
  let query = supabase.from('service_requests').select('*').order('queue_position', { ascending: true, nullsFirst: false }).order('scheduled_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  if (userId) query = query.or(`assigned_driver_id.eq.${userId},driver_id.eq.${userId}`);
  if (statuses?.length) {
    const expanded = statuses.flatMap((status) => status === 'en_route' ? ['en_route', 'on_way', 'dispatched'] : status === 'in_progress' ? ['in_progress', 'working', 'in_service'] : [status]);
    query = query.in('status', [...new Set(expanded)]);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => normalizeJob(row as Record<string, any>));
}

export async function getDriverJobById(id: string) {
  assertValidJobId(id);
  if (isTestJobId(id)) return getStoredTestJob();
  const { data, error } = await supabase.from('service_requests').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('مأموریت پیدا نشد.');
  return normalizeJob(data as Record<string, any>);
}

export async function updateDriverJobStatus(id: string, status: DriverJobStatus) {
  assertValidJobId(id);
  const now = new Date().toISOString();
  if (isTestJobId(id)) {
    const updated = { ...getStoredTestJob(), status } as DriverJob;
    if (status === 'accepted') updated.accepted_at = now;
    if (status === 'en_route') updated.started_at = now;
    if (status === 'arrived') updated.arrived_at = now;
    if (status === 'completed') updated.completed_at = now;
    saveStoredTestJob(updated);
    return updated;
  }
  const patch: Record<string, unknown> = { status, updated_at: now };
  if (status === 'accepted') patch.accepted_at = now;
  if (status === 'en_route') patch.started_at = now;
  if (status === 'arrived') patch.arrived_at = now;
  if (status === 'in_progress') patch.service_started_at = now;
  if (status === 'completed') patch.completed_at = now;
  const { data, error } = await supabase.from('service_requests').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return normalizeJob(data as Record<string, any>);
}

export async function completeDriverJob(id: string, report: DriverJobReportInput) {
  assertValidJobId(id);
  const now = new Date().toISOString();
  const usedProducts = parseUsedProducts(report.usedProducts);
  if (!report.nextServiceKm || report.nextServiceKm <= report.finalKm) throw new Error('کیلومتر سرویس بعدی را به‌صورت دستی و بیشتر از کیلومتر فعلی وارد کن.');
  if (isTestJobId(id)) {
    const current = getStoredTestJob();
    const updated: DriverJob = { ...current, status: 'completed', completed_at: now, final_km: report.finalKm, completed_current_km: report.finalKm, next_service_km: report.nextServiceKm, used_products: usedProducts, consumed_products: report.usedProducts || '', driver_notes: report.notes || '', completion_note: report.notes || '' };
    saveStoredTestJob(updated);
    return updated;
  }
  const { data: current, error: currentError } = await supabase.from('service_requests').select('*').eq('id', id).single();
  if (currentError) throw currentError;
  const { data, error } = await supabase.from('service_requests').update({ status: 'completed', completed_at: now, final_km: report.finalKm, completed_current_km: report.finalKm, next_service_km: report.nextServiceKm, used_products: usedProducts, consumed_products: report.usedProducts || '', driver_notes: report.notes || '', completion_note: report.notes || '', updated_at: now }).eq('id', id).select('*').single();
  if (error) throw error;
  const normalized = normalizeJob(data as Record<string, any>);
  await createServiceHistoryFromJob(normalized, report).catch(() => undefined);
  return normalized;
}

async function createServiceHistoryFromJob(job: DriverJob, report?: DriverJobReportInput) {
  if (!job.id || !job.final_km || !job.customer_phone) return;

  const changedItems = (report?.changedItems || []).map((title) => ({ title }));
  const productsUsed = Array.isArray(job.used_products)
    ? (job.used_products as Array<{ name?: string }>).map((item) => item?.name).filter((name): name is string => Boolean(name))
    : [];

  const payload = {
    customer_phone: job.customer_phone,
    vehicle_id: null,
    vehicle_title: job.vehicle_title || job.car_name || null,
    service_request_id: job.id,
    source: 'carrtell',
    performed_by_name: null,
    service_type: report?.serviceType || changedItems.map((item) => item.title).join('، ') || 'سرویس در محل Carrtell',
    service_date: new Date().toISOString().slice(0, 10),
    service_km: job.final_km,
    next_service_km: job.next_service_km ?? null,
    changed_items: changedItems,
    products_used: productsUsed,
    notes: report?.notes || job.driver_notes || null,
    warning_notes: report?.warningNotes || null,
  };

  const { error } = await supabase.from('customer_service_history').insert(payload);
  if (error) throw error;
}

function parseUsedProducts(value?: string) {
  if (!value?.trim()) return [];
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => { const [name, qty] = line.split('*').map((part) => part.trim()); return { name, quantity: Number(qty || 1) || 1 }; });
}

export const driverStatusLabels: Record<string, string> = {
  pending_review: 'در انتظار بررسی', pending: 'در انتظار بررسی', confirmed: 'تأیید شده', approved: 'تأیید شده', assigned: 'ماموریت جدید', accepted: 'قبول شده', en_route: 'در مسیر مشتری', on_way: 'در مسیر مشتری', dispatched: 'در مسیر مشتری', arrived: 'رسیده به محل', in_progress: 'در حال انجام سرویس', working: 'در حال انجام سرویس', in_service: 'در حال انجام سرویس', completed: 'تکمیل شده', cancelled: 'لغو شده',
};

export function getNextDriverAction(status?: string | null): DriverJobStatus | null {
  const normalized = normalizeStatus(status);
  if (!normalized || normalized === 'confirmed') return 'accepted';
  if (normalized === 'assigned') return 'accepted';
  if (normalized === 'accepted') return 'en_route';
  if (normalized === 'en_route') return 'arrived';
  if (normalized === 'arrived') return 'in_progress';
  return null;
}

export function getDriverActionLabel(status?: string | null) {
  const next = getNextDriverAction(status);
  if (next === 'accepted') return 'قبول ماموریت';
  if (next === 'en_route') return 'شروع حرکت';
  if (next === 'arrived') return 'رسیدم به محل';
  if (next === 'in_progress') return 'شروع سرویس';
  return 'مرحله بعد';
}
