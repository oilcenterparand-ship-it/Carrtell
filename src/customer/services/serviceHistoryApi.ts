import { supabase } from '../../lib/supabase';

export type ServiceCatalogItem = {
  id: string;
  title: string;
  emoji?: string | null;
  category?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

export type ServiceHistoryRecord = {
  id: string;
  customer_phone: string;
  vehicle_id?: string | null;
  vehicle_title?: string | null;
  service_request_id?: string | null;
  source?: 'carrtell' | 'customer' | 'admin' | null;
  performed_by_name?: string | null;
  service_type: string;
  service_date?: string | null;
  service_km: number;
  next_service_km?: number | null;
  changed_items?: Array<{ id?: string; title: string; emoji?: string }> | null;
  products_used?: string[] | null;
  notes?: string | null;
  warning_notes?: string | null;
  odometer_image_url?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  invoice_image_url?: string | null;
  created_at?: string;
};

const LOCAL_KEY = 'carrtell:service-history';
const LOCAL_ITEMS_KEY = 'carrtell:service-catalog';

const DEFAULT_ITEMS: ServiceCatalogItem[] = [
  { id: 'engine-oil', title: 'روغن موتور', emoji: '🛢️', category: 'روغن و مایعات', is_active: true, sort_order: 10 },
  { id: 'oil-filter', title: 'فیلتر روغن', emoji: '🔩', category: 'فیلترها', is_active: true, sort_order: 20 },
  { id: 'air-filter', title: 'فیلتر هوا', emoji: '🌬️', category: 'فیلترها', is_active: true, sort_order: 30 },
  { id: 'cabin-filter', title: 'فیلتر کابین', emoji: '🧼', category: 'فیلترها', is_active: true, sort_order: 40 },
  { id: 'fuel-filter', title: 'فیلتر بنزین', emoji: '⛽', category: 'فیلترها', is_active: true, sort_order: 50 },
  { id: 'gear-oil', title: 'روغن گیربکس', emoji: '⚙️', category: 'روغن و مایعات', is_active: true, sort_order: 60 },
  { id: 'coolant', title: 'ضدیخ و ضدجوش', emoji: '❄️', category: 'روغن و مایعات', is_active: true, sort_order: 70 },
  { id: 'brake-fluid', title: 'روغن ترمز', emoji: '🛑', category: 'روغن و مایعات', is_active: true, sort_order: 80 },
  { id: 'spark-plug', title: 'شمع موتور', emoji: '⚡', category: 'قطعات مصرفی', is_active: true, sort_order: 90 },
  { id: 'belt', title: 'تسمه', emoji: '🔗', category: 'قطعات مصرفی', is_active: true, sort_order: 100 },
  { id: 'front-pad', title: 'لنت جلو', emoji: '🛞', category: 'ترمز', is_active: true, sort_order: 110 },
  { id: 'rear-pad', title: 'لنت عقب', emoji: '🛞', category: 'ترمز', is_active: true, sort_order: 120 },
  { id: 'wiper', title: 'برف‌پاک‌کن', emoji: '🌧️', category: 'قطعات مصرفی', is_active: true, sort_order: 130 },
];

function readLocal(): ServiceHistoryRecord[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}

function writeLocal(items: ServiceHistoryRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function readLocalItems(): ServiceCatalogItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_ITEMS_KEY) || '[]');
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_ITEMS;
  } catch { return DEFAULT_ITEMS; }
}

function writeLocalItems(items: ServiceCatalogItem[]) {
  localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(items));
}

export async function getServiceCatalogItems(includeInactive = false) {
  let query = supabase.from('service_catalog_items').select('*').order('sort_order', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (!error && data?.length) return data as ServiceCatalogItem[];
  return readLocalItems().filter((item) => includeInactive || item.is_active !== false);
}

export async function saveServiceCatalogItem(item: Partial<ServiceCatalogItem> & { title: string }) {
  const payload = {
    title: item.title.trim(),
    emoji: item.emoji || '🔧',
    category: item.category || 'سایر',
    is_active: item.is_active !== false,
    sort_order: Number(item.sort_order || 0),
  };
  const query = item.id
    ? supabase.from('service_catalog_items').update(payload).eq('id', item.id).select('*').single()
    : supabase.from('service_catalog_items').insert(payload).select('*').single();
  const { data, error } = await query;
  if (!error && data) return data as ServiceCatalogItem;
  const local = readLocalItems();
  const saved = { ...payload, id: item.id || crypto.randomUUID() } as ServiceCatalogItem;
  writeLocalItems(item.id ? local.map((row) => row.id === item.id ? saved : row) : [...local, saved]);
  return saved;
}

export async function deleteServiceCatalogItem(id: string) {
  await supabase.from('service_catalog_items').delete().eq('id', id);
  writeLocalItems(readLocalItems().filter((row) => row.id !== id));
}

export async function getServiceHistory(phone: string, vehicleId?: string | null) {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return [] as ServiceHistoryRecord[];

  let query = supabase
    .from('customer_service_history')
    .select('*')
    .eq('customer_phone', cleanPhone)
    .order('service_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (vehicleId) query = query.eq('vehicle_id', vehicleId);

  const { data, error } = await query;
  if (!error) return (data || []) as ServiceHistoryRecord[];

  return readLocal().filter((item) => item.customer_phone === cleanPhone && (!vehicleId || item.vehicle_id === vehicleId));
}

export async function getLatestServiceHistory(phone: string, vehicleId?: string | null) {
  const rows = await getServiceHistory(phone, vehicleId);
  return rows[0] || null;
}

export async function saveServiceHistory(record: Omit<ServiceHistoryRecord, 'id'> & { id?: string }) {
  const payload = {
    ...record,
    customer_phone: record.customer_phone.trim(),
    service_date: record.service_date || new Date().toISOString().slice(0, 10),
    source: record.source || 'customer',
    service_km: Number(record.service_km || 0),
    next_service_km: record.next_service_km ? Number(record.next_service_km) : null,
    changed_items: record.changed_items || [],
    products_used: record.products_used || [],
  };

  const query = record.id
    ? supabase.from('customer_service_history').update(payload).eq('id', record.id).select('*').single()
    : supabase.from('customer_service_history').insert(payload).select('*').single();
  const { data, error } = await query;

  if (!error && data) return data as ServiceHistoryRecord;

  const localRecord = { ...payload, id: record.id || crypto.randomUUID(), created_at: new Date().toISOString() } as ServiceHistoryRecord;
  const local = readLocal();
  writeLocal(record.id ? local.map((row) => row.id === record.id ? localRecord : row) : [localRecord, ...local]);
  return localRecord;
}
