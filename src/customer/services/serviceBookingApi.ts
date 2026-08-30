import { supabase } from '../../lib/supabase';

export type BookingService = {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  base_labor_fee: number;
  estimated_minutes: number;
  is_active: boolean;
  sort_order: number;
  recommended_categories?: string[];
};

export type BookingSlot = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  capacity: number;
  remaining: number;
  is_active: boolean;
};

export type ServicePricingSettings = {
  travel_fee: number;
  travel_per_km_fee: number;
  travel_origin_latitude: number;
  travel_origin_longitude: number;
  service_center_latitude: number;
  service_center_longitude: number;
  service_radius_km: number;
  traffic_zone_surcharge_percent: number;
  traffic_zone_polygon: Array<[number, number]>;
  night_fee: number;
  holiday_fee: number;
  out_of_area_fee: number;
  night_start_hour: number;
  club_discount_percent: number;
  service_area_cities: string[];
};

const DEFAULT_SERVICES: BookingService[] = [
  { id: 'oil-change', title: 'تعویض روغن موتور', description: 'تعویض روغن و کنترل سطح مایعات', icon: '🛢️', base_labor_fee: 180000, estimated_minutes: 35, is_active: true, sort_order: 1, recommended_categories: ['روغن موتور', 'فیلتر روغن'] },
  { id: 'periodic', title: 'سرویس دوره‌ای', description: 'بازدید کامل اقلام مصرفی خودرو', icon: '🔧', base_labor_fee: 320000, estimated_minutes: 60, is_active: true, sort_order: 2, recommended_categories: ['روغن موتور', 'فیلتر روغن', 'فیلتر هوا', 'فیلتر کابین'] },
  { id: 'gearbox', title: 'تعویض روغن گیربکس', description: 'تعویض روغن گیربکس دستی یا اتوماتیک', icon: '⚙️', base_labor_fee: 450000, estimated_minutes: 75, is_active: true, sort_order: 3, recommended_categories: ['روغن گیربکس'] },
  { id: 'coolant', title: 'تعویض ضدیخ و ضدجوش', description: 'تخلیه، شست‌وشو و جایگزینی مایع خنک‌کننده', icon: '❄️', base_labor_fee: 260000, estimated_minutes: 50, is_active: true, sort_order: 4, recommended_categories: ['ضدیخ', 'ضدجوش'] },
  { id: 'brake', title: 'بازدید و تعویض لنت', description: 'بازدید لنت و تعویض در صورت نیاز', icon: '🛞', base_labor_fee: 380000, estimated_minutes: 60, is_active: true, sort_order: 5, recommended_categories: ['لنت'] },
];

const DEFAULT_SLOTS: BookingSlot[] = [
  { id: 'slot-9-11', label: '۹ تا ۱۱', start_time: '09:00', end_time: '11:00', capacity: 3, remaining: 3, is_active: true },
  { id: 'slot-11-13', label: '۱۱ تا ۱۳', start_time: '11:00', end_time: '13:00', capacity: 3, remaining: 2, is_active: true },
  { id: 'slot-14-16', label: '۱۴ تا ۱۶', start_time: '14:00', end_time: '16:00', capacity: 2, remaining: 2, is_active: true },
  { id: 'slot-16-18', label: '۱۶ تا ۱۸', start_time: '16:00', end_time: '18:00', capacity: 2, remaining: 1, is_active: true },
  { id: 'slot-18-20', label: '۱۸ تا ۲۰', start_time: '18:00', end_time: '20:00', capacity: 2, remaining: 2, is_active: true },
];

const DEFAULT_PRICING: ServicePricingSettings = {
  travel_fee: 200000,
  travel_per_km_fee: 10000,
  travel_origin_latitude: 35.6505318,
  travel_origin_longitude: 51.2740074,
  service_center_latitude: 35.6892,
  service_center_longitude: 51.3890,
  service_radius_km: 40,
  traffic_zone_surcharge_percent: 30,
  traffic_zone_polygon: [[35.6595,51.3819],[35.7218,51.3892],[35.723,51.407],[35.7212,51.426],[35.7188,51.443],[35.704,51.447],[35.688,51.449],[35.674,51.447],[35.66,51.444]],
  night_fee: 120000,
  holiday_fee: 100000,
  out_of_area_fee: 250000,
  night_start_hour: 18,
  club_discount_percent: 5,
  service_area_cities: ['پرند', 'تهران', 'اسلامشهر', 'چهاردانگه'],
};

const LOCAL_SERVICES_KEY = 'carrtell:booking-services';
const LOCAL_SLOTS_KEY = 'carrtell:booking-slots';
const LOCAL_PRICING_KEY = 'carrtell:booking-pricing';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getBookingServices(): Promise<BookingService[]> {
  const { data, error } = await supabase.from('booking_services').select('*').order('sort_order', { ascending: true });
  if (!error && Array.isArray(data) && data.length) return data as BookingService[];
  return readLocal(LOCAL_SERVICES_KEY, DEFAULT_SERVICES).filter((item) => item.is_active !== false);
}

export async function saveBookingService(service: BookingService): Promise<BookingService> {
  const payload = { ...service, base_labor_fee: Number(service.base_labor_fee || 0), estimated_minutes: Number(service.estimated_minutes || 30), sort_order: Number(service.sort_order || 0) };
  const { data, error } = await supabase.from('booking_services').upsert(payload).select('*').single();
  if (!error && data) return data as BookingService;
  const current = readLocal(LOCAL_SERVICES_KEY, DEFAULT_SERVICES);
  const next = current.some((item) => item.id === payload.id) ? current.map((item) => item.id === payload.id ? payload : item) : [...current, payload];
  writeLocal(LOCAL_SERVICES_KEY, next);
  return payload;
}

export async function deleteBookingService(id: string) {
  await supabase.from('booking_services').delete().eq('id', id);
  writeLocal(LOCAL_SERVICES_KEY, readLocal(LOCAL_SERVICES_KEY, DEFAULT_SERVICES).filter((item) => item.id !== id));
}

export async function getBookingSlots(date: string): Promise<BookingSlot[]> {
  const { data, error } = await supabase.rpc('get_booking_slots_for_date', { p_date: date });
  if (!error && Array.isArray(data) && data.length) return data as BookingSlot[];

  const { data: slots, error: slotsError } = await supabase.from('booking_time_slots').select('*').eq('is_active', true).order('start_time');
  const base = !slotsError && Array.isArray(slots) && slots.length ? slots as BookingSlot[] : readLocal(LOCAL_SLOTS_KEY, DEFAULT_SLOTS);
  return base.map((slot) => ({ ...slot, remaining: Number(slot.remaining ?? slot.capacity) }));
}

export async function getAllBookingSlots(): Promise<BookingSlot[]> {
  const { data, error } = await supabase.from('booking_time_slots').select('*').order('start_time');
  if (!error && Array.isArray(data) && data.length) return data as BookingSlot[];
  return readLocal(LOCAL_SLOTS_KEY, DEFAULT_SLOTS);
}

export async function saveBookingSlot(slot: BookingSlot): Promise<BookingSlot> {
  const payload = { ...slot, capacity: Number(slot.capacity || 1), remaining: Number(slot.remaining ?? slot.capacity ?? 1) };
  const { data, error } = await supabase.from('booking_time_slots').upsert(payload).select('*').single();
  if (!error && data) return data as BookingSlot;
  const current = readLocal(LOCAL_SLOTS_KEY, DEFAULT_SLOTS);
  const next = current.some((item) => item.id === payload.id) ? current.map((item) => item.id === payload.id ? payload : item) : [...current, payload];
  writeLocal(LOCAL_SLOTS_KEY, next);
  return payload;
}

export async function deleteBookingSlot(id: string) {
  await supabase.from('booking_time_slots').delete().eq('id', id);
  writeLocal(LOCAL_SLOTS_KEY, readLocal(LOCAL_SLOTS_KEY, DEFAULT_SLOTS).filter((item) => item.id !== id));
}

export async function getServicePricingSettings(): Promise<ServicePricingSettings> {
  const { data, error } = await supabase.from('service_pricing_settings').select('*').eq('id', 'default').maybeSingle();
  if (!error && data) return {
    travel_fee: Number(data.travel_fee || 0),
    travel_per_km_fee: Number(data.travel_per_km_fee || 0),
    travel_origin_latitude: Number(data.travel_origin_latitude || DEFAULT_PRICING.travel_origin_latitude),
    travel_origin_longitude: Number(data.travel_origin_longitude || DEFAULT_PRICING.travel_origin_longitude),
    service_center_latitude: Number(data.service_center_latitude || DEFAULT_PRICING.service_center_latitude),
    service_center_longitude: Number(data.service_center_longitude || DEFAULT_PRICING.service_center_longitude),
    service_radius_km: Number(data.service_radius_km || DEFAULT_PRICING.service_radius_km),
    traffic_zone_surcharge_percent: Number(data.traffic_zone_surcharge_percent || 0),
    traffic_zone_polygon: Array.isArray(data.traffic_zone_polygon) ? data.traffic_zone_polygon : DEFAULT_PRICING.traffic_zone_polygon,
    night_fee: Number(data.night_fee || 0),
    holiday_fee: Number(data.holiday_fee || 0),
    out_of_area_fee: Number(data.out_of_area_fee || 0),
    night_start_hour: Number(data.night_start_hour || 18),
    club_discount_percent: Number(data.club_discount_percent || 0),
    service_area_cities: Array.isArray(data.service_area_cities) ? data.service_area_cities : [],
  };
  return readLocal(LOCAL_PRICING_KEY, DEFAULT_PRICING);
}

export async function saveServicePricingSettings(settings: ServicePricingSettings) {
  const payload = { id: 'default', ...settings };
  const { data, error } = await supabase.from('service_pricing_settings').upsert(payload).select('*').single();
  if (error || !data) throw new Error(error?.message || 'ذخیره قیمت‌گذاری در سرور انجام نشد.');
  writeLocal(LOCAL_PRICING_KEY, settings);
  return data;
}

export function calculateServicePricing(args: {
  services: BookingService[];
  pricing: ServicePricingSettings;
  date: string;
  slot?: BookingSlot | null;
  city?: string | null;
  isClubMember?: boolean;
  travelEstimate?: { total_fee: number; traffic_surcharge: number } | null;
}) {
  const labor = args.services.reduce((sum, item) => sum + Number(item.base_labor_fee || 0), 0);
  const travel = Number(args.travelEstimate?.total_fee ?? args.pricing.travel_fee);
  const trafficSurcharge = Number(args.travelEstimate?.traffic_surcharge || 0);
  // Night-time bookings no longer add a separate surcharge.
  const night = 0;
  const day = args.date ? new Date(`${args.date}T12:00:00`).getDay() : -1;
  const holiday = day === 5 ? args.pricing.holiday_fee : 0;
  const cleanCity = String(args.city || '').trim();
  const outOfArea = cleanCity && !args.pricing.service_area_cities.some((item) => cleanCity.includes(item) || item.includes(cleanCity)) ? args.pricing.out_of_area_fee : 0;
  const subtotal = labor + travel + holiday + outOfArea;
  const discount = args.isClubMember ? Math.round(subtotal * args.pricing.club_discount_percent / 100) : 0;
  return { labor, travel, trafficSurcharge, night, holiday, outOfArea, discount, total: Math.max(0, subtotal - discount) };
}
