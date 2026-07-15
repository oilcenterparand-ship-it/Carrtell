import { supabase } from '../../lib/supabase';

export type Car = {
  id?: string;
  brand: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission_type?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  oil_viscosity?: string;
  recommended_oil_grades?: string[];
  recommended_quality_levels?: string[];
  oil_capacity_liters?: number | null;
  service_interval_km?: number | null;
  is_active?: boolean;
  notes?: string;
};

export const TRANSMISSION_TYPES = [
  'دستی',
  'اتوماتیک AT',
  'CVT',
  'دوکلاچه DCT',
  'نیمه‌اتوماتیک AMT',
  'تیپ‌ترونیک / شیفت‌ترونیک',
  'اتوماتیک ZF',
  'اتوماتیک AL4',
  'اتوماتیک 4 سرعته',
  'اتوماتیک 5 سرعته',
  'اتوماتیک 6 سرعته',
  'اتوماتیک 8 سرعته',
  'برقی تک‌سرعته',
  'نامشخص / قابل تشخیص با AI',
];

export function getCarTitle(car: Car) {
  return [car.brand, car.model, car.trim, car.engine].filter(Boolean).join(' ');
}

const CARS_CACHE_KEY = 'carrtell_admin_cars_cache';

function sortCars(items: Car[]) {
  return [...items].sort((a, b) => {
    const brandCompare = String(a.brand || '').localeCompare(String(b.brand || ''), 'fa');
    if (brandCompare !== 0) return brandCompare;
    return String(a.model || '').localeCompare(String(b.model || ''), 'fa');
  });
}

function cacheCars(items: Car[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CARS_CACHE_KEY, JSON.stringify(items));
    }
  } catch {
    // cache is only a browser fallback; ignore storage errors
  }
}

export function getCachedCars() {
  try {
    if (typeof window === 'undefined') return [] as Car[];
    const raw = localStorage.getItem(CARS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Car[]) : [];
  } catch {
    return [] as Car[];
  }
}

export async function getCars() {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .order('brand', { ascending: true })
    .order('model', { ascending: true });

  if (error) throw error;
  const cars = sortCars((data || []) as Car[]);
  cacheCars(cars);
  return cars;
}

export async function getActiveCarsForCustomer() {
  try {
    const cars = await getCars();
    const activeCars = cars.filter((car) => car.is_active !== false);
    if (activeCars.length > 0) return activeCars;
  } catch {
    // fallback to the last cars loaded in admin panel on this browser
  }
  return sortCars(getCachedCars().filter((car) => car.is_active !== false));
}

function cleanCarPayload(car: Partial<Car>) {
  return {
    ...car,
    end_year: null,
    recommended_oil_grades: car.recommended_oil_grades || [],
    recommended_quality_levels: car.recommended_quality_levels || [],
    transmission_type: car.transmission_type || null,
  };
}

export async function createCar(car: Car) {
  const { data, error } = await supabase
    .from('cars')
    .insert(cleanCarPayload(car))
    .select()
    .single();

  if (error) throw error;
  return data as Car;
}

export async function updateCar(id: string, car: Partial<Car>) {
  const { data, error } = await supabase
    .from('cars')
    .update(cleanCarPayload(car))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Car;
}

export async function deleteCar(id: string) {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  if (error) throw error;
  return true;
}
