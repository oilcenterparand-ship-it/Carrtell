import { supabase } from '../../lib/supabase';
import type { Product } from './productsApi';

export type CarPackageItem = {
  id?: string;
  package_id?: string;
  product_id: string;
  quantity: number;
  product?: Product;
};

export type CarPackage = {
  id?: string;
  title: string;
  slug?: string;
  category_title: string;
  car_id?: string | null;
  description?: string;
  badge?: string;
  image_url?: string;
  cover_color?: string | null;
  package_font?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  items?: CarPackageItem[];
};

type PackageRow = Omit<CarPackage, 'items'> & {
  car_package_items?: (CarPackageItem & { products?: Product })[];
};

function makeSlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, '-');
}

function mapPackage(row: PackageRow): CarPackage {
  const items = (row.car_package_items || []).map((item) => ({
    id: item.id,
    package_id: item.package_id,
    product_id: item.product_id,
    quantity: item.quantity || 1,
    product: item.products,
  }));

  const { car_package_items, ...pkg } = row;
  return { ...pkg, items };
}

export async function getCarPackages() {
  const { data, error } = await supabase
    .from('car_packages')
    .select('*, car_package_items(id, package_id, product_id, quantity, products(*))')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as PackageRow[]).map(mapPackage);
}

export async function createCarPackage(pkg: CarPackage) {
  const { items = [], ...payload } = pkg;
  const slug = payload.slug?.trim() || makeSlug(payload.title);

  const { data, error } = await supabase
    .from('car_packages')
    .insert({ ...payload, slug })
    .select()
    .single();

  if (error) throw error;

  await syncPackageItems(data.id, items);
  return data;
}

export async function updateCarPackage(id: string, pkg: Partial<CarPackage>) {
  const { items, ...payload } = pkg;
  const updatePayload = {
    ...payload,
    ...(payload.title && !payload.slug ? { slug: makeSlug(payload.title) } : {}),
  };

  const { data, error } = await supabase
    .from('car_packages')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (Array.isArray(items)) {
    await syncPackageItems(id, items);
  }

  return data;
}

export async function deleteCarPackage(id: string) {
  const { error } = await supabase.from('car_packages').delete().eq('id', id);
  if (error) throw error;
  return true;
}

async function syncPackageItems(packageId: string, items: CarPackageItem[]) {
  const { error: deleteError } = await supabase
    .from('car_package_items')
    .delete()
    .eq('package_id', packageId);

  if (deleteError) throw deleteError;

  const rows = items
    .filter((item) => item.product_id)
    .map((item) => ({
      package_id: packageId,
      product_id: item.product_id,
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));

  if (!rows.length) return;

  const { error: insertError } = await supabase.from('car_package_items').insert(rows);
  if (insertError) throw insertError;
}
