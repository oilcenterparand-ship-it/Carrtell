import { supabase } from '../../lib/supabase';

export type AdminOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'pending_review'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'sent'
  | 'completed'
  | 'cancelled';

export type AdminOrderSummary = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_car?: string | null;
  status: AdminOrderStatus;
  payment_status?: string | null;
  total_amount: number;
  items_count: number;
  created_at: string;
};

export type AdminOrderStats = {
  total: number;
  pendingReview: number;
  processing: number;
  completed: number;
  cancelled: number;
  today: number;
  totalAmount: number;
};

export const PENDING_ORDER_STATUSES: AdminOrderStatus[] = ['pending_review', 'pending', 'paid'];

export function isPendingReviewStatus(status?: string | null) {
  return status === 'pending_review' || status === 'pending' || status === 'paid';
}

export async function getAdminOrderSummaries(limit = 8) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, customer_car, status, payment_status, total_amount, items_count, created_at')
    .in('status', PENDING_ORDER_STATUSES)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as AdminOrderSummary[];
}

export async function getAdminOrderStats() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, created_at');

  if (error) throw error;

  const orders = data || [];
  const todayKey = new Date().toLocaleDateString('en-CA');

  return orders.reduce<AdminOrderStats>((stats, order: any) => {
    const status = order.status as AdminOrderStatus;
    const createdKey = order.created_at ? new Date(order.created_at).toLocaleDateString('en-CA') : '';

    stats.total += 1;
    stats.totalAmount += Number(order.total_amount || 0);
    if (createdKey === todayKey) stats.today += 1;
    if (isPendingReviewStatus(status)) stats.pendingReview += 1;
    if (status === 'processing' || status === 'confirmed') stats.processing += 1;
    if (status === 'completed') stats.completed += 1;
    if (status === 'cancelled') stats.cancelled += 1;
    return stats;
  }, {
    total: 0,
    pendingReview: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    totalAmount: 0,
  });
}

/**
 * Stable admin order refresh.
 *
 * Previous patches used a Supabase realtime channel named `admin-orders-*`.
 * In some HMR / React refresh situations the channel could be subscribed first
 * and then receive `postgres_changes` callbacks afterwards, which Supabase rejects with:
 * "cannot add postgres_changes callbacks ... after subscribe()".
 *
 * To keep the admin panel stable, this function now uses safe polling plus a
 * visibility/focus refresh. It preserves the same public API used by existing pages.
 */
export function subscribeToOrders(onChange: () => void) {
  let disposed = false;

  const safeChange = () => {
    if (!disposed) onChange();
  };

  const intervalId = window.setInterval(safeChange, 15000);

  const handleFocus = () => safeChange();
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') safeChange();
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    disposed = true;
    window.clearInterval(intervalId);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
