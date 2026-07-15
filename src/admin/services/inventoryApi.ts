import { supabase } from '../../lib/supabase';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type InventoryMovementType = 'increase' | 'decrease' | 'adjustment' | 'sale' | 'return';

export interface InventoryProductRow {
  id: string;
  name: string;
  title?: string | null;
  sku?: string | null;
  stock?: number | null;
  inventory_quantity?: number | null;
  min_stock?: number | null;
  low_stock_threshold?: number | null;
  is_active?: boolean | null;
  active?: boolean | null;
  price?: number | null;
  sale_price?: number | null;
  image_url?: string | null;
  main_image_url?: string | null;
  category?: string | null;
  brand?: string | null;
}

export interface InventoryMovementRow {
  id: string;
  product_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  note?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: string | null;
}

const numberOrZero = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const getProductStock = (product: Partial<InventoryProductRow>) =>
  numberOrZero(product.inventory_quantity ?? product.stock ?? 0);

export const getProductMinStock = (product: Partial<InventoryProductRow>) =>
  numberOrZero(product.low_stock_threshold ?? product.min_stock ?? 3);

export const getInventoryStatus = (product: Partial<InventoryProductRow>): InventoryStatus => {
  const stock = getProductStock(product);
  const minStock = getProductMinStock(product);
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'in_stock';
};

export const getInventoryStatusLabel = (status: InventoryStatus) => {
  if (status === 'out_of_stock') return 'ناموجود';
  if (status === 'low_stock') return 'رو به اتمام';
  return 'موجود';
};

export async function getInventoryProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as InventoryProductRow[];
}

export async function getInventoryMovements(productId?: string) {
  let query = supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (productId) query = query.eq('product_id', productId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InventoryMovementRow[];
}

export async function updateProductInventory(params: {
  productId: string;
  movementType: InventoryMovementType;
  quantity: number;
  note?: string;
  referenceType?: string;
  referenceId?: string;
}) {
  const { productId, movementType, quantity, note, referenceType, referenceId } = params;
  const safeQuantity = Math.max(0, Number(quantity) || 0);

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  const previousStock = getProductStock(product as InventoryProductRow);
  let newStock = previousStock;

  if (movementType === 'increase' || movementType === 'return') {
    newStock = previousStock + safeQuantity;
  } else if (movementType === 'decrease' || movementType === 'sale') {
    newStock = Math.max(0, previousStock - safeQuantity);
  } else if (movementType === 'adjustment') {
    newStock = safeQuantity;
  }

  const updatePayload: Record<string, unknown> = {
    inventory_quantity: newStock,
    stock: newStock,
    updated_at: new Date().toISOString(),
  };

  if (newStock <= 0) {
    updatePayload.is_active = false;
    updatePayload.active = false;
  }

  const { error: updateError } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId);

  if (updateError) throw updateError;

  const { error: movementError } = await supabase.from('inventory_movements').insert({
    product_id: productId,
    movement_type: movementType,
    quantity: safeQuantity,
    previous_stock: previousStock,
    new_stock: newStock,
    note: note || null,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
  });

  if (movementError) throw movementError;

  return { previousStock, newStock };
}

export async function updateLowStockThreshold(productId: string, threshold: number) {
  const safeThreshold = Math.max(0, Number(threshold) || 0);
  const { error } = await supabase
    .from('products')
    .update({ low_stock_threshold: safeThreshold, min_stock: safeThreshold })
    .eq('id', productId);

  if (error) throw error;
}

export async function decrementInventoryForOrder(orderId: string, items: Array<{ product_id?: string; id?: string; quantity?: number }>) {
  for (const item of items) {
    const productId = item.product_id || item.id;
    if (!productId) continue;

    await updateProductInventory({
      productId,
      movementType: 'sale',
      quantity: Number(item.quantity || 1),
      note: `کاهش خودکار موجودی بابت سفارش ${orderId}`,
      referenceType: 'order',
      referenceId: orderId,
    });
  }
}
