import { supabase } from '../../lib/supabase';

export type AdminKpiSummary = {
  todaySales: number;
  monthSales: number;
  todayOrders: number;
  activeServices: number;
  newCustomers: number;
  lowStockProducts: number;
  pendingOrders: number;
  averageOrderValue: number;
  unpaidOrders: number;
  unapprovedReviews: number;
};

export type SalesChartPoint = { date: string; sales: number };

export type ActiveServiceItem = {
  id: string;
  customer_name?: string | null;
  vehicle_title?: string | null;
  service_title?: string | null;
  assigned_to_name?: string | null;
  status?: string | null;
  scheduled_date?: string | null;
  created_at?: string | null;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const sumAmount = (rows: any[]) => rows.reduce((sum, row) => sum + Number(row.total_amount ?? row.total ?? row.amount ?? 0), 0);

export async function getAdminKpiSummary(): Promise<AdminKpiSummary> {
  const today = startOfToday();
  const month = startOfMonth();

  const [todayOrders, monthOrders, pendingOrders, profiles, lowStock, reviews, activeServices] = await Promise.all([
    supabase.from('orders').select('id,total_amount,total,amount,status,created_at').gte('created_at', today),
    supabase.from('orders').select('id,total_amount,total,amount,status,created_at').gte('created_at', month),
    supabase.from('orders').select('id,status').in('status', ['pending_review', 'pending_payment', 'pending', 'processing']),
    supabase.from('profiles').select('id,created_at').gte('created_at', month),
    supabase.from('products').select('id,stock,min_stock,is_active').lte('stock', 5),
    supabase.from('customer_reviews').select('id,is_approved').eq('is_approved', false),
    supabase.from('service_requests').select('id,status').in('status', ['pending', 'confirmed', 'assigned', 'accepted', 'en_route', 'in_progress']),
  ]);

  const successfulToday = (todayOrders.data ?? []).filter((o: any) => ['paid', 'processing', 'completed', 'delivered', 'confirmed', 'sent'].includes(o.status));
  const successfulMonth = (monthOrders.data ?? []).filter((o: any) => ['paid', 'processing', 'completed', 'delivered', 'confirmed', 'sent'].includes(o.status));
  const monthSales = sumAmount(successfulMonth);

  return {
    todaySales: sumAmount(successfulToday),
    monthSales,
    todayOrders: (todayOrders.data ?? []).length,
    activeServices: (activeServices.data ?? []).length,
    newCustomers: (profiles.data ?? []).length,
    lowStockProducts: (lowStock.data ?? []).length,
    pendingOrders: (pendingOrders.data ?? []).length,
    averageOrderValue: successfulMonth.length ? monthSales / successfulMonth.length : 0,
    unpaidOrders: (pendingOrders.data ?? []).filter((o: any) => ['pending_payment', 'pending'].includes(o.status)).length,
    unapprovedReviews: (reviews.data ?? []).length,
  };
}

export async function getSalesChart(days = 14): Promise<SalesChartPoint[]> {
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('id,total_amount,total,amount,status,created_at')
    .gte('created_at', from.toISOString())
    .in('status', ['paid', 'processing', 'completed', 'delivered', 'confirmed', 'sent'])
    .order('created_at', { ascending: true });

  if (error) return [];

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of data ?? []) {
    const key = String(row.created_at).slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(row.total_amount ?? row.total ?? row.amount ?? 0));
  }

  return Array.from(buckets.entries()).map(([date, sales]) => ({ date, sales }));
}

export async function getOperationalAlerts() {
  const [orders, products, payments, reviews] = await Promise.all([
    supabase.from('orders').select('id,status,created_at,total_amount,total').in('status', ['pending_review', 'pending_payment', 'pending']),
    supabase.from('products').select('id,name,stock,min_stock').lte('stock', 5),
    supabase.from('payments').select('id,status,amount,created_at').in('status', ['failed', 'pending']),
    supabase.from('customer_reviews').select('id,customer_name,rating,created_at').eq('is_approved', false),
  ]);

  return {
    orders: orders.data ?? [],
    products: products.data ?? [],
    payments: payments.data ?? [],
    reviews: reviews.data ?? [],
  };
}

export async function getActiveServices(limit = 5): Promise<ActiveServiceItem[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .in('status', ['pending', 'confirmed', 'assigned', 'accepted', 'en_route', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((item: any) => ({
    id: String(item.id),
    customer_name: item.customer_name ?? item.full_name ?? null,
    vehicle_title: item.vehicle_title ?? item.car_title ?? item.vehicle_name ?? item.car_model ?? null,
    service_title: item.service_title ?? item.service_name ?? item.title ?? null,
    assigned_to_name: item.assigned_to_name ?? item.driver_name ?? item.technician_name ?? null,
    status: item.status ?? null,
    scheduled_date: item.scheduled_date ?? item.service_date ?? null,
    created_at: item.created_at ?? null,
  }));
}

export async function getInvestorReportData() {
  const [serviceRequests, orders, profiles] = await Promise.all([
    supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
  ]);

  const services = serviceRequests.data ?? [];
  const completedServices = services.filter((s: any) => ['completed', 'done', 'delivered'].includes(s.status));
  const paidOrders = (orders.data ?? []).filter((o: any) => ['paid', 'processing', 'completed', 'delivered'].includes(o.status));
  const totalSales = sumAmount(paidOrders);

  return {
    totalServices: services.length,
    completedServices: completedServices.length,
    totalOrders: (orders.data ?? []).length,
    paidOrders: paidOrders.length,
    totalSales,
    customers: (profiles.data ?? []).filter((p: any) => p.role === 'customer').length,
    drivers: (profiles.data ?? []).filter((p: any) => p.role === 'driver').length,
    recentServices: services.slice(0, 10),
  };
}
