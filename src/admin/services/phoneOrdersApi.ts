import { supabase } from '../../lib/supabase';
import type { Product } from './productsApi';
import type { Car } from './carsApi';

export type PhoneOrderItem = { product: Product; quantity: number };
export type PhoneOrderInput = {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerCar?: string;
  fulfillmentMethod: 'onsite_service' | 'store_pickup';
  scheduledAt?: string;
  paymentMethod: 'online' | 'card_reader' | 'cash' | 'pay_on_site';
  note?: string;
  items: PhoneOrderItem[];
};

function makeOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CT-PH-${stamp}-${random}`;
}

function missingColumn(error: unknown) {
  const message = String((error as { message?: string } | null)?.message || '');
  return message.match(/Could not find the ['"]([^'"]+)['"] column/i)?.[1] || null;
}

async function insertResilient(table: string, payload: Record<string, unknown>) {
  let safe = { ...payload };
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await supabase.from(table).insert(safe).select().single();
    if (!error) return data as Record<string, any>;
    const column = missingColumn(error);
    if (!column || !(column in safe)) throw error;
    const { [column]: _removed, ...rest } = safe;
    safe = rest;
  }
  throw new Error(`ثبت اطلاعات در ${table} ناموفق بود.`);
}

export async function getPhoneOrderProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as Product[];
}

export async function getPhoneOrderCars() {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('is_active', true)
    .order('brand', { ascending: true })
    .order('model', { ascending: true });
  if (error) return [] as Car[];
  return (data || []) as Car[];
}

export async function createPhoneOrder(input: PhoneOrderInput) {
  if (!input.items.length) throw new Error('حداقل یک محصول انتخاب کن.');
  const totalAmount = input.items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const itemsCount = input.items.reduce((sum, item) => sum + item.quantity, 0);
  const order = await insertResilient('orders', {
    order_number: makeOrderNumber(),
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    customer_address: input.customerAddress || null,
    customer_car: input.customerCar || null,
    note: input.note || null,
    status: 'pending_review',
    payment_status: input.paymentMethod === 'online' ? 'unpaid' : 'pending',
    payment_method: input.paymentMethod,
    fulfillment_method: input.fulfillmentMethod,
    order_source: 'phone',
    scheduled_at: input.scheduledAt || null,
    total_amount: totalAmount,
    items_count: itemsCount,
  });

  const rows = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_image_url: item.product.image_url || null,
    quantity: item.quantity,
    unit_price: Number(item.product.price || 0),
    total_price: Number(item.product.price || 0) * item.quantity,
  }));
  const { error: itemsError } = await supabase.from('order_items').insert(rows);
  if (itemsError) throw itemsError;

  if (input.fulfillmentMethod === 'onsite_service') {
    await insertResilient('service_requests', {
      order_id: order.id,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_address: input.customerAddress || null,
      customer_car: input.customerCar || null,
      scheduled_at: input.scheduledAt || null,
      status: 'pending_assignment',
      source: 'phone_order',
      total_amount: totalAmount,
      admin_notes: input.note || null,
    });
  }

  await supabase.from('admin_notifications').insert({
    type: input.fulfillmentMethod === 'onsite_service' ? 'new_onsite_order' : 'new_phone_order',
    title: 'سفارش تلفنی جدید ثبت شد',
    message: `سفارش ${order.order_number} برای ${input.customerName} ثبت شد.`,
    order_id: order.id,
    is_read: false,
  }).then(() => undefined);

  return order;
}
