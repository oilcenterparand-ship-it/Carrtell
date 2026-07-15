import { supabase } from '../../lib/supabase';

export type LegacyDispatchStatus = 'pending' | 'approved' | 'dispatched' | 'on_way' | 'in_service' | 'working';

export type DispatchStatus =
  | 'pending_review'
  | 'confirmed'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const dispatchStatusLabels: Record<DispatchStatus, string> = {
  pending_review: 'در انتظار بررسی',
  confirmed: 'تأیید شده',
  assigned: 'اختصاص داده‌شده',
  en_route: 'در مسیر مشتری',
  arrived: 'رسیده به محل',
  in_progress: 'در حال انجام سرویس',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
};

const legacyToCanonical: Record<string, DispatchStatus> = {
  pending: 'pending_review',
  approved: 'confirmed',
  dispatched: 'en_route',
  on_way: 'en_route',
  in_service: 'in_progress',
  working: 'in_progress',
};

export function normalizeDispatchStatus(value?: string | null): DispatchStatus {
  const raw = String(value || 'pending_review');
  if (raw in legacyToCanonical) return legacyToCanonical[raw];
  if (raw in dispatchStatusLabels) return raw as DispatchStatus;
  return 'pending_review';
}

function normalizeRow(row: Record<string, any>) {
  return {
    ...row,
    status: normalizeDispatchStatus(row.status),
    vehicle_title: row.vehicle_title || row.car_name || 'خودروی مشتری',
    car_name: row.car_name || row.vehicle_title || 'خودروی مشتری',
    assigned_driver_id: row.assigned_driver_id || row.driver_id || null,
    driver_id: row.driver_id || row.assigned_driver_id || null,
    assigned_driver_name: row.assigned_driver_name || row.technician_name || null,
    assigned_driver_phone: row.assigned_driver_phone || null,
    fleet_vehicle_id: row.fleet_vehicle_id || row.service_vehicle_id || null,
    scheduled_at: row.scheduled_at || [row.preferred_date, row.preferred_time].filter(Boolean).join('T') || null,
  };
}

export async function getDispatchRequests(status?: string) {
  let query = supabase.from('service_requests').select('*').order('created_at', { ascending: false });
  const normalized = status && status !== 'all' ? normalizeDispatchStatus(status) : null;
  if (normalized) {
    const aliases: Record<DispatchStatus, string[]> = {
      pending_review: ['pending_review', 'pending'],
      confirmed: ['confirmed', 'approved'],
      assigned: ['assigned'],
      en_route: ['en_route', 'dispatched', 'on_way'],
      arrived: ['arrived'],
      in_progress: ['in_progress', 'in_service', 'working'],
      completed: ['completed'],
      cancelled: ['cancelled'],
    };
    query = query.in('status', aliases[normalized]);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => normalizeRow(row as Record<string, any>));
}

export async function getAvailableDrivers() {
  const attempts = ['profiles', 'user_profiles', 'users'];
  for (const table of attempts) {
    const { data, error } = await supabase
      .from(table)
      .select('id, full_name, phone, role')
      .eq('role', 'driver')
      .order('full_name', { ascending: true });
    if (!error) return data ?? [];
  }
  return [];
}

export async function getFleetVehicles() {
  const { data, error } = await supabase.from('service_fleet').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function assignServiceRequest(
  requestId: string,
  driverId: string,
  fleetVehicleId?: string,
  scheduledAt?: string,
) {
  const driver = await findDriver(driverId);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    assigned_driver_id: driverId,
    driver_id: driverId,
    assigned_driver_name: driver?.full_name ?? null,
    assigned_driver_phone: driver?.phone ?? null,
    technician_name: driver?.full_name ?? null,
    status: 'assigned',
    assigned_at: now,
    updated_at: now,
  };
  if (fleetVehicleId) {
    patch.fleet_vehicle_id = fleetVehicleId;
    patch.service_vehicle_id = fleetVehicleId;
  }
  if (scheduledAt) patch.scheduled_at = scheduledAt;

  const { data, error } = await supabase.from('service_requests').update(patch).eq('id', requestId).select().single();
  if (error) throw error;
  await logDispatchEvent(requestId, 'assign', undefined, 'assigned', { driverId, fleetVehicleId, scheduledAt });
  return normalizeRow(data as Record<string, any>);
}

export async function updateServiceStatus(requestId: string, status: DispatchStatus | LegacyDispatchStatus, note?: string) {
  const canonicalStatus = normalizeDispatchStatus(status);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: canonicalStatus, updated_at: now };
  if (canonicalStatus === 'en_route') patch.started_at = now;
  if (canonicalStatus === 'arrived') patch.arrived_at = now;
  if (canonicalStatus === 'in_progress') patch.service_started_at = now;
  if (canonicalStatus === 'completed') patch.completed_at = now;

  const { data, error } = await supabase.from('service_requests').update(patch).eq('id', requestId).select().single();
  if (error) throw error;
  await logDispatchEvent(requestId, 'status_change', undefined, canonicalStatus, { note });
  return normalizeRow(data as Record<string, any>);
}

async function findDriver(driverId: string) {
  for (const table of ['profiles', 'user_profiles', 'users']) {
    const { data, error } = await supabase.from(table).select('id, full_name, phone').eq('id', driverId).maybeSingle();
    if (!error && data) return data as { id: string; full_name?: string | null; phone?: string | null };
  }
  return null;
}

export async function logDispatchEvent(
  serviceRequestId: string,
  eventType: string,
  fromStatus?: string,
  toStatus?: string,
  payload: Record<string, unknown> = {},
) {
  const { data: userRes } = await supabase.auth.getUser();
  const { error } = await supabase.from('dispatch_events').insert({
    service_request_id: serviceRequestId,
    actor_id: userRes?.user?.id ?? null,
    event_type: eventType,
    from_status: fromStatus ?? null,
    to_status: toStatus ?? null,
    payload,
    note: typeof payload.note === 'string' ? payload.note : null,
  });
  if (error) console.warn('dispatch event log failed', error);
}


// Compatibility exports used by the older DriverPage.
export async function completeServiceRequest(
  requestId: string,
  payload: { final_km?: number; used_products?: unknown[]; driver_notes?: string },
) {
  const current = await supabase.from('service_requests').select('service_interval_km').eq('id', requestId).maybeSingle();
  const finalKm = Number(payload.final_km || 0);
  const interval = Number(current.data?.service_interval_km || 5000);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('service_requests')
    .update({
      status: 'completed',
      completed_at: now,
      updated_at: now,
      final_km: finalKm || null,
      completed_current_km: finalKm || null,
      next_service_km: finalKm ? finalKm + interval : null,
      used_products: payload.used_products ?? [],
      driver_notes: payload.driver_notes ?? null,
      completion_note: payload.driver_notes ?? null,
    })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  await logDispatchEvent(requestId, 'completed', undefined, 'completed', payload as Record<string, unknown>);
  return normalizeRow(data as Record<string, any>);
}

export async function getDriverTasks(driverId?: string) {
  let query = supabase
    .from('service_requests')
    .select('*')
    .in('status', ['assigned', 'en_route', 'dispatched', 'on_way', 'arrived', 'in_progress', 'in_service', 'working'])
    .order('created_at', { ascending: false });
  if (driverId) query = query.or(`assigned_driver_id.eq.${driverId},driver_id.eq.${driverId}`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => normalizeRow(row as Record<string, any>));
}
