import { supabase } from '../../lib/supabase';

export type CustomerVehicle = {
  id: string;
  customer_phone: string;
  admin_car_id?: string | null;
  title: string;
  brand?: string | null;
  model?: string | null;
  model_year?: number | null;
  engine?: string | null;
  transmission_type?: string | null;
  plate_number?: string | null;
  current_km: number;
  last_service_km: number;
  service_interval_km: number;
  next_service_km: number;
  is_default?: boolean | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CustomerProfile = {
  id?: string;
  phone: string;
  full_name?: string | null;
  national_code?: string | null;
  email?: string | null;
  birth_date?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  preferred_contact?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type ServiceReminder = {
  id: string;
  customer_phone: string;
  vehicle_id?: string | null;
  vehicle_title: string;
  service_title: string;
  last_service_km: number;
  next_service_km: number;
  current_km: number;
  status: 'ok' | 'soon' | 'due' | 'overdue';
  created_at?: string;
};

export function calcNextServiceKm(lastServiceKm: number, intervalKm: number) {
  const last = Number(lastServiceKm || 0);
  const interval = Number(intervalKm || 0) || 5000;
  return last + interval;
}

export function getServiceStatus(currentKm: number, nextServiceKm: number): ServiceReminder['status'] {
  const current = Number(currentKm || 0);
  const next = Number(nextServiceKm || 0);
  if (!next) return 'ok';
  if (current > next) return 'overdue';
  if (current === next) return 'due';
  if (next - current <= 500) return 'due';
  if (next - current <= 1000) return 'soon';
  return 'ok';
}

export function getServiceStatusLabel(status: ServiceReminder['status']) {
  switch (status) {
    case 'overdue': return 'زمان سرویس گذشته';
    case 'due': return 'وقت سرویس رسیده';
    case 'soon': return 'نزدیک به سرویس';
    default: return 'وضعیت خوب';
  }
}

export function getServiceStatusClass(status: ServiceReminder['status']) {
  switch (status) {
    case 'overdue': return 'border-red-400/20 bg-red-500/10 text-red-200';
    case 'due': return 'border-orange-400/20 bg-orange-500/10 text-orange-100';
    case 'soon': return 'border-amber-400/20 bg-amber-500/10 text-amber-100';
    default: return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100';
  }
}

const LOCAL_VEHICLES_KEY = 'carrtell:customer-vehicles';
const LOCAL_PROFILE_KEY = 'carrtell:customer-profile';

function readLocalVehicles(): CustomerVehicle[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_VEHICLES_KEY) || '[]'); } catch { return []; }
}

function writeLocalVehicles(items: CustomerVehicle[]) {
  localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(items));
}

function readLocalProfiles(): CustomerProfile[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY) || '[]'); } catch { return []; }
}

function writeLocalProfiles(items: CustomerProfile[]) {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(items));
}

export async function getCustomerProfile(phone: string): Promise<CustomerProfile | null> {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return null;

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (!error) return data as CustomerProfile | null;

  return readLocalProfiles().find((item) => item.phone === cleanPhone) || null;
}

export async function saveCustomerProfile(profile: CustomerProfile): Promise<CustomerProfile> {
  const payload = { ...profile, phone: profile.phone.trim() };
  if (!payload.phone) throw new Error('شماره موبایل الزامی است');

  const { data, error } = await supabase
    .from('customer_profiles')
    .upsert(payload, { onConflict: 'phone' })
    .select('*')
    .single();

  if (!error && data) return data as CustomerProfile;

  const local = readLocalProfiles();
  const saved = { ...payload, id: payload.id || crypto.randomUUID() } as CustomerProfile;
  const exists = local.some((item) => item.phone === payload.phone);
  writeLocalProfiles(exists ? local.map((item) => item.phone === payload.phone ? saved : item) : [saved, ...local]);
  return saved;
}

export async function getCustomerVehicles(phone: string): Promise<CustomerVehicle[]> {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return readLocalVehicles();

  const { data, error } = await supabase
    .from('customer_vehicles')
    .select('*')
    .eq('customer_phone', cleanPhone)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('customer_vehicles table unavailable, using localStorage fallback:', error.message);
    return readLocalVehicles().filter((item) => !item.customer_phone || item.customer_phone === cleanPhone);
  }

  return data || [];
}

export async function saveCustomerVehicle(vehicle: Omit<CustomerVehicle, 'id' | 'next_service_km'> & { id?: string }): Promise<CustomerVehicle> {
  const payload = {
    ...vehicle,
    customer_phone: vehicle.customer_phone.trim(),
    admin_car_id: vehicle.admin_car_id || null,
    model_year: vehicle.model_year ? Number(vehicle.model_year) : null,
    current_km: Number(vehicle.current_km || 0),
    last_service_km: Number(vehicle.last_service_km || 0),
    service_interval_km: Number(vehicle.service_interval_km || 5000),
    transmission_type: vehicle.transmission_type || null,
    next_service_km: calcNextServiceKm(Number(vehicle.last_service_km || 0), Number(vehicle.service_interval_km || 5000)),
    is_default: Boolean(vehicle.is_default),
  };

  if (vehicle.id) {
    const { data, error } = await supabase
      .from('customer_vehicles')
      .update(payload)
      .eq('id', vehicle.id)
      .select('*')
      .single();
    if (!error && data) return data;
  } else {
    const { data, error } = await supabase
      .from('customer_vehicles')
      .insert(payload)
      .select('*')
      .single();
    if (!error && data) return data;
  }

  const local = readLocalVehicles();
  const localVehicle: CustomerVehicle = { id: vehicle.id || crypto.randomUUID(), ...payload } as CustomerVehicle;
  const next = vehicle.id ? local.map((item) => (item.id === vehicle.id ? localVehicle : item)) : [localVehicle, ...local];
  writeLocalVehicles(next);
  return localVehicle;
}

export async function setDefaultCustomerVehicle(phone: string, vehicleId: string) {
  const cleanPhone = phone.trim();
  if (!cleanPhone || !vehicleId) return;

  await supabase.from('customer_vehicles').update({ is_default: false }).eq('customer_phone', cleanPhone);
  const { error } = await supabase.from('customer_vehicles').update({ is_default: true }).eq('id', vehicleId);

  const local = readLocalVehicles();
  writeLocalVehicles(local.map((item) => ({ ...item, is_default: item.id === vehicleId })));

  if (error) console.warn('set default vehicle fallback/local only:', error.message);
}

export async function updateVehicleKilometers(vehicle: CustomerVehicle, currentKm: number, lastServiceKm?: number) {
  return saveCustomerVehicle({
    ...vehicle,
    current_km: Number(currentKm || 0),
    last_service_km: typeof lastServiceKm === 'number' ? Number(lastServiceKm || 0) : Number(vehicle.last_service_km || 0),
  });
}

export async function deleteCustomerVehicle(id: string) {
  await supabase.from('customer_vehicles').delete().eq('id', id);
  writeLocalVehicles(readLocalVehicles().filter((item) => item.id !== id));
}

export function buildReminders(vehicles: CustomerVehicle[]): ServiceReminder[] {
  return vehicles.map((vehicle) => {
    const nextKm = vehicle.next_service_km || calcNextServiceKm(vehicle.last_service_km, vehicle.service_interval_km);
    return {
      id: vehicle.id,
      customer_phone: vehicle.customer_phone,
      vehicle_id: vehicle.id,
      vehicle_title: vehicle.title,
      service_title: 'سرویس دوره‌ای روغن و فیلتر',
      last_service_km: Number(vehicle.last_service_km || 0),
      next_service_km: Number(nextKm || 0),
      current_km: Number(vehicle.current_km || 0),
      status: getServiceStatus(vehicle.current_km, nextKm),
    };
  });
}
