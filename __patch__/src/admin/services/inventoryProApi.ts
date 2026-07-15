import { supabase } from '../../lib/supabase';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type InventoryRow = {
  id: string;
  product_id?: string | null;
  name: string;
  brand?: string | null;
  sku?: string | null;
  stock: number;
  min_stock: number;
  price?: number | null;
  status: InventoryStatus;
};

export type InventoryTransaction = {
  id?: string;
  product_id: string;
  type: 'purchase' | 'sale' | 'manual_adjustment' | 'return' | 'damage';
  quantity: number;
  note?: string | null;
  source?: string | null;
  created_at?: string;
};

function normalizeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getInventoryStatus(stock: number, minStock: number): InventoryStatus {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'in_stock';
}

export async function listInventory(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,title,brand,sku,inventory,stock,min_stock,price,is_active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: any) => {
    const stock = normalizeNumber(p.inventory ?? p.stock, 0);
    const minStock = normalizeNumber(p.min_stock, 5);
    return {
      id: p.id,
      product_id: p.id,
      name: p.name || p.title || 'محصول بدون نام',
      brand: p.brand || null,
      sku: p.sku || null,
      stock,
      min_stock: minStock,
      price: normalizeNumber(p.price, 0),
      status: getInventoryStatus(stock, minStock),
    };
  });
}

export async function listLowStockProducts(): Promise<InventoryRow[]> {
  const rows = await listInventory();
  return rows.filter((row) => row.status !== 'in_stock');
}

export async function listInventoryTransactions(productId?: string): Promise<InventoryTransaction[]> {
  let query = supabase
    .from('inventory_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (productId) query = query.eq('product_id', productId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as InventoryTransaction[];
}

export async function addInventoryTransaction(input: InventoryTransaction) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id,inventory,stock')
    .eq('id', input.product_id)
    .single();

  if (productError) throw productError;

  const currentStock = normalizeNumber((product as any).inventory ?? (product as any).stock, 0);
  const delta = ['purchase', 'return'].includes(input.type) ? Math.abs(input.quantity) : -Math.abs(input.quantity);
  const nextStock = Math.max(0, currentStock + delta);

  const { error: txError } = await supabase.from('inventory_transactions').insert({
    product_id: input.product_id,
    type: input.type,
    quantity: Math.abs(input.quantity),
    note: input.note || null,
    source: input.source || 'admin',
    stock_before: currentStock,
    stock_after: nextStock,
  });

  if (txError) throw txError;

  const { error: updateError } = await supabase
    .from('products')
    .update({ inventory: nextStock, stock: nextStock })
    .eq('id', input.product_id);

  if (updateError) throw updateError;

  return nextStock;
}

export async function updateProductMinStock(productId: string, minStock: number) {
  const { error } = await supabase
    .from('products')
    .update({ min_stock: Math.max(0, Number(minStock) || 0) })
    .eq('id', productId);
  if (error) throw error;
}
