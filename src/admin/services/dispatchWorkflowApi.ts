import { supabase } from '../../lib/supabase';

export async function getDispatchJobs() {
  const { data, error } = await supabase
    .from('service_jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function assignDriverToJob(jobId: string, driverId: string, fleetVehicleId?: string | null) {
  const { data, error } = await supabase
    .from('service_jobs')
    .update({
      driver_id: driverId,
      fleet_vehicle_id: fleetVehicleId ?? null,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select('*')
    .single();
  if (error) throw error;

  if (data?.order_id) {
    await supabase.from('orders').update({ status: 'assigned' }).eq('id', data.order_id);
    await supabase.from('order_events').insert({
      order_id: data.order_id,
      status: 'assigned',
      title: 'سرویس‌کار اختصاص داده شد',
      description: 'مأموریت برای سرویس‌کار ارسال شد.',
    });
  }

  return data;
}

export async function createServiceJobFromOrderId(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (orderError) throw orderError;

  const { data: existing } = await supabase
    .from('service_jobs')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('service_jobs')
    .insert({
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
      total_amount: order.total_amount ?? order.total ?? 0,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
