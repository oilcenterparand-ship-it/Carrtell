import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CircleUserRound, ExternalLink, Menu, PackageCheck, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { adminNavigationItems } from '../navigation/adminNavigation';
import { getAdminOrderSummaries, getPendingOnsiteRequests, subscribeToOrders, type AdminOrderSummary, type AdminOnsiteRequestSummary } from '../services/orderStatsApi';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('fa-IR').format(Number(value || 0));
}

function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [onsiteRequests, setOnsiteRequests] = useState<AdminOnsiteRequestSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  async function loadPendingOrders() {
    try {
      setLoading(true);
      const [nextOrders, nextOnsite] = await Promise.all([getAdminOrderSummaries(6), getPendingOnsiteRequests(6)]);
      setOrders(nextOrders);
      setOnsiteRequests(nextOnsite);
    } catch (error) {
      console.error('Admin notifications error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingOrders();
    const unsubscribe = subscribeToOrders(loadPendingOrders);
    return unsubscribe;
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsOpen(false);
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('fa');
    if (!query) return [];
    const seen = new Set<string>();
    return adminNavigationItems
      .filter((item) => item.path.startsWith('/admin/'))
      .filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase('fa').includes(query))
      .filter((item) => {
        if (seen.has(item.path)) return false;
        seen.add(item.path);
        return true;
      })
      .slice(0, 7);
  }, [searchQuery]);

  function openResult(path: string) {
    setSearchQuery('');
    setSearchOpen(false);
    navigate(path);
  }

  const pendingCount = orders.length + onsiteRequests.length;

  return (
    <header className="sticky top-0 z-[9990] h-[72px] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-7">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-400 text-slate-950 shadow-sm shadow-amber-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black tracking-wide text-amber-600">CARRTELL ADMIN</p>
              <p className="text-sm font-black text-slate-900">مرکز مدیریت</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <div ref={searchRef} className="relative hidden w-full max-w-xl lg:block">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchResults[0]) openResult(searchResults[0].path);
              }}
              placeholder="جست‌وجوی صفحه یا ابزار مدیریتی..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pr-11 pl-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            />

            {searchOpen && searchQuery.trim() && (
              <div className="absolute inset-x-0 top-14 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      type="button"
                      key={`${item.path}-${item.title}`}
                      onClick={() => openResult(item.path)}
                      className="block w-full rounded-2xl px-4 py-3 text-right transition hover:bg-amber-50"
                    >
                      <span className="block text-sm font-black text-slate-900">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500">{item.description}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-5 text-center text-sm font-bold text-slate-500">صفحه‌ای پیدا نشد.</div>
                )}
              </div>
            )}
          </div>

          <Link
            to="/"
            className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 md:inline-flex"
          >
            مشاهده سایت
            <ExternalLink className="h-4 w-4" />
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="اعلان سفارش‌ها"
            >
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white ring-2 ring-white">
                  {pendingCount > 9 ? '+9' : pendingCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div dir="rtl" className="absolute left-0 top-14 z-[99999] w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">سفارش‌های جدید</h3>
                    <p className="mt-1 text-xs text-slate-500">سفارش‌های در انتظار بررسی</p>
                  </div>
                  <button onClick={loadPendingOrders} className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200" title="بروزرسانی">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {onsiteRequests.length > 0 && (
                  <Link to="/admin/dispatch" onClick={() => setIsOpen(false)} className="m-3 block rounded-2xl border-2 border-red-200 bg-red-50 p-3 transition hover:border-red-400">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <b className="text-sm text-red-700">سرویس در محل جدید</b>
                        <p className="mt-1 text-xs text-red-600">{onsiteRequests.length.toLocaleString('fa-IR')} سفارش منتظر مشاهده یا اختصاص تکنسین</p>
                      </div>
                      <span className="grid h-9 min-w-9 place-items-center rounded-full bg-red-500 px-2 text-sm font-black text-white">{onsiteRequests.length.toLocaleString('fa-IR')}</span>
                    </div>
                  </Link>
                )}

                <div className="max-h-80 overflow-y-auto p-3">
                  {isLoading && orders.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">در حال دریافت...</div>
                  ) : orders.length === 0 ? (
                    <div className="rounded-2xl bg-emerald-50 p-5 text-center">
                      <PackageCheck className="mx-auto h-8 w-8 text-emerald-600" />
                      <p className="mt-2 text-sm font-bold text-slate-900">سفارش جدیدی نداری</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((order) => (
                        <Link
                          key={order.id}
                          to="/admin/orders"
                          onClick={() => setIsOpen(false)}
                          className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-amber-300 hover:bg-amber-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <b className="text-sm text-slate-900">{order.order_number}</b>
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">در انتظار بررسی</span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                            <span>{order.customer_name || 'مشتری'}</span>
                            <span className="text-left">{order.customer_car || 'خودرو ثبت نشده'}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-slate-400">{new Date(order.created_at).toLocaleString('fa-IR')}</span>
                            <b className="text-amber-700">{formatPrice(Number(order.total_amount))} تومان</b>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 p-3">
                  <Link
                    to="/admin/orders"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-2xl bg-amber-400 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-amber-300"
                  >
                    مشاهده همه سفارش‌ها
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/admin/settings"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            title="تنظیمات مدیر"
          >
            <CircleUserRound className="h-5 w-5" />
            <span className="hidden text-xs font-black xl:inline">مدیر</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
