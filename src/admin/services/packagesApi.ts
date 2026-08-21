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
  items?: Array<CarPackageItem & { products?: Product | Product[] }>;
  car_package_items?: Array<CarPackageItem & { products?: Product | Product[] }>;
};

function normalizeRelatedProduct(value?: Product | Product[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function makeSlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, '-');
}

function mapPackage(row: PackageRow): CarPackage {
  const rawItems = Array.isArray(row.car_package_items)
    ? row.car_package_items
    : Array.isArray(row.items)
      ? row.items
      : [];

  const items = rawItems.map((item) => ({
    id: item.id,
    package_id: item.package_id,
    product_id: item.product_id,
    quantity: item.quantity || 1,
    product: item.product || normalizeRelatedProduct(item.products),
  }));

  const { car_package_items, items: _rawItems, ...pkg } = row;
  return { ...pkg, items };
}

export async function getCarPackages() {
  const { data: packageData, error: packageError } = await supabase
    .from('car_packages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (packageError) throw packageError;

  const packageRows = (packageData || []) as PackageRow[];
  const packageIds = packageRows.map((pkg) => pkg.id).filter(Boolean) as string[];
  if (!packageIds.length) return [];

  const { data: itemData, error: itemError } = await supabase
    .from('car_package_items')
    .select('id, package_id, product_id, quantity, products(*)')
    .in('package_id', packageIds);

  if (itemError) throw itemError;

  const itemsByPackage = new Map<string, PackageRow['car_package_items']>();
  ((itemData || []) as NonNullable<PackageRow['car_package_items']>).forEach((item) => {
    if (!item.package_id) return;
    const current = itemsByPackage.get(item.package_id) || [];
    current.push(item);
    itemsByPackage.set(item.package_id, current);
  });

  return packageRows.map((pkg) => mapPackage({
    ...pkg,
    car_package_items: pkg.id ? itemsByPackage.get(pkg.id) || [] : [],
  }));
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
