import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Copy, Download, ExternalLink, MessageSquare, Minus, PackageCheck, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { formatPrice } from '../services/ordersUtils';
import { assignOrderTechnician, exportCustomerPhonesCsv, getOrderItems, getOrderItemsForOrders, getOrders, replaceOrderItems, updateOrderStatus, type Order, type OrderItem, type OrderStatus } from '../services/ordersApi';
import { getProducts, type Product } from '../services/productsApi';
import { listServiceTechnicians, type ServiceTechnician } from '../services/technicianAdminApi';
import { makeReviewLink } from '../services/smsApi';
import { getWarehouses, updateOrderWarehouse, type Warehouse } from '../services/warehousesApi';

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  pending_review: 'در انتظار بررسی',
  pending: 'در انتظار بررسی',
  confirmed: 'تأیید شده',
  processing: 'در حال آماده‌سازی',
  sent: 'ارسال شده',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
};

const statusClass: Record<OrderStatus, string> = {
  pending_payment: 'bg-orange-500/15 text-orange-300',
  paid: 'bg-emerald-500/15 text-emerald-300',
  pending_review: 'bg-amber-500/15 text-amber-300',
  pending: 'bg-amber-500/15 text-amber-300',
  confirmed: 'bg-sky-500/15 text-sky-300',
  processing: 'bg-purple-500/15 text-purple-300',
  sent: 'bg-blue-500/15 text-blue-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-red-500/15 text-red-300',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [isLoading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [technicians, setTechnicians] = useState<ServiceTechnician[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderGroup, setOrderGroup] = useState<'all'|'paid'|'unpaid'|'active'|'completed'>('all');
  const [addProductId, setAddProductId] = useState('');

  async function loadOrders() {
    try {
      setLoading(true);
      const nextOrders = await getOrders();
      setOrders(nextOrders);
      const groupedItems = await getOrderItemsForOrders(nextOrders.map((order) => order.id));
      setItemsByOrder(groupedItems);
    } catch (error) {
      console.error(error);
      alert('خطا در دریافت سفارش‌ها');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    getWarehouses().then((items) => setWarehouses(items.filter((item) => item.is_active !== false))).catch(console.error);
    listServiceTechnicians(true).then(setTechnicians).catch(console.error);
    getProducts().then((rows) => setProducts(rows.filter((row) => row.is_active !== false))).catch(console.error);
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchSearch = !q || `${order.order_number} ${order.customer_name} ${order.customer_phone} ${order.customer_car || ''}`.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      const paid = order.payment_status === 'paid' || order.status === 'paid';
      const matchGroup = orderGroup === 'all' || (orderGroup === 'paid' && paid) || (orderGroup === 'unpaid' && !paid) || (orderGroup === 'active' && !['completed','cancelled','pending_payment'].includes(order.status)) || (orderGroup === 'completed' && order.status === 'completed');
      return matchSearch && matchStatus && matchGroup;
    });
  }, [orders, search, statusFilter, orderGroup]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pending_payment' || order.status === 'pending_review' || order.status === 'pending').length,
      completed: orders.filter((order) => order.status === 'completed').length,
      amount: orders.reduce((sum, order) => sum + Number(order.total_amount || 0) + Number(order.wallet_used || 0), 0),
    };
  }, [orders]);

  async function toggleOrder(orderId: string) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!itemsByOrder[orderId]) {
      try {
        const items = await getOrderItems(orderId);
        setItemsByOrder((current) => ({ ...current, [orderId]: items }));
      } catch (error) {
        console.error(error);
        alert('خطا در دریافت آیتم‌های سفارش');
      }
    }
  }


  async function copyReviewLink(order: Order) {
    const link = makeReviewLink(order.id);
    try {
      await navigator.clipboard.writeText(link);
      alert('لینک نظرسنجی کپی شد.');
    } catch {
      window.prompt('لینک نظرسنجی:', link);
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((current) => current.map((item) => (item.id === order.id ? updated : item)));
    } catch (error) {
      console.error(error);
      alert('تغییر وضعیت انجام نشد');
    }
  }

  async function saveItems(order: Order, nextItems: OrderItem[]) {
    if (!nextItems.length) return alert('سفارش باید حداقل یک قلم داشته باشد.');
    try {
      const result = await replaceOrderItems(order.id, nextItems.map(({ product_id, product_name, product_image_url, quantity, unit_price }) => ({ product_id, product_name, product_image_url, quantity, unit_price })));
      setItemsByOrder((current) => ({ ...current, [order.id]: result.items }));
      setOrders((current) => current.map((row) => row.id === order.id ? { ...row, ...result.order } : row));
      alert(result.wallet_credit > 0 ? `${formatPrice(result.wallet_credit)} تومان اختلاف به کیف پول مشتری اضافه شد.` : 'اقلام و مبلغ سفارش ذخیره شد.');
    } catch (error) { alert(error instanceof Error ? error.message : 'ویرایش اقلام انجام نشد.'); }
  }

  function productToOrderItem(order: Order, product: Product): OrderItem {
    const unit = Number(product.price || 0);
    return { id: `new-${product.id}`, order_id: order.id, product_id: String(product.id || ''), product_name: product.name || 'محصول', product_image_url: product.image_url || null, quantity: 1, unit_price: unit, total_price: unit };
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">سفارش‌ها</h1>
          <p className="mt-1 text-sm text-slate-400">مدیریت سفارش‌ها، خروجی شماره تماس‌ها و وضعیت پیامک‌های مشتری</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => exportCustomerPhonesCsv(orders)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white">
            <Download className="h-4 w-4" /> خروجی Excel شماره‌ها
          </button>
          <button onClick={loadOrders} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-bold text-white">
            <RefreshCw className="h-4 w-4" /> بروزرسانی
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-3xl bg-slate-900 p-4"><p className="text-xs text-slate-400">کل سفارش‌ها</p><b className="mt-2 block text-2xl text-white">{stats.total}</b></div>
        <div className="rounded-3xl bg-slate-900 p-4"><p className="text-xs text-slate-400">در انتظار پرداخت/بررسی</p><b className="mt-2 block text-2xl text-amber-300">{stats.pending}</b></div>
        <div className="rounded-3xl bg-slate-900 p-4"><p className="text-xs text-slate-400">تکمیل‌شده</p><b className="mt-2 block text-2xl text-emerald-300">{stats.completed}</b></div>
        <div className="rounded-3xl bg-slate-900 p-4"><p className="text-xs text-slate-400">جمع مبلغ سفارش‌ها</p><b className="mt-2 block text-xl text-gold-300">{formatPrice(stats.amount)} تومان</b></div>
      </div>

      <div className="rounded-3xl bg-slate-900 p-4">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {([['all','همه سفارش‌ها'],['paid','آنلاین پرداخت‌شده'],['unpaid','پرداخت‌نشده'],['active','در حال انجام'],['completed','تکمیل‌شده']] as const).map(([value,label]) => <button key={value} onClick={() => setOrderGroup(value)} className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-black ${orderGroup===value?'bg-amber-400 text-slate-950':'bg-slate-800 text-slate-300'}`}>{label}</button>)}
        </div>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی شماره سفارش، مشتری، موبایل یا خودرو..." className="w-full rounded-2xl border border-slate-700 bg-slate-800 py-3 pl-4 pr-11 text-sm text-white outline-none focus:border-sky-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)} className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-sky-500">
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">در حال دریافت سفارش‌ها...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400">سفارشی پیدا نشد.</div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isOpen = expandedOrderId === order.id;
              const items = itemsByOrder[order.id] || [];
              return (
                <article key={order.id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
                  <div className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_1fr_180px_52px] md:items-center">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <b className="text-white">{order.order_number}</b>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusClass[order.status]}`}>{statusLabels[order.status]}</span>
                      </div>
                      <p className="text-sm text-slate-300">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('fa-IR')}</p>
                    </div>
                    <div className="text-sm text-slate-300"><p>{order.customer_phone}</p><p className="text-xs text-slate-500">{order.customer_car || 'خودرو ثبت نشده'}</p></div>
                    <div><p className="text-xs text-slate-500">{order.items_count} کالا</p><b className="text-gold-300">{formatPrice(Number(order.total_amount)+Number(order.wallet_used||0))} تومان</b>{Number(order.wallet_used||0)>0?<p className="mt-1 text-xs text-cyan-300">{formatPrice(Number(order.wallet_used))} از کیف پول</p>:null}<p className={order.payment_status === 'paid' || order.status === 'paid' ? 'mt-1 text-xs text-emerald-300' : 'mt-1 text-xs text-orange-300'}>{order.payment_status === 'paid' || order.status === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'}</p></div>
                    <div className="space-y-2">
                      <select aria-label="تخصیص سرویس‌کار سفارش" value={order.assigned_technician_id || ''} onChange={async (e) => { try { const updated = await assignOrderTechnician(order.id, e.target.value || null); setOrders((rows) => rows.map((row) => row.id === order.id ? { ...row, ...updated } : row)); } catch (error) { alert(error instanceof Error ? error.message : 'تخصیص انجام نشد.'); } }} className="w-full rounded-2xl border border-emerald-400/30 bg-slate-800 px-3 py-2 text-xs text-white outline-none">
                        <option value="">تخصیص سرویس‌کار</option>{technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.full_name}</option>)}
                      </select>
                      {order.status === 'pending_payment' && (
                        <div className="rounded-2xl bg-orange-500/10 px-3 py-2 text-center text-xs font-black text-orange-200">منتظر پرداخت مشتری</div>
                      )}
                      {order.status === 'paid' && (
                        <button onClick={() => changeStatus(order, 'processing')} className="w-full rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-white">تأیید و آماده‌سازی</button>
                      )}
                      {(order.status === 'pending_review' || order.status === 'pending') && (
                        <button onClick={() => changeStatus(order, 'processing')} className="w-full rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-white">تأیید و آماده‌سازی</button>
                      )}
                      {order.status === 'processing' && (
                        <button onClick={() => changeStatus(order, 'sent')} className="w-full rounded-2xl bg-blue-500 px-3 py-2 text-xs font-black text-white">ارسال / در مسیر</button>
                      )}
                      {order.status === 'sent' && (
                        <button onClick={() => changeStatus(order, 'completed')} className="w-full rounded-2xl bg-gold-500 px-3 py-2 text-xs font-black text-slate-950">تحویل شد + لینک نظر</button>
                      )}
                      {order.status === 'completed' && (
                        <div className="grid grid-cols-2 gap-2">
                          <a href={makeReviewLink(order.id)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 rounded-2xl bg-white/10 px-3 py-2 text-[11px] font-black text-white hover:bg-white/15"><ExternalLink className="h-3.5 w-3.5" /> نظر</a>
                          <button onClick={() => copyReviewLink(order)} className="inline-flex items-center justify-center gap-1 rounded-2xl bg-white/10 px-3 py-2 text-[11px] font-black text-white hover:bg-white/15"><Copy className="h-3.5 w-3.5" /> کپی</button>
                        </div>
                      )}
                      <select value={order.status} onChange={(e) => changeStatus(order, e.target.value as OrderStatus)} className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none">
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      {(order.status === 'paid' || order.status === 'confirmed' || order.status === 'processing' || order.status === 'sent' || order.status === 'completed') && (
                        <select value={order.fulfillment_warehouse_id || ''} onChange={async (e) => { const updated = await updateOrderWarehouse(order.id, e.target.value || null); setOrders((rows) => rows.map((row) => row.id === order.id ? { ...row, ...updated } : row)); }} className="w-full rounded-2xl border border-amber-400/30 bg-slate-800 px-3 py-2 text-xs text-white outline-none">
                          <option value="">ارسال از کدام انبار؟</option>
                          {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>ارسال از {warehouse.name}</option>)}
                        </select>
                      )}
                    </div>
                    <button onClick={() => toggleOrder(order.id)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-white"><ChevronDown className={`h-5 w-5 transition ${isOpen ? 'rotate-180' : ''}`} /></button>
                  </div>
                  <div className="border-t border-slate-800/80 px-4 py-3">
                    <div className="mb-2 text-[11px] font-black text-amber-300">اقلام سفارش برای آماده‌سازی و تحویل</div>
                    {items.length ? <div className="flex flex-wrap gap-2">{items.map((item) => <span key={item.id} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">{item.product_name} <b className="text-amber-300">× {Number(item.quantity).toLocaleString('fa-IR')}</b></span>)}</div> : <p className="text-xs text-slate-500">در حال دریافت اقلام یا فاقد کالای انباری</p>}
                  </div>
                  {isOpen && (
                    <div className="border-t border-slate-800 p-4">
                      <div className="mb-3 rounded-2xl bg-slate-900 p-3 text-xs text-slate-400">
                        <p className="mb-2 inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-amber-200"><MessageSquare className="h-4 w-4" /> پیامک‌های ثبت سفارش، تغییر وضعیت و لینک نظرسنجی در جدول sms_logs ثبت می‌شوند.</p>
                        {order.status === 'completed' && <p className="mb-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-emerald-200">لینک نظرسنجی: {makeReviewLink(order.id)}</p>}
                        <p>آدرس: {order.customer_address || 'ثبت نشده'}</p>
                        {order.note && <p className="mt-1">توضیحات: {order.note}</p>}
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-900 p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                                {item.product_image_url ? <img src={item.product_image_url} className="h-full w-full object-contain" /> : <PackageCheck className="h-5 w-5 text-slate-500" />}
                              </div>
                              <div><b className="text-sm text-white">{item.product_name}</b><p className="text-xs text-slate-500">{item.quantity} × {formatPrice(Number(item.unit_price))} تومان</p></div>
                            </div>
                            <div className="flex items-center gap-2"><button title="کم‌کردن یک عدد" onClick={() => void saveItems(order, item.quantity <= 1 ? items.filter((row) => row.id !== item.id) : items.map((row) => row.id === item.id ? { ...row, quantity: row.quantity-1, total_price: (row.quantity-1)*row.unit_price } : row))} className="rounded-lg bg-white/10 p-2"><Minus className="h-3.5 w-3.5" /></button><b className="min-w-20 text-center text-sm text-gold-300">{formatPrice(Number(item.total_price))} تومان</b><button title="اضافه‌کردن یک عدد" onClick={() => void saveItems(order, items.map((row) => row.id === item.id ? { ...row, quantity: row.quantity+1, total_price: (row.quantity+1)*row.unit_price } : row))} className="rounded-lg bg-white/10 p-2"><Plus className="h-3.5 w-3.5" /></button><button title="حذف قلم" onClick={() => void saveItems(order, items.filter((row) => row.id !== item.id))} className="rounded-lg bg-rose-500/15 p-2 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></div>
                          </div>
                        ))}
                        <div className="grid gap-2 rounded-2xl border border-dashed border-white/10 bg-slate-900 p-3 sm:grid-cols-[1fr_auto]"><select value={addProductId} onChange={(e) => setAddProductId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">انتخاب محصول برای افزودن</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><button onClick={() => { const product=products.find((row)=>row.id===addProductId); if(product) void saveItems(order,[...items,productToOrderItem(order,product)]); }} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950">افزودن قلم</button></div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
