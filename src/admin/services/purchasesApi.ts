import { supabase } from '../../lib/supabase';

export type Supplier = {
  id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
};

export type PurchaseItemInput = {
  product_id: string;
  quantity: number;
  unit_cost: number;
};

export type PurchaseOrderInput = {
  supplier_id?: string | null;
  invoice_number?: string | null;
  purchase_date?: string | null;
  discount_amount?: number;
  notes?: string | null;
  items: PurchaseItemInput[];
};

export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveSupplier(input: Partial<Supplier>) {
  const payload = {
    name: input.name?.trim() || 'تأمین‌کننده بدون نام',
    contact_name: input.contact_name || null,
    phone: input.phone || null,
    address: input.address || null,
    notes: input.notes || null,
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

export async function getPurchaseOrders() {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, suppliers(name, phone), purchase_items(*, products(name, price, stock))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPurchaseOrder(input: PurchaseOrderInput) {
  const items = (input.items || []).filter((item) => item.product_id && item.quantity > 0);
  if (!items.length) throw new Error('حداقل یک محصول برای خرید انتخاب کن.');

  const totalBeforeDiscount = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  const discount = Number(input.discount_amount || 0);
  const total = Math.max(totalBeforeDiscount - discount, 0);

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id: input.supplier_id || null,
      invoice_number: input.invoice_number || null,
      purchase_date: input.purchase_date || new Date().toISOString().slice(0, 10),
      discount_amount: discount,
      total_amount: total,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  const purchaseItems = items.map((item) => ({
    purchase_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
  }));

  const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);
  if (itemsError) throw itemsError;

  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock, avg_purchase_price')
      .eq('id', item.product_id)
      .single();

    const oldStock = Number(product?.stock || 0);
    const oldAvg = Number(product?.avg_purchase_price || 0);
    const newStock = oldStock + item.quantity;
    const newAvg = newStock > 0 ? Math.round(((oldStock * oldAvg) + (item.quantity * item.unit_cost)) / newStock) : item.unit_cost;

    await supabase
      .from('products')
      .update({
        stock: newStock,
        last_purchase_price: item.unit_cost,
        avg_purchase_price: newAvg,
        supplier_id: input.supplier_id || null,
      })
      .eq('id', item.product_id);

    await supabase.from('inventory_movements').insert({
      product_id: item.product_id,
      type: 'purchase',
      quantity: item.quantity,
      reason: 'ثبت خرید از تأمین‌کننده',
      supplier_id: input.supplier_id || null,
      purchase_id: order.id,
      unit_cost: item.unit_cost,
    }).then(() => null);
  }

  return order;
}

export async function getPurchaseStats() {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock, price, avg_purchase_price, last_purchase_price');

  const inventoryValue = (products ?? []).reduce((sum, product: any) => {
    return sum + Number(product.stock || 0) * Number(product.avg_purchase_price || product.last_purchase_price || 0);
  }, 0);

  const potentialGrossProfit = (products ?? []).reduce((sum, product: any) => {
    const salePrice = Number(product.price || 0);
    const cost = Number(product.avg_purchase_price || product.last_purchase_price || 0);
    return sum + Math.max(salePrice - cost, 0) * Number(product.stock || 0);
  }, 0);

  return { inventoryValue, potentialGrossProfit, products: products ?? [] };
}
