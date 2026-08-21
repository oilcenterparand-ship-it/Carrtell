import { supabase } from '../../lib/supabase';

export type Product = {
  id?: string;
  name: string;
  brand?: string;
  brand_id?: string | null;
  warehouse_id?: string | null;
  oil_base?: string;
  category?: string;
  oil_grade?: string;
  quality_level?: string;
  transmission_type?: string;
  compatible_transmissions?: string[];
  price: number;
  stock: number;
  image_url?: string;
  image_urls?: string[];
  specifications?: Record<string, string>;
  original_price?: number | null;
  amazing_price?: number | null;
  amazing_ends_at?: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_out_of_stock?: boolean;
  compatible_all_cars?: boolean;
  suitable_cars?: string[];
  compatible_car_ids?: string[];
  description?: string;
  card_features?: string;
  recommendation_reason?: string;
  recommendation_priority?: number;
  related_product_ids?: string[];
  upsell_title?: string;
};

type ProductCompatibleCarRow = {
  product_id: string;
  car_id: string;
};

type ProductPayload = Omit<Product, 'id' | 'compatible_car_ids'>;

const OPTIONAL_PRODUCT_COLUMNS = new Set([
  'recommendation_reason',
  'recommendation_priority',
  'related_product_ids',
  'upsell_title',
  'warehouse_id',
  'oil_base',
]);

function getMissingSchemaColumn(error: unknown): string | null {
  const message = String((error as { message?: string } | null)?.message || '');
  const match = message.match(/Could not find the ['"]([^'"]+)['"] column/i);
  return match?.[1] || null;
}

async function saveProductRow(
  mode: 'insert' | 'update',
  payload: Partial<ProductPayload>,
  id?: string,
) {
  let safePayload: Partial<ProductPayload> = { ...payload };

  for (let attempt = 0; attempt < OPTIONAL_PRODUCT_COLUMNS.size + 1; attempt += 1) {
    const query = mode === 'insert'
      ? supabase.from('products').insert(safePayload)
      : supabase.from('products').update(safePayload).eq('id', id as string);

    const { data, error } = await query.select().single();
    if (!error) return data;

    const missingColumn = getMissingSchemaColumn(error);
    if (!missingColumn || !OPTIONAL_PRODUCT_COLUMNS.has(missingColumn)) throw error;

    const { [missingColumn as keyof ProductPayload]: _removed, ...nextPayload } = safePayload;
    safePayload = nextPayload;
    console.warn(`ستون اختیاری ${missingColumn} هنوز در Supabase ساخته نشده و موقتاً از ذخیره حذف شد.`);
  }

  throw new Error('ذخیره محصول پس از حذف فیلدهای اختیاری ناموفق بود.');
}

function cleanProductPayload(product: Partial<Product>): Partial<ProductPayload> {
  const {
    id,
    compatible_car_ids,
    product_compatible_cars,
    brands,
    ...payload
  } = product as Partial<Product> & { product_compatible_cars?: unknown; brands?: unknown };

  return {
    ...payload,
    brand_id: payload.brand_id || null,
    original_price: payload.original_price === undefined ? undefined : Number(payload.original_price || 0),
    amazing_price: payload.amazing_price === undefined ? undefined : (payload.amazing_price === null ? null : Number(payload.amazing_price || 0)),
    amazing_ends_at: payload.amazing_ends_at || null,
  };
}

function mergeCompatibleCars(products: Product[], relations: ProductCompatibleCarRow[]) {
  const map = new Map<string, string[]>();

  relations.forEach((item) => {
    const current = map.get(item.product_id) || [];
    current.push(item.car_id);
    map.set(item.product_id, current);
  });

  return products.map((product) => ({
    ...product,
    compatible_car_ids: product.id ? map.get(product.id) || [] : [],
  }));
}

async function syncProductCars(productId: string, carIds: string[] = []) {
  const { error: deleteError } = await supabase
    .from('product_compatible_cars')
    .delete()
    .eq('product_id', productId);

  if (deleteError) throw deleteError;

  if (!carIds.length) return;

  const rows = Array.from(new Set(carIds)).map((carId) => ({
    product_id: productId,
    car_id: carId,
  }));

  const { error: insertError } = await supabase
    .from('product_compatible_cars')
    .insert(rows);

  if (insertError) throw insertError;
}

export async function getProducts() {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (productsError) throw productsError;

  const products = (productsData || []).filter((item): item is Product => Boolean(item && typeof item === 'object' && typeof (item as Product).name === 'string')) as Product[];
  const productIds = products.map((product) => product.id).filter(Boolean) as string[];

  if (!productIds.length) return products.map((product) => ({ ...product, compatible_car_ids: [] }));

  const { data: relationsData, error: relationsError } = await supabase
    .from('product_compatible_cars')
    .select('product_id, car_id')
    .in('product_id', productIds);

  if (relationsError) throw relationsError;

  return mergeCompatibleCars(products, (relationsData || []) as ProductCompatibleCarRow[]);
}


export async function getStorefrontSearchProducts(limit = 600): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || [])
    .filter((item): item is Product => Boolean(item && typeof item === 'object' && typeof (item as Product).name === 'string'))
    .map((item) => ({ ...item, compatible_car_ids: Array.isArray(item.compatible_car_ids) ? item.compatible_car_ids : [] }));
}

export async function createProduct(product: Product) {
  const { compatible_car_ids = [] } = product;

  const data = await saveProductRow('insert', cleanProductPayload(product));

  if (!product.compatible_all_cars) {
    await syncProductCars(data.id, compatible_car_ids);
  }

  return data;
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const { compatible_car_ids } = product;

  const data = await saveProductRow('update', cleanProductPayload(product), id);

  if (product.compatible_all_cars) {
    await syncProductCars(id, []);
  } else if (Array.isArray(compatible_car_ids)) {
    await syncProductCars(id, compatible_car_ids);
  }

  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}
