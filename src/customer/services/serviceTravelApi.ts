import { supabase } from '../../lib/supabase';

export type ServiceTravelEstimate = {
  quote_id: string;
  route_distance_meters: number;
  route_distance_km: number;
  billable_distance_km: number;
  base_fee: number;
  distance_fee: number;
  traffic_surcharge: number;
  traffic_surcharge_percent: number;
  traffic_zone: boolean;
  total_fee: number;
  radius_from_tehran_center_km: number;
  duration_seconds?: number;
  route_source?: 'routing-traffic' | 'distance-matrix-traffic';
};

const travelErrorMessages: Record<string, string> = {
  pricing_schema_unavailable: 'تنظیمات محاسبه کرایه هنوز روی سرور نصب نشده است.',
  travel_quote_schema_unavailable: 'جدول ثبت کرایه هنوز روی سرور نصب نشده است.',
  neshan_key_invalid: 'کلید وب‌سرویس نشان معتبر نیست.',
  neshan_limit_exceeded: 'اعتبار یا سقف مصرف وب‌سرویس نشان تمام شده است.',
  neshan_rate_exceeded: 'تعداد درخواست‌های نشان بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.',
  neshan_key_type_invalid: 'نوع کلید نشان برای وب‌سرویس مسیریابی مناسب نیست.',
  neshan_whitelist_rejected: 'محدودیت دسترسی کلید نشان، درخواست سرور را رد کرده است.',
  neshan_routing_not_enabled: 'سرویس مسیریابی برای کلید نشان فعال نشده است.',
  route_distance_missing: 'فاصله مسیر از پاسخ نشان دریافت نشد.',
  route_service_unavailable: 'وب‌سرویس مسیریابی نشان در دسترس نیست.',
};

async function readFunctionErrorCode(error: unknown): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { error?: unknown };
      return String(payload?.error || '');
    } catch {
      return '';
    }
  }
  return '';
}

export async function estimateServiceTravel(latitude: number, longitude: number): Promise<ServiceTravelEstimate> {
  const { data, error } = await supabase.functions.invoke('service-travel-estimate', {
    body: { latitude, longitude },
  });
  if (error) {
    const serverCode = await readFunctionErrorCode(error);
    if (travelErrorMessages[serverCode]) throw new Error(travelErrorMessages[serverCode]);
    const raw = String(error.message || '').toLowerCase();
    if (raw.includes('failed to send') || raw.includes('edge function') || raw.includes('fetch')) {
      throw new Error('سرویس محاسبه کرایه در دسترس نیست. لطفاً چند لحظه دیگر دوباره موقعیت را تأیید کنید.');
    }
    throw new Error(error.message || 'محاسبه کرایه مسیر انجام نشد.');
  }
  if (!data?.ok) {
    if (data?.error === 'outside_service_area') throw new Error('این موقعیت خارج از محدوده ۴۰ کیلومتری خدمات تهران است.');
    throw new Error(travelErrorMessages[String(data?.error)] || String(data?.message || 'محاسبه کرایه مسیر انجام نشد.'));
  }
  return data.estimate as ServiceTravelEstimate;
}
