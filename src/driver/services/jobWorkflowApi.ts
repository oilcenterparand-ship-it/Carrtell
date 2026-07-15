import { supabase } from '../../lib/supabase';

export const testDriverJob = {
  id: 'test',
  order_id: 'TEST-ORDER',
  status: 'assigned',
  customer_name: 'امین تست',
  customer_phone: '09120000000',
  car_name: 'پژو ۲۰۶ تیپ ۲',
  current_km: 85000,
  address_text: 'پرند، فاز صفر، خیابان تست، پلاک ۱۲',
  service_title: 'تعویض روغن و فیلترها',
  products: [
    { name: 'روغن موتور تست', quantity: 1 },
    { name: 'فیلتر روغن تست', quantity: 1 },
  ],
  driver_notes: '',
};

export async function getDriverJobs(driverId?: string | null) {
  let query = supabase.from('service_jobs').select('*').order('created_at', { ascending: false });
  if (driverId) query = query.eq('driver_id', driverId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getDriverJob(jobId: string) {
  if (jobId === 'test') return testDriverJob;

  const { data, error } = await supabase
    .from('service_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('مأموریت پیدا نشد');
  return data;
}

export async function updateDriverJobStatus(jobId: string, status: string) {
  if (jobId === 'test') return { ...testDriverJob, status };

  const patch: Record<string, any> = { status };
  if (status === 'on_way') patch.started_at = new Date().toISOString();
  if (status === 'arrived') patch.arrived_at = new Date().toISOString();
  if (status === 'working') patch.work_started_at = new Date().toISOString();
  if (status === 'completed') patch.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('service_jobs')
    .update(patch)
    .eq('id', jobId)
    .select('*')
    .single();
  if (error) throw error;

  if (data?.order_id) {
    await supabase.from('orders').update({ status }).eq('id', data.order_id);
    await supabase.from('order_events').insert({
      order_id: data.order_id,
      status,
      title: status === 'completed' ? 'سرویس تکمیل شد' : 'وضعیت سرویس بروزرسانی شد',
      description: null,
    });
  }

  return data;
}

export async function completeDriverJob(jobId: string, payload: { final_km?: number; used_products?: any[]; driver_notes?: string }) {
  if (jobId === 'test') return { ...testDriverJob, status: 'completed', ...payload };

  const { data, error } = await supabase
    .from('service_jobs')
    .update({
      status: 'completed',
      final_km: payload.final_km ?? null,
      used_products: payload.used_products ?? [],
      driver_notes: payload.driver_notes ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select('*')
    .single();
  if (error) throw error;

  if (data?.order_id) {
    await supabase.from('orders').update({ status: 'completed' }).eq('id', data.order_id);
    await supabase.from('order_events').insert({
      order_id: data.order_id,
      status: 'completed',
      title: 'سرویس تکمیل شد',
      description: 'دفترچه سرویس و وضعیت سفارش بروزرسانی شد.',
    });
  }

  if (data?.customer_id && data?.car_id && payload.final_km) {
    await supabase.from('customer_service_records').insert({
      user_id: data.customer_id,
      car_id: data.car_id,
      service_job_id: data.id,
      service_km: payload.final_km,
      used_products: payload.used_products ?? [],
      notes: payload.driver_notes ?? null,
    });
  }

  return data;
}
