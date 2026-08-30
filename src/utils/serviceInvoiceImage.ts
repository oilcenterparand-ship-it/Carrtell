import type { ServiceRequest } from '../customer/services/serviceRequestsApi';

function money(value: number) { return `${Number(value || 0).toLocaleString('fa-IR')} تومان`; }

export function downloadServiceInvoiceImage(request: ServiceRequest) {
  const breakdown = request.pricing_breakdown || {};
  const lines: Array<[string, string]> = [
    ['شماره درخواست', request.request_number || '-'],
    ['مشتری', request.customer_name || '-'],
    ['موبایل', request.customer_phone || '-'],
    ['خودرو', request.vehicle_title || '-'],
    ['سرویس', request.service_title || '-'],
    ['تاریخ', request.preferred_date || '-'],
    ['ساعت', request.booking_slot_label || request.preferred_time || '-'],
    ['آدرس', request.address_text || '-'],
    ['فاصله مسیر', `${Number(breakdown.routeDistanceKm || 0).toLocaleString('fa-IR')} کیلومتر`],
    ['هزینه رفت‌وآمد', money(Number(breakdown.travel || 0))],
    ...(Number(breakdown.trafficSurcharge || 0) > 0 ? [['افزایش محدوده طرح ترافیک', money(Number(breakdown.trafficSurcharge || 0))] as [string, string]] : []),
    ['شماره پیگیری پرداخت', request.payment_reference || '-'],
  ];
  const width = 1080;
  const height = Math.max(1700, 500 + lines.length * 115);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ساخت تصویر فاکتور در این مرورگر ممکن نیست.');

  ctx.fillStyle = '#07111f';
  ctx.fillRect(0, 0, width, height);
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 58px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('فاکتور رزرو سرویس Carrtell', 980, 120);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(80, 170, 920, 6);

  let y = 270;
  for (const [label, value] of lines) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 28px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText(label, 980, y);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 31px Vazirmatn, Tahoma, sans-serif';
    const text = String(value);
    const max = 820;
    if (ctx.measureText(text).width <= max) ctx.fillText(text, 980, y + 48);
    else {
      const chunks = text.match(/.{1,38}(?:\s|$)/g) || [text];
      chunks.slice(0, 2).forEach((chunk, index) => ctx.fillText(chunk.trim(), 980, y + 48 + index * 42));
      y += 42;
    }
    y += 115;
  }

  ctx.fillStyle = '#111827';
  y += 15;
  ctx.fillRect(80, y, 920, 145);
  ctx.fillStyle = '#facc15';
  ctx.font = '900 42px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(`مبلغ پرداخت‌شده: ${money(Number(request.estimated_total || 0))}`, 950, y + 85);
  ctx.fillStyle = '#64748b';
  ctx.font = '500 24px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('این فاکتور به‌صورت خودکار توسط Carrtell صادر شده است.', 980, height - 60);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Carrtell-Service-Invoice-${request.request_number || request.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
