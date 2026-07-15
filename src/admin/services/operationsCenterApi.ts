import { supabase } from '../../lib/supabase';

type AnyRow = Record<string, any>;

const rows = (result: any): AnyRow[] => result?.data ?? [];
const amount = (row: AnyRow) => Number(row.total_amount ?? row.total ?? row.amount ?? row.final_amount ?? 0);
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); };

export type OperationsAlert = {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count: number;
  path: string;
};

export type OperationsSnapshot = {
  updatedAt: string;
  metrics: {
    todaySales: number;
    monthSales: number;
    todayOrders: number;
    pendingOrders: number;
    todayServices: number;
    activeServices: number;
    completedServices: number;
    lowStock: number;
    newCustomers: number;
    pendingReviews: number;
  };
  urgentOrders: AnyRow[];
  activeServices: AnyRow[];
  completedToday: AnyRow[];
  readyOrders: AnyRow[];
  lowStockProducts: AnyRow[];
  recentReviews: AnyRow[];
  productIssues: AnyRow[];
  roleCounts: Record<string, number>;
  health: { vehicles: number; records: number; dueSoon: number };
  alerts: OperationsAlert[];
};

export async function getOperationsSnapshot(): Promise<OperationsSnapshot> {
  const today = startOfToday();
  const month = startOfMonth();
  const calls = await Promise.allSettled([
    supabase.from('orders').select('*').gte('created_at', today).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').gte('created_at', month),
    supabase.from('orders').select('*').in('status', ['pending', 'pending_review', 'pending_payment', 'processing', 'ready', 'ready_to_ship']).order('created_at', { ascending: true }),
    supabase.from('service_requests').select('*').gte('created_at', today).order('created_at', { ascending: false }),
    supabase.from('service_requests').select('*').in('status', ['assigned', 'on_the_way', 'arrived', 'in_progress', 'processing']).order('created_at', { ascending: false }),
    supabase.from('products').select('id,name,stock,min_stock,image_url,category_id,brand_id,compatible_car_ids,all_cars,is_active,cost_price,price').order('stock', { ascending: true }),
    supabase.from('customer_reviews').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('profiles').select('id,role,created_at').gte('created_at', month),
    supabase.from('profiles').select('role'),
    supabase.from('user_cars').select('id,current_mileage,next_service_mileage'),
    supabase.from('vehicle_service_records').select('id,next_service_mileage,current_mileage,service_date'),
  ]);

  const result = (index: number) => calls[index].status === 'fulfilled'
    ? (calls[index] as PromiseFulfilledResult<any>).value
    : { data: [] };

  const todayOrders = rows(result(0));
  const monthOrders = rows(result(1));
  const openOrders = rows(result(2));
  const todayServices = rows(result(3));
  const activeServices = rows(result(4));
  const products = rows(result(5));
  const reviews = rows(result(6));
  const newProfiles = rows(result(7));
  const profiles = rows(result(8));
  const cars = rows(result(9));
  const serviceRecords = rows(result(10));

  const paidStatuses = ['paid', 'processing', 'completed', 'delivered', 'ready', 'ready_to_ship'];
  const completedServiceStatuses = ['completed', 'done', 'delivered'];
  const roleCounts = profiles.reduce<Record<string, number>>((acc, profile) => {
    const role = profile.role || 'customer';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const lowStockProducts = products.filter(product => Number(product.stock ?? 0) <= Number(product.min_stock ?? 5));
  const productIssues = products
    .filter(product => !product.image_url || !product.category_id || (!product.all_cars && !(product.compatible_car_ids?.length)))
    .slice(0, 20);
  const pendingReviews = reviews.filter(review => review.is_approved === false);
  const dueSoon = cars.filter(car => {
    const current = Number(car.current_mileage || 0);
    const next = Number(car.next_service_mileage || 0);
    return next > 0 && next - current <= 1000;
  }).length;

  const urgentOrders = openOrders.filter(order => ['pending', 'pending_review', 'pending_payment'].includes(order.status));
  const readyOrders = openOrders.filter(order => ['ready', 'ready_to_ship'].includes(order.status));

  const alerts: OperationsAlert[] = [
    urgentOrders.length > 0 ? {
      id: 'urgent-orders', level: urgentOrders.length >= 5 ? 'critical' : 'warning', title: 'سفارش‌های نیازمند رسیدگی',
      description: 'سفارش‌هایی که هنوز تأیید یا پرداخت نشده‌اند.', count: urgentOrders.length, path: '/admin/orders',
    } : null,
    lowStockProducts.length > 0 ? {
      id: 'low-stock', level: lowStockProducts.length >= 10 ? 'critical' : 'warning', title: 'موجودی رو به اتمام',
      description: 'محصولاتی که به حداقل موجودی رسیده‌اند.', count: lowStockProducts.length, path: '/admin/inventory',
    } : null,
    pendingReviews.length > 0 ? {
      id: 'pending-reviews', level: 'info', title: 'نظرهای منتظر تأیید',
      description: 'بازخوردهایی که هنوز توسط مدیر بررسی نشده‌اند.', count: pendingReviews.length, path: '/admin/reviews',
    } : null,
    productIssues.length > 0 ? {
      id: 'catalog-issues', level: 'warning', title: 'نقص اطلاعات محصولات',
      description: 'محصولاتی که تصویر، دسته‌بندی یا سازگاری خودرو ندارند.', count: productIssues.length, path: '/admin/products',
    } : null,
    dueSoon > 0 ? {
      id: 'service-due', level: 'info', title: 'موعد سرویس نزدیک',
      description: 'خودروهایی که کمتر از ۱۰۰۰ کیلومتر تا سرویس بعدی فاصله دارند.', count: dueSoon, path: '/admin/health-records',
    } : null,
  ].filter((item): item is OperationsAlert => Boolean(item));

  return {
    updatedAt: new Date().toISOString(),
    metrics: {
      todaySales: todayOrders.filter(order => paidStatuses.includes(order.status)).reduce((sum, order) => sum + amount(order), 0),
      monthSales: monthOrders.filter(order => paidStatuses.includes(order.status)).reduce((sum, order) => sum + amount(order), 0),
      todayOrders: todayOrders.length,
      pendingOrders: openOrders.length,
      todayServices: todayServices.length,
      activeServices: activeServices.length,
      completedServices: todayServices.filter(service => completedServiceStatuses.includes(service.status)).length,
      lowStock: lowStockProducts.length,
      newCustomers: newProfiles.filter(profile => (profile.role || 'customer') === 'customer').length,
      pendingReviews: pendingReviews.length,
    },
    urgentOrders: urgentOrders.slice(0, 12),
    activeServices: activeServices.slice(0, 12),
    completedToday: todayServices.filter(service => completedServiceStatuses.includes(service.status)).slice(0, 12),
    readyOrders: readyOrders.slice(0, 12),
    lowStockProducts: lowStockProducts.slice(0, 12),
    recentReviews: reviews.slice(0, 10),
    productIssues,
    roleCounts,
    health: { vehicles: cars.length, records: serviceRecords.length, dueSoon },
    alerts,
  };
}
