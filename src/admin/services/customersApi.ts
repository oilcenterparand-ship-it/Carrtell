import { supabase } from '../../lib/supabase';
import type { OrderStatus } from './ordersApi';

export type CustomerContact = {
  phone: string;
  name: string;
  last_car?: string | null;
  last_address?: string | null;
  orders_count: number;
  total_spent: number;
  last_order_at?: string | null;
  last_order_status?: OrderStatus | string | null;
  addresses_count: number;
  default_city?: string | null;
  default_district?: string | null;
};

type RawOrder = {
  customer_phone?: string | null;
  customer_name?: string | null;
  customer_car?: string | null;
  customer_address?: string | null;
  total_amount?: number | null;
  status?: OrderStatus | string | null;
  created_at?: string | null;
};

type RawAddress = {
  customer_phone?: string | null;
  city?: string | null;
  district?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
};

function cleanPhone(phone?: string | null) {
  return (phone || '').replace(/\s|-/g, '').trim();
}

export async function getCustomerContacts(): Promise<CustomerContact[]> {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('customer_phone, customer_name, customer_car, customer_address, total_amount, status, created_at')
    .order('created_at', { ascending: false });

  if (ordersError) throw ordersError;

  let addresses: RawAddress[] = [];
  const { data: addressRows } = await supabase
    .from('customer_addresses')
    .select('customer_phone, city, district, is_default, created_at')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  addresses = (addressRows || []) as RawAddress[];

  const addressMap = new Map<string, RawAddress[]>();
  addresses.forEach((address) => {
    const phone = cleanPhone(address.customer_phone);
    if (!phone) return;
    addressMap.set(phone, [...(addressMap.get(phone) || []), address]);
  });

  const map = new Map<string, CustomerContact>();

  ((orders || []) as RawOrder[]).forEach((order) => {
    const phone = cleanPhone(order.customer_phone);
    if (!phone) return;

    const existing = map.get(phone);
    if (!existing) {
      const customerAddresses = addressMap.get(phone) || [];
      const defaultAddress = customerAddresses.find((item) => item.is_default) || customerAddresses[0];
      map.set(phone, {
        phone,
        name: order.customer_name || 'مشتری بدون نام',
        last_car: order.customer_car || null,
        last_address: order.customer_address || null,
        orders_count: 1,
        total_spent: Number(order.total_amount || 0),
        last_order_at: order.created_at || null,
        last_order_status: order.status || null,
        addresses_count: customerAddresses.length,
        default_city: defaultAddress?.city || null,
        default_district: defaultAddress?.district || null,
      });
      return;
    }

    existing.orders_count += 1;
    existing.total_spent += Number(order.total_amount || 0);

    const currentLast = existing.last_order_at ? new Date(existing.last_order_at).getTime() : 0;
    const orderDate = order.created_at ? new Date(order.created_at).getTime() : 0;
    if (orderDate >= currentLast) {
      existing.name = order.customer_name || existing.name;
      existing.last_car = order.customer_car || existing.last_car;
      existing.last_address = order.customer_address || existing.last_address;
      existing.last_order_at = order.created_at || existing.last_order_at;
      existing.last_order_status = order.status || existing.last_order_status;
    }
  });

  addresses.forEach((address) => {
    const phone = cleanPhone(address.customer_phone);
    if (!phone || map.has(phone)) return;
    const customerAddresses = addressMap.get(phone) || [];
    const defaultAddress = customerAddresses.find((item) => item.is_default) || customerAddresses[0];
    map.set(phone, {
      phone,
      name: 'مشتری بدون سفارش',
      orders_count: 0,
      total_spent: 0,
      last_order_at: null,
      last_order_status: null,
      addresses_count: customerAddresses.length,
      default_city: defaultAddress?.city || null,
      default_district: defaultAddress?.district || null,
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    const aTime = a.last_order_at ? new Date(a.last_order_at).getTime() : 0;
    const bTime = b.last_order_at ? new Date(b.last_order_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function customerContactsToCsv(customers: CustomerContact[]) {
  const headers = [
    'نام مشتری',
    'شماره موبایل',
    'خودرو',
    'شهر',
    'محله',
    'تعداد سفارش',
    'مجموع خرید',
    'آخرین وضعیت سفارش',
    'آخرین تاریخ سفارش',
    'تعداد آدرس ذخیره‌شده',
    'آخرین آدرس',
  ];

  const rows = customers.map((customer) => [
    customer.name,
    customer.phone,
    customer.last_car || '',
    customer.default_city || '',
    customer.default_district || '',
    customer.orders_count,
    customer.total_spent,
    customer.last_order_status || '',
    customer.last_order_at ? new Date(customer.last_order_at).toLocaleString('fa-IR') : '',
    customer.addresses_count,
    customer.last_address || '',
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
