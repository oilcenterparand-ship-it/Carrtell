import { supabase } from '../../lib/supabase';
import { calcNextServiceKm } from './garageApi';
import type { CarrtellAuthUser } from '../../auth/authApi';

export type ServiceRequestStatus =
  | 'pending_review'
  | 'confirmed'
  | 'assigned'
  | 'accepted'
  | 'dispatching'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type DriverUser = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
};

export type ServiceRequest = {
  id: string;
  request_number: string;
  customer_name: string;
  customer_phone: string;
  vehicle_id?: string | null;
  vehicle_title: string;
  current_km: number;
  last_service_km: number;
  service_interval_km: number;
  next_service_km?: number | null;
  address_id?: string | null;
  address_text: string;
  latitude?: number | null;
  longitude?: number | null;
  preferred_date: string;
  preferred_time: string;
  service_title: string;
  service_ids?: string[];
  service_items?: Array<{ id: string; title: string; labor_fee: number; estimated_minutes?: number }>;
  suggested_product_ids?: string[];
  booking_slot_id?: string | null;
  booking_slot_label?: string | null;
  pricing_breakdown?: Record<string, number>;
  estimated_total?: number;
  city?: string | null;
  note?: string | null;
  technician_name?: string | null;
  assigned_driver_id?: string | null;
  assigned_driver_name?: string | null;
  assigned_driver_phone?: string | null;
  driver_note?: string | null;
  completion_note?: string | null;
  consumed_products?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  completed_current_km?: number | null;
  assigned_at?: string | null;
  started_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  status: ServiceRequestStatus;
  customer_user_id?: string | null;
  guest_token?: string | null;
  payment_status?: 'pending' | 'paid' | 'failed';
  payment_reference?: string | null;
  paid_at?: string | null;
  created_at?: string;
};

export type CreateServiceRequestInput = {
  customer_name: string;
  customer_phone: string;
  vehicle_id?: string | null;
  vehicle_title: string;
  current_km: number;
  last_service_km: number;
  service_interval_km: number;
  address_id?: string | null;
  address_text: string;
  latitude?: number | null;
  longitude?: number | null;
  preferred_date: string;
  preferred_time: string;
  service_title?: string;
  service_ids?: string[];
  service_items?: Array<{ id: string; title: string; labor_fee: number; estimated_minutes?: number }>;
  suggested_product_ids?: string[];
  booking_slot_id?: string | null;
  booking_slot_label?: string | null;
  pricing_breakdown?: Record<string, number>;
  estimated_total?: number;
  city?: string | null;
  note?: string | null;
  customer_user_id?: string | null;
};

export type ServiceProgressInput = {
  status: ServiceRequestStatus;
  technician_name?: string | null;
  completed_current_km?: number | null;
  next_service_km?: number | null;
  driver_note?: string | null;
  completion_note?: string | null;
  consumed_products?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
};

export type AssignDriverInput = {
  driver_id: string;
  driver_name: string;
  driver_phone?: string | null;
};

const LOCAL_KEY = 'carrtell:service-requests';

function makeRequestNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SR-${y}${m}${d}-${rand}`;
}

function nowIso() {
  return new Date().toISOString();
}

function readLocal(): ServiceRequest[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as ServiceRequest[];
  } catch {
    return [];
  }
}

function writeLocal(items: ServiceRequest[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function normalizeStatus(status?: string | null): ServiceRequestStatus {
  if (
    status === 'confirmed' ||
    status === 'assigned' ||
    status === 'accepted' ||
    status === 'dispatching' ||
    status === 'en_route' ||
    status === 'arrived' ||
    status === 'in_progress' ||
    status === 'completed' ||
    status === 'cancelled'
  ) return status;
  return 'pending_review';
}

function normalizeDriver(row: Record<string, unknown>): DriverUser | null {
  const id = String(row.id || row.user_id || '').trim();
  if (!id) return null;
  const name = String(row.full_name || row.name || row.display_name || row.phone || row.email || 'سرویس‌کار').trim();
  return {
    id,
    full_name: name || 'سرویس‌کار',
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
  };
}

function normalizeRequest(row: Partial<ServiceRequest>): ServiceRequest {
  const lastServiceKm = Number(row.last_service_km || 0);
  const intervalKm = Number(row.service_interval_km || 5000);
  return {
    id: row.id || crypto.randomUUID(),
    request_number: row.request_number || makeRequestNumber(),
    customer_name: row.customer_name || '',
    customer_phone: row.customer_phone || '',
    vehicle_id: row.vehicle_id || null,
    vehicle_title: row.vehicle_title || 'خودروی مشتری',
    current_km: Number(row.current_km || 0),
    last_service_km: lastServiceKm,
    service_interval_km: intervalKm,
    next_service_km: Number(row.next_service_km || calcNextServiceKm(lastServiceKm, intervalKm)),
    address_id: row.address_id || null,
    address_text: row.address_text || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    preferred_date: row.preferred_date || '',
    preferred_time: row.preferred_time || '',
    service_title: row.service_title || 'سرویس دوره‌ای روغن و فیلتر',
    service_ids: Array.isArray(row.service_ids) ? row.service_ids : [],
    service_items: Array.isArray(row.service_items) ? row.service_items : [],
    suggested_product_ids: Array.isArray(row.suggested_product_ids) ? row.suggested_product_ids : [],
    booking_slot_id: row.booking_slot_id || null,
    booking_slot_label: row.booking_slot_label || null,
    pricing_breakdown: row.pricing_breakdown && typeof row.pricing_breakdown === 'object' ? row.pricing_breakdown : {},
    estimated_total: Number(row.estimated_total || 0),
    city: row.city || null,
    note: row.note || null,
    technician_name: row.technician_name || row.assigned_driver_name || null,
    assigned_driver_id: row.assigned_driver_id || null,
    assigned_driver_name: row.assigned_driver_name || row.technician_name || null,
    assigned_driver_phone: row.assigned_driver_phone || null,
    driver_note: row.driver_note || null,
    completion_note: row.completion_note || null,
    consumed_products: row.consumed_products || null,
    before_image_url: row.before_image_url || null,
    after_image_url: row.after_image_url || null,
    completed_current_km: row.completed_current_km ?? null,
    assigned_at: row.assigned_at || null,
    started_at: row.started_at || null,
    arrived_at: row.arrived_at || null,
    completed_at: row.completed_at || null,
    status: normalizeStatus(row.status),
    customer_user_id: row.customer_user_id || null,
    guest_token: row.guest_token || null,
    payment_status: row.payment_status === 'paid' || row.payment_status === 'failed' ? row.payment_status : 'pending',
    payment_reference: row.payment_reference || null,
    paid_at: row.paid_at || null,
    created_at: row.created_at || nowIso(),
  };
}

function publicRequestPayload(payload: ServiceRequest) {
  const { created_at: _createdAt, ...insertPayload } = payload;
  return insertPayload;
}

function updateLocalRequest(id: string, patch: Partial<ServiceRequest>) {
  const currentItems = readLocal().map(normalizeRequest);
  const next = currentItems.map((item) => (item.id === id ? normalizeRequest({ ...item, ...patch }) : item));
  writeLocal(next);
  const updated = next.find((item) => item.id === id);
  if (!updated) throw new Error('درخواست سرویس پیدا نشد.');
  return updated;
}

function statusTimestampPatch(status: ServiceRequestStatus): Partial<ServiceRequest> {
  if (status === 'assigned') return { assigned_at: nowIso() };
  if (status === 'en_route' || status === 'dispatching') return { started_at: nowIso() };
  if (status === 'arrived') return { arrived_at: nowIso() };
  if (status === 'completed') return { completed_at: nowIso() };
  return {};
}

export function getServiceRequestStatusLabel(status: ServiceRequestStatus) {
  const labels: Record<ServiceRequestStatus, string> = {
    pending_review: 'در انتظار بررسی',
    confirmed: 'تأیید شده',
    assigned: 'تخصیص داده شده',
    accepted: 'قبول شده توسط سرویس‌کار',
    dispatching: 'اعزام سرویس‌کار',
    en_route: 'در مسیر مشتری',
    arrived: 'رسیده به محل',
    in_progress: 'در حال انجام سرویس',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
  };
  return labels[status];
}

export async function createServiceRequest(input: CreateServiceRequestInput): Promise<ServiceRequest> {
  const cleanPhone = input.customer_phone.trim();
  if (!cleanPhone) throw new Error('شماره موبایل الزامی است.');
  if (!input.vehicle_title.trim()) throw new Error('انتخاب خودرو الزامی است.');
  if (!input.address_text.trim()) throw new Error('انتخاب آدرس الزامی است.');

  const { data: authData } = await supabase.auth.getUser();
  const currentUser = authData.user;
  const hasExplicitCustomerUser = Object.prototype.hasOwnProperty.call(input, 'customer_user_id');
  const resolvedCustomerUserId = hasExplicitCustomerUser
    ? (input.customer_user_id || null)
    : (currentUser?.id || null);
  const guestToken = resolvedCustomerUserId ? null : crypto.randomUUID();

  const payload = normalizeRequest({
    ...input,
    id: crypto.randomUUID(),
    customer_user_id: resolvedCustomerUserId,
    guest_token: guestToken,
    customer_phone: cleanPhone,
    request_number: makeRequestNumber(),
    next_service_km: calcNextServiceKm(input.last_service_km, input.service_interval_km),
    status: 'pending_review',
    payment_status: 'pending',
  });

  const { error } = await supabase
    .from('service_requests')
    .insert(publicRequestPayload(payload));

  if (!error) {
    if (guestToken) sessionStorage.setItem(`carrtell:service-guest-token:${payload.id}`, guestToken);

    if (input.booking_slot_id) {
      const { data: reservation, error: reservationError } = await supabase.rpc('reserve_booking_slot', {
        p_slot_id: input.booking_slot_id,
        p_booking_date: input.preferred_date,
        p_service_request_id: payload.id,
      });
      const result = Array.isArray(reservation) ? reservation[0] : reservation;
      if (reservationError || !result?.success) {
        throw new Error(result?.message || 'ظرفیت این بازه زمانی تکمیل شده است؛ بازه دیگری را انتخاب کنید.');
      }
    }
    return payload;
  }

  const localRequest = normalizeRequest(payload);
  writeLocal([localRequest, ...readLocal()]);
  if (guestToken) sessionStorage.setItem(`carrtell:service-guest-token:${localRequest.id}`, guestToken);
  return localRequest;
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (!error) return ((data || []) as ServiceRequest[]).map(normalizeRequest);
  return readLocal().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).map(normalizeRequest);
}

export async function getDriverUsers(): Promise<DriverUser[]> {
  const { data, error } = await supabase
    .from('service_technicians')
    .select('id, full_name, phone, username')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((item) => normalizeDriver(item as unknown as Record<string, unknown>)).filter(Boolean) as DriverUser[];
}

export async function getDriverServiceRequests(currentUser?: CarrtellAuthUser | null): Promise<ServiceRequest[]> {
  const allowed: ServiceRequestStatus[] = ['assigned', 'accepted', 'dispatching', 'en_route', 'arrived', 'in_progress'];
  let query = supabase
    .from('service_requests')
    .select('*')
    .in('status', allowed)
    .order('preferred_date', { ascending: true })
    .order('preferred_time', { ascending: true });

  if (currentUser?.id) {
    query = query.eq('assigned_driver_id', currentUser.id);
  }

  const { data, error } = await query;

  if (!error) return ((data || []) as ServiceRequest[]).map(normalizeRequest);

  const localItems = readLocal().map(normalizeRequest).filter((item) => allowed.includes(item.status));
  if (currentUser?.id) return localItems.filter((item) => item.assigned_driver_id === currentUser.id);
  return localItems;
}

export async function getServiceRequestsByPhone(phone: string): Promise<ServiceRequest[]> {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return [];

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('customer_phone', cleanPhone)
    .order('created_at', { ascending: false });

  if (!error) return ((data || []) as ServiceRequest[]).map(normalizeRequest);
  return readLocal().filter((item) => item.customer_phone === cleanPhone).map(normalizeRequest);
}

export async function assignServiceRequestDriver(id: string, input: AssignDriverInput) {
  const updatePayload: Partial<ServiceRequest> = {
    assigned_driver_id: input.driver_id,
    assigned_driver_name: input.driver_name,
    assigned_driver_phone: input.driver_phone || null,
    technician_name: input.driver_name,
    status: 'assigned',
    assigned_at: nowIso(),
  };

  const { data, error } = await supabase
    .from('service_requests')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (!error && data) return normalizeRequest(data as ServiceRequest);
  return updateLocalRequest(id, updatePayload);
}

export async function updateServiceRequestStatus(id: string, status: ServiceRequestStatus, technicianName?: string | null) {
  return updateServiceRequestProgress(id, { status, technician_name: technicianName || null });
}

export async function updateServiceRequestProgress(id: string, input: ServiceProgressInput) {
  const currentItems = readLocal().map(normalizeRequest);
  const current = currentItems.find((item) => item.id === id);
  const nextCurrentKm = Number(input.completed_current_km || current?.current_km || 0);

  const updatePayload: Partial<ServiceRequest> = {
    status: input.status,
    technician_name: input.technician_name ?? current?.technician_name ?? current?.assigned_driver_name ?? null,
    driver_note: input.driver_note ?? current?.driver_note ?? null,
    completion_note: input.completion_note ?? current?.completion_note ?? null,
    consumed_products: input.consumed_products ?? current?.consumed_products ?? null,
    before_image_url: input.before_image_url ?? current?.before_image_url ?? null,
    after_image_url: input.after_image_url ?? current?.after_image_url ?? null,
    ...statusTimestampPatch(input.status),
  };

  if (input.status === 'completed' && nextCurrentKm > 0) {
    updatePayload.current_km = nextCurrentKm;
    updatePayload.completed_current_km = nextCurrentKm;
    updatePayload.last_service_km = nextCurrentKm;
    updatePayload.next_service_km = Number(input.next_service_km || 0) || null;
  }

  const { data, error } = await supabase
    .from('service_requests')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (!error && data) return normalizeRequest(data as ServiceRequest);
  return updateLocalRequest(id, updatePayload);
}


export async function getServiceRequestById(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase.from('service_requests').select('*').eq('id', id).maybeSingle();
  if (!error && data) return normalizeRequest(data as ServiceRequest);

  const guestToken = sessionStorage.getItem(`carrtell:service-guest-token:${id}`);
  if (guestToken) {
    const { data: guestData, error: guestError } = await supabase.rpc('get_service_request_guest', {
      p_request_id: id,
      p_guest_token: guestToken,
    });
    const row = Array.isArray(guestData) ? guestData[0] : guestData;
    if (!guestError && row) return normalizeRequest(row as ServiceRequest);
  }

  const local = readLocal().find((item) => item.id === id);
  if (local) return normalizeRequest(local);
  throw error || new Error('درخواست سرویس پیدا نشد.');
}

export async function payServiceRequestTest(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase.rpc('pay_service_request_test', { p_request_id: id });
  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row) return normalizeRequest(row as ServiceRequest);

  const guestToken = sessionStorage.getItem(`carrtell:service-guest-token:${id}`);
  if (guestToken) {
    const { data: guestData, error: guestError } = await supabase.rpc('pay_service_request_guest_test', {
      p_request_id: id,
      p_guest_token: guestToken,
    });
    const guestRow = Array.isArray(guestData) ? guestData[0] : guestData;
    if (!guestError && guestRow) return normalizeRequest(guestRow as ServiceRequest);
  }

  const reference = `TEST-${Date.now()}`;
  return updateLocalRequest(id, { payment_status: 'paid', payment_reference: reference, paid_at: nowIso() });
}


export async function claimGuestServiceRequest(id: string): Promise<ServiceRequest> {
  const guestToken = sessionStorage.getItem(`carrtell:service-guest-token:${id}`);
  if (!guestToken) throw new Error('اطلاعات رزرو مهمان در این مرورگر پیدا نشد.');

  // OTP verification already creates an authenticated Supabase session. Before
  // asking the customer for another OTP, try to restore/refresh that session.
  let { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const refreshed = await supabase.auth.refreshSession().catch(() => null);
    sessionData = refreshed?.data ?? sessionData;
  }
  if (!sessionData.session?.user) {
    throw new Error('تأیید قبلی شماره در این مرورگر منقضی شده است. رزرو و پرداخت ثبت شده؛ برای فعال‌سازی حساب فقط یک‌بار از ورود پیامکی استفاده کنید.');
  }

  const { data, error } = await supabase.rpc('claim_service_request_guest', {
    p_request_id: id,
    p_guest_token: guestToken,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error) throw error;
  if (!row) throw new Error('اتصال رزرو به حساب کاربری انجام نشد.');

  sessionStorage.removeItem(`carrtell:service-guest-token:${id}`);
  return normalizeRequest(row as ServiceRequest);
}
