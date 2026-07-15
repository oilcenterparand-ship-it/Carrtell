import type { Order, OrderItem } from '../admin/services/ordersApi';

function toFa(value: number | string) {
  return Number(value || 0).toLocaleString('fa-IR');
}

function formatPrice(value: number | string) {
  return `${toFa(value)} تومان`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function makePdfFromJpegDataUrl(dataUrl: string, width: number, height: number) {
  const encoder = new TextEncoder();
  const imageBytes = base64ToBytes(dataUrl.split(',')[1]);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 24;
  const imageRatio = width / height;
  let drawWidth = pageWidth - margin * 2;
  let drawHeight = drawWidth / imageRatio;
  if (drawHeight > pageHeight - margin * 2) {
    drawHeight = pageHeight - margin * 2;
    drawWidth = drawHeight * imageRatio;
  }
  const x = (pageWidth - drawWidth) / 2;
  const y = pageHeight - margin - drawHeight;
  const content = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ`;

  const parts: (string | Uint8Array)[] = [];
  const offsets: number[] = [];
  let length = 0;
  const add = (part: string | Uint8Array) => {
    parts.push(part);
    length += typeof part === 'string' ? encoder.encode(part).length : part.length;
  };
  const obj = (id: number, body: (string | Uint8Array)[]) => {
    offsets[id] = length;
    add(`${id} 0 obj\n`);
    body.forEach(add);
    add('\nendobj\n');
  };

  add('%PDF-1.4\n%Carrtell\n');
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  obj(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`]);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`, imageBytes, '\nendstream']);
  obj(5, [`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`]);

  const xrefOffset = length;
  add('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i += 1) add(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}

export function downloadInvoicePdf(order: Order, items: OrderItem[]) {
  const width = 1200;
  const height = Math.max(1500, 760 + items.length * 78);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.font = 'bold 44px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('فاکتور فروش Carrtell', 1120, 90);

  ctx.font = '26px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`شماره سفارش: ${order.order_number}`, 1120, 140);
  ctx.fillText(`تاریخ: ${formatDate(order.created_at)}`, 1120, 180);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(80, 220, 1040, 6);

  ctx.font = 'bold 28px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('اطلاعات مشتری', 1120, 290);
  ctx.font = '24px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`نام: ${order.customer_name || '-'}`, 1120, 335);
  ctx.fillText(`موبایل: ${order.customer_phone || '-'}`, 1120, 375);
  ctx.fillText(`خودرو: ${order.customer_car || '-'}`, 1120, 415);
  ctx.fillText(`آدرس: ${order.customer_address || '-'}`, 1120, 455);

  let y = 530;
  ctx.fillStyle = '#111827';
  ctx.fillRect(80, y, 1040, 58);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('محصول', 1100, y + 38);
  ctx.fillText('تعداد', 560, y + 38);
  ctx.fillText('قیمت واحد', 410, y + 38);
  ctx.fillText('جمع', 210, y + 38);
  y += 70;

  ctx.font = '22px Vazirmatn, Tahoma, sans-serif';
  items.forEach((item, index) => {
    ctx.fillStyle = index % 2 ? '#f8fafc' : '#ffffff';
    ctx.fillRect(80, y - 8, 1040, 64);
    ctx.fillStyle = '#111827';
    ctx.fillText(item.product_name, 1100, y + 30);
    ctx.fillText(toFa(item.quantity), 560, y + 30);
    ctx.fillText(formatPrice(item.unit_price), 410, y + 30);
    ctx.fillText(formatPrice(item.total_price), 210, y + 30);
    y += 72;
  });

  y += 35;
  ctx.fillStyle = '#111827';
  ctx.fillRect(80, y, 1040, 86);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 32px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(`مبلغ کل: ${formatPrice(order.total_amount)}`, 1100, y + 54);

  ctx.fillStyle = '#64748b';
  ctx.font = '20px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('این فاکتور توسط سیستم Carrtell صادر شده است.', 1120, height - 70);

  const blob = makePdfFromJpegDataUrl(canvas.toDataURL('image/jpeg', 0.92), width, height);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Carrtell-Invoice-${order.order_number || order.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
