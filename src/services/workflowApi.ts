import { supabase } from '../lib/supabase';

export type WorkflowStatus =
  | 'pending_review'
  | 'pending_payment'
  | 'paid'
  | 'dispatch_pending'
  | 'assigned'
  | 'on_way'
  | 'arrived'
  | 'working'
  | 'completed'
  | 'cancelled';

export const workflowStatusFa: Record<WorkflowStatus, string> = {
  pending_review: 'در انتظار بررسی',
  pending_payment: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  dispatch_pending: 'در صف اعزام',
  assigned: 'اختصاص داده شده',
  on_way: 'در مسیر مشتری',
  arrived: 'رسیده به محل',
  working: 'در حال انجام سرویس',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
};

export async function ensureDispatchForOrder(order: any) {
  if (!order?.id) throw new Error('شناسه سفارش نامعتبر است');

  const { data: existing } = await supabase
    .from('service_jobs')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();

  if (existing) return existing;

  const payload = {
    order_id: order.id,
    customer_id: order.user_id ?? order.customer_id ?? null,
    customer_name: order.customer_name ?? order.name ?? 'مشتری کارتل',
    customer_phone: order.customer_phone ?? order.phone ?? null,
    car_id: order.car_id ?? null,
    car_name: order.car_name ?? order.vehicle_name ?? null,
    address_text: order.address_text ?? order.address ?? null,
    latitude: order.latitude ?? null,
    longitude: order.longitude ?? null,
    status: 'dispatch_pending',
    scheduled_at: order.scheduled_at ?? null,
    total_amount: order.total_amount ?? order.total ?? 0,
  };

  const { data, error } = await supabase
    .from('service_jobs')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  await supabase.from('order_events').insert({
    order_id: order.id,
    status: 'dispatch_pending',
    title: 'ارسال به مرکز اعزام',
    description: 'سفارش برای تخصیص سرویس‌کار آماده شد.',
  });

  return data;
}

export async function updateOrderWorkflowStatus(orderId: string, status: WorkflowStatus, title?: string, description?: string) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;

  await supabase.from('order_events').insert({
    order_id: orderId,
    status,
    title: title ?? workflowStatusFa[status],
    description: description ?? null,
  });
}

export async function getOrderTimeline(orderId: string) {
  const { data, error } = await supabase
    .from('order_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
