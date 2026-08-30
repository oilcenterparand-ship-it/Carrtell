import { supabase } from '../../lib/supabase';
import type { Product } from './productsApi';
import { getProductFinalPrice } from './ordersUtils';
import { logSmsEvent, makeReviewLink } from './smsApi';

export type CartProductItem = {
  product: Product;
  quantity: number;
};

export type OrderStatus = 'pending_payment' | 'paid' | 'pending_review' | 'pending' | 'confirmed' | 'processing' | 'sent' | 'completed' | 'cancelled';

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  customer_car?: string | null;
  note?: string | null;
  status: OrderStatus;
  payment_status?: 'unpaid' | 'paid' | 'failed' | 'refunded' | null;
  payment_provider?: string | null;
  payment_reference?: string | null;
  paid_at?: string | null;
  payment_authority?: string | null;
  payment_attempts?: number | null;
  last_payment_error?: string | null;
  inventory_applied?: boolean | null;
  total_amount: number;
  items_count: number;
  items?: unknown[] | null;
  fulfillment_warehouse_id?: string | null;
  assigned_technician_id?: string | null;
  wallet_used?: number | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerCar?: string;
  note?: string;
  items: CartProductItem[];
};

function makeOrderNumber() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CT-${y}${m}${d}-${rand}`;
}

export async function createOrder(input: CreateOrderInput) {
  const items = input.items.filter((item) => item.product.id && item.quantity > 0);
  if (!items.length) throw new Error('سبد خرید خالی است.');

  const productIds = items.map((item) => item.product.id!) as string[];

  const { data: latestProducts, error: stockError } = await supabase
    .from('products')
    .select('id, name, price, amazing_price, amazing_ends_at, is_featured, stock, image_url, is_out_of_stock')
    .in('id', productIds);

  if (stockError) throw stockError;

  const latestMap = new Map((latestProducts || []).map((product: any) => [product.id, product]));

  for (const item of items) {
    const latest = latestMap.get(item.product.id!);
    if (!latest) throw new Error(`محصول ${item.product.name} پیدا نشد.`);
    if (latest.is_out_of_stock || Number(latest.stock || 0) < item.quantity) {
      throw new Error(`موجودی ${latest.name || item.product.name} کافی نیست.`);
    }
  }

  const normalizedItems = items.map((item) => {
    const latest = latestMap.get(item.product.id!) || item.product;
    const product = { ...item.product, ...latest } as Product;
    const unitPrice = getProductFinalPrice(product);
    return {
      product,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    };
  });

  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemsCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: makeOrderNumber(),
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_address: input.customerAddress || null,
      customer_car: input.customerCar || null,
      note: input.note || null,
      status: 'pending_payment',
      payment_status: 'unpaid',
      total_amount: totalAmount,
      items_count: itemsCount,
      items: normalizedItems.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image_url: item.product.image_url || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      })),
    })
    .select()
    .single();

  if (orderError) throw orderError;

  await logSmsEvent({
    template_key: 'order_created',
    related_type: 'order',
    phone: input.customerPhone,
    related_id: order.id,
    message: `مشتری گرامی، سفارش شما با شماره ${order.order_number} در Carrtell ثبت شد و در انتظار بررسی است.`,
  });

  // ثبت اعلان داخلی برای پنل مدیریت. ارسال SMS واقعی در مرحله اتصال پنل پیامکی فعال می‌شود.
  await supabase.from('admin_notifications').insert({
    type: 'new_order',
    title: 'سفارش جدید ثبت شد',
    message: `سفارش ${order.order_number} به مبلغ ${totalAmount} تومان ثبت شد.`,
    order_id: order.id,
    is_read: false,
  }).then(() => undefined);

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification('Carrtell | سفارش جدید', { body: `سفارش ${order.order_number} ثبت شد.` });
      }
    } catch {
      // ignore browser notification errors
    }
  }

  const orderItems = normalizedItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_image_url: item.product.image_url || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  // موجودی فقط پس از تأیید قطعی پرداخت و داخل تابع اتمیک دیتابیس کم می‌شود.


  return order as Order;
}


export type OrderPaymentSnapshot = {
  order: Order;
  items: OrderItem[];
};

function normalizeEmbeddedOrderItems(order: Order): OrderItem[] {
  const rawItems = Array.isArray(order.items) ? order.items : [];
  return rawItems
    .map((raw: any, index) => {
      const quantity = Math.max(0, Number(raw?.quantity || 0));
      const unitPrice = Math.max(0, Number(raw?.unit_price ?? raw?.price ?? 0));
      if (!quantity || !String(raw?.name || raw?.product_name || '').trim()) return null;
      return {
        id: String(raw?.order_item_id || raw?.id || `embedded-${index}`),
        order_id: order.id,
        product_id: String(raw?.product_id || raw?.id || ''),
        product_name: String(raw?.product_name || raw?.name || 'کالای سفارش'),
        product_image_url: raw?.product_image_url || raw?.image_url || raw?.image || null,
        quantity,
        unit_price: unitPrice,
        total_price: Math.max(0, Number(raw?.total_price ?? unitPrice * quantity)),
      } as OrderItem;
    })
    .filter(Boolean) as OrderItem[];
}

export async function getOrderPaymentSnapshot(orderId: string): Promise<OrderPaymentSnapshot> {
  const { data, error } = await supabase.rpc('carrtell_get_order_payment_snapshot', {
    p_order_id: orderId,
  });

  if (!error && data && typeof data === 'object') {
    const snapshot = data as any;
    const order = snapshot.order as Order;
    const items = Array.isArray(snapshot.items) ? snapshot.items as OrderItem[] : [];
    if (order?.id) return { order, items };
  }

  const order = await getOrder(orderId);
  const tableItems = await getOrderItems(orderId).catch(() => [] as OrderItem[]);
  const embeddedItems = normalizeEmbeddedOrderItems(order);
  return { order, items: tableItems.length ? tableItems : embeddedItems };
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Order[];
}

export async function getOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as OrderItem[];
}

export async function getOrderItemsForOrders(orderIds: string[]) {
  if (!orderIds.length) return {} as Record<string, OrderItem[]>;
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).reduce<Record<string, OrderItem[]>>((grouped, item) => {
    const key = String(item.order_id);
    (grouped[key] ||= []).push(item as OrderItem);
    return grouped;
  }, {});
}

export async function replaceOrderItems(orderId: string, items: Array<Pick<OrderItem, 'product_id'|'product_name'|'product_image_url'|'quantity'|'unit_price'>>, note = 'ویرایش اقلام از پنل مدیریت') {
  const { data, error } = await supabase.rpc('carrtell_admin_replace_order_items', { p_order_id: orderId, p_items: items, p_note: note });
  if (error) throw error;
  return data as { order: Order; items: OrderItem[]; wallet_credit: number };
}

export async function assignOrderTechnician(orderId: string, technicianId: string | null) {
  const { data, error } = await supabase.rpc('carrtell_assign_order_technician', { p_order_id: orderId, p_technician_id: technicianId || null });
  if (error) throw error;
  return data as Order;
}

export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrdersByPhone(phone: string) {
  const normalized = phone.trim();
  if (!normalized) return [] as Order[];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_phone', normalized)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Order[];
}

export async function getOrderWithItems(orderId: string) {
  return getOrderPaymentSnapshot(orderId);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  const order = data as Order;

  const statusText: Record<OrderStatus, string> = {
    pending_payment: 'در انتظار پرداخت',
    paid: 'پرداخت شده',
    pending_review: 'در انتظار بررسی',
    pending: 'در انتظار بررسی',
    confirmed: 'تأیید شده',
    processing: 'در حال آماده‌سازی',
    sent: 'ارسال شده',
    completed: 'تحویل شده',
    cancelled: 'لغو شده',
  };

  await logSmsEvent({
    template_key: status === 'completed' ? 'review_request' : 'order_status_changed',
    related_type: 'order',
    phone: order.customer_phone,
    related_id: order.id,
    message: status === 'completed'
      ? `سفارش ${order.order_number} تحویل شد. لطفاً نظر خود را ثبت کنید: ${makeReviewLink(order.id)}`
      : `وضعیت سفارش ${order.order_number} به «${statusText[status]}» تغییر کرد. Carrtell`,
  });

  return order;
}

export function exportCustomerPhonesCsv(orders: Order[]) {
  const unique = new Map<string, Order>();
  orders.forEach((order) => {
    const phone = (order.customer_phone || '').trim();
    if (phone && !unique.has(phone)) unique.set(phone, order);
  });

  const rows = [
    ['شماره موبایل', 'نام مشتری', 'آخرین شماره سفارش', 'آخرین مبلغ سفارش', 'آخرین وضعیت'],
    ...Array.from(unique.values()).map((order) => [
      order.customer_phone || '',
      order.customer_name || '',
      order.order_number || '',
      String(order.total_amount || 0),
      order.status || '',
    ]),
  ];

  const csv = '\ufeff' + rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `carrtell-customer-phones-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
