import { sendSmsByTemplate } from '../admin/services/smsApi';

export function orderStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    pending_review: 'در انتظار بررسی',
    preparing: 'در حال آماده‌سازی',
    shipped: 'ارسال شده',
    delivered: 'تحویل شده',
    cancelled: 'لغو شده',
    paid: 'پرداخت شده',
  };
  return labels[String(status ?? '')] ?? String(status ?? 'نامشخص');
}

export async function notifyOrderCreated(order: { id: string; phone?: string | null; customer_phone?: string | null; order_code?: string | number | null }) {
  const phone = order.phone ?? order.customer_phone;
  if (!phone) return null;
  return sendSmsByTemplate({
    phone,
    template_key: 'order_created',
    related_type: 'order',
    related_id: order.id,
    variables: { order_code: order.order_code ?? order.id.slice(0, 8) },
  });
}

export async function notifyOrderStatusChanged(order: { id: string; phone?: string | null; customer_phone?: string | null; status?: string | null; order_code?: string | number | null }) {
  const phone = order.phone ?? order.customer_phone;
  if (!phone) return null;
  return sendSmsByTemplate({
    phone,
    template_key: 'order_status_changed',
    related_type: 'order',
    related_id: order.id,
    variables: {
      order_code: order.order_code ?? order.id.slice(0, 8),
      status_label: orderStatusLabel(order.status),
    },
  });
}

export async function notifyServiceAssigned(service: { id: string; customer_phone?: string | null; phone?: string | null }) {
  const phone = service.customer_phone ?? service.phone;
  if (!phone) return null;
  return sendSmsByTemplate({
    phone,
    template_key: 'service_assigned',
    related_type: 'service_request',
    related_id: service.id,
    variables: { service_code: service.id.slice(0, 8) },
  });
}

export async function notifyServiceOnTheWay(service: { id: string; customer_phone?: string | null; phone?: string | null }) {
  const phone = service.customer_phone ?? service.phone;
  if (!phone) return null;
  return sendSmsByTemplate({
    phone,
    template_key: 'service_on_the_way',
    related_type: 'service_request',
    related_id: service.id,
    variables: { service_code: service.id.slice(0, 8) },
  });
}

export async function notifyServiceCompleted(service: { id: string; customer_phone?: string | null; phone?: string | null }) {
  const phone = service.customer_phone ?? service.phone;
  if (!phone) return null;
  const review_link = `${window.location.origin}/review/${service.id}`;
  return sendSmsByTemplate({
    phone,
    template_key: 'service_completed',
    related_type: 'service_request',
    related_id: service.id,
    variables: { service_code: service.id.slice(0, 8), review_link },
  });
}
