import { supabase } from '../lib/supabase';

type ProductLike = Record<string, any>;

type Options = {
  carId?: string | null;
  currentProductId?: string | null;
  cartItems?: ProductLike[];
  limit?: number;
};

const isAvailable = (p: ProductLike) => {
  const active = p.is_active ?? p.active ?? true;
  const inventory = Number(p.inventory ?? p.stock ?? p.quantity ?? 0);
  return active && inventory > 0;
};

const isCompatibleWithCar = (p: ProductLike, carId?: string | null) => {
  if (!carId) return true;
  if (p.compatible_all_cars || p.all_cars || p.is_universal) return true;
  const ids = p.compatible_car_ids || p.car_ids || p.cars || [];
  return Array.isArray(ids) ? ids.includes(carId) : true;
};

export async function getSmartSuggestions(options: Options = {}) {
  const limit = options.limit || 6;
  const cartIds = new Set((options.cartItems || []).map((item) => item.id).filter(Boolean));

  const { data: settings } = await supabase.from('smart_sales_settings').select('*').eq('id', 'default').maybeSingle();
  if (settings && settings.enabled === false) return [];

  const { data: products, error } = await supabase.from('products').select('*').limit(80);
  if (error || !products) return [];

  return products
    .filter((p: ProductLike) => !cartIds.has(p.id))
    .filter((p: ProductLike) => isAvailable(p))
    .filter((p: ProductLike) => isCompatibleWithCar(p, options.carId))
    .slice(0, limit);
}
