import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { CheckCircle2, CreditCard, MapPin, PackageCheck, ShoppingCart, Sparkles, Truck, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { emitAuthChanged } from '../auth/authApi';

type CartItem = {
  id: string;
  product_id?: string;
  name?: string;
  title?: string;
  image?: string;
  image_url?: string;
  price?: number;
  sale_price?: number;
  quantity?: number;
  qty?: number;
  brand_name?: string;
  category_name?: string;
};

type CustomerAddress = {
  id: string;
  title?: string | null;
  city?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  plaque?: string | null;
  unit?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  full_address?: string | null;
};

type SelectedCar = {
  id?: string;
  car_id?: string;
  name?: string;
  title?: string;
  brand?: string;
  model?: string;
  year?: string | number;
};

type Suggestion = {
  id: string;
  name?: string;
  title?: string;
  price?: number;
  sale_price?: number;
  image_url?: string;
  image?: string;
};

type StepKey = 'cart' | 'info' | 'address' | 'payment' | 'done';

const steps: { key: StepKey; label: string; icon: JSX.Element }[] = [
  { key: 'cart', label: 'سبد خرید', icon: <ShoppingCart className="h-4 w-4" /> },
  { key: 'info', label: 'اطلاعات', icon: <PackageCheck className="h-4 w-4" /> },
  { key: 'address', label: 'آدرس', icon: <MapPin className="h-4 w-4" /> },
  { key: 'payment', label: 'پرداخت', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'done', label: 'تکمیل', icon: <CheckCircle2 className="h-4 w-4" /> },
];

const inputClass = 'w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20';
const selectClass = `${inputClass} [&>option]:bg-slate-950 [&>option]:text-white`;
const cardClass = 'rounded-3xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-black/20 backdrop-blur';

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number) {
  return `${Math.round(value).toLocaleString('fa-IR')} تومان`;
}

function getItemId(item: CartItem) {
  return String(item.product_id || item.id);
}

function getItemName(item: CartItem) {
  return item.name || item.title || 'محصول کارتل';
}

function getItemPrice(item: CartItem) {
  return toNumber(item.sale_price || item.price);
}

function getItemQty(item: CartItem) {
  return Math.max(1, toNumber(item.quantity || item.qty || 1));
}

function readJson<T>(keys: string[], fallback: T): T {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return JSON.parse(raw) as T;
    } catch {
      // ignore old invalid values
    }
  }
  return fallback;
}

function normalizeStoredCart(value: unknown): CartItem[] {
  if (Array.isArray(value)) return value as CartItem[];
  if (!value || typeof value !== 'object') return [];

  return Object.values(value as Record<string, any>)
    .map((entry: any) => {
      if (entry?.product) {
        return {
          ...entry.product,
          id: entry.product.id,
          product_id: entry.product.id,
          quantity: Number(entry.quantity || 1),
          qty: Number(entry.quantity || 1),
        } as CartItem;
      }
      return entry as CartItem;
    })
    .filter((item: CartItem) => Boolean(item?.id || item?.product_id));
}

function readCartItems(): CartItem[] {
  const keys = ['carrtell_cart_v1', 'cart', 'carrtell_cart', 'cart_items'];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const normalized = normalizeStoredCart(JSON.parse(raw));
      if (normalized.length) return normalized;
    } catch {
      // ignore invalid legacy values
    }
  }
  return [];
}

function writeCart(items: CartItem[]) {
  const normalized = items.map((item) => ({ ...item, quantity: getItemQty(item), qty: getItemQty(item) }));
  const cartMap = Object.fromEntries(
    normalized.map((item) => {
      const id = getItemId(item);
      return [id, { product: { ...item, id }, quantity: getItemQty(item) }];
    }),
  );

  localStorage.setItem('carrtell_cart_v1', JSON.stringify(cartMap));
  localStorage.setItem('cart', JSON.stringify(normalized));
  localStorage.setItem('carrtell_cart', JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('carrtell-cart-updated', { detail: cartMap }));
  window.dispatchEvent(new Event('cart:updated'));
}

function getCarTitle(car: SelectedCar | null) {
  if (!car) return '';
  return [car.brand, car.name || car.title || car.model, car.year].filter(Boolean).join(' ');
}

function addressText(address?: CustomerAddress | null) {
  if (!address) return '';
  return address.full_address || [address.city, address.district || address.neighborhood, address.street, address.plaque ? `پلاک ${address.plaque}` : '', address.unit ? `واحد ${address.unit}` : ''].filter(Boolean).join('، ');
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, loading: authLoading, refreshAuth } = useAuth();
  const [step, setStep] = useState<StepKey>('cart');
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedCar, setSelectedCar] = useState<SelectedCar | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [packages, setPackages] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [customer, setCustomer] = useState({ full_name: '', phone: '', note: '' });
  const [newAddress, setNewAddress] = useState({ city: '', neighborhood: '', street: '', plaque: '', unit: '', latitude: '', longitude: '' });
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'service'>('delivery');
  const [showLoginGate, setShowLoginGate] = useState(false);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + getItemPrice(item) * getItemQty(item), 0), [items]);
  const serviceFee = deliveryMode === 'service' ? 0 : 0;
  const total = subtotal + serviceFee;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;
  const carTitle = getCarTitle(selectedCar);

  useEffect(() => {
    setItems(readCartItems());
    setSelectedCar(readJson<SelectedCar | null>(['carrtell_selected_car', 'selected_car', 'my_selected_car'], null));

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;

      const metadata = user.user_metadata || {};
      setCustomer((prev) => ({
        ...prev,
        full_name: metadata.full_name || metadata.name || prev.full_name,
        phone: metadata.phone || user.phone || prev.phone,
      }));

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setCustomer((prev) => ({
          ...prev,
          full_name: profile.full_name || prev.full_name,
          phone: profile.phone || prev.phone,
        }));
      }

      const addressQueries = [
        supabase.from('customer_addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ];

      for (const query of addressQueries) {
        const { data: rows, error } = await query;
        if (!error && rows && rows.length) {
          setAddresses(rows as CustomerAddress[]);
          setSelectedAddressId(String(rows[0].id));
          break;
        }
      }
    });
  }, []);

  useEffect(() => {
    if (authUser) {
      setCustomer((prev) => ({
        ...prev,
        full_name: authUser.fullName || prev.full_name,
        phone: authUser.phone || prev.phone,
      }));
    }
  }, [authUser]);

  useEffect(() => {
    if (authLoading) return;
    if (items.length > 0 && !isAuthenticated && step === 'cart') {
      setShowLoginGate(true);
    }

    if (isAuthenticated && sessionStorage.getItem('carrtell_checkout_resume') === 'info') {
      sessionStorage.removeItem('carrtell_checkout_resume');
      setShowLoginGate(false);
      setStep('info');
    }
  }, [authLoading, isAuthenticated, items.length, step]);

  useEffect(() => {
    const sync = () => setItems(readCartItems());
    window.addEventListener('carrtell-cart-updated', sync as EventListener);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('carrtell-cart-updated', sync as EventListener);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    const carId = selectedCar?.car_id || selectedCar?.id;
    const loadSuggestions = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .limit(8);

      if (products) setSuggestions(products as Suggestion[]);

      if (carId) {
        const { data: packs } = await supabase
          .from('packages')
          .select('*')
          .eq('is_active', true)
          .limit(6);
        if (packs) setPackages(packs as Suggestion[]);
      }
    };
    loadSuggestions();
  }, [selectedCar]);

  function updateQty(id: string, qty: number) {
    const next = items
      .map((item) => (getItemId(item) === id ? { ...item, quantity: Math.max(1, qty), qty: Math.max(1, qty) } : item))
      .filter((item) => getItemQty(item) > 0);
    setItems(next);
    writeCart(next);
  }

  function removeItem(id: string) {
    const next = items.filter((item) => getItemId(item) !== id);
    setItems(next);
    writeCart(next);
  }

  function beginCheckout() {
    setMessage('');
    if (!items.length) {
      setMessage('سبد خرید خالی است.');
      return;
    }
    if (!isAuthenticated) {
      sessionStorage.setItem('carrtell_checkout_resume', 'info');
      setShowLoginGate(true);
      return;
    }
    setStep('info');
  }

  async function saveCustomerAndContinue() {
    setMessage('');
    if (!customer.full_name.trim()) {
      setMessage('نام و نام خانوادگی را وارد کن.');
      return;
    }
    if (!/^09\d{9}$/.test(customer.phone.replace(/\s/g, ''))) {
      setMessage('شماره موبایل معتبر وارد کن؛ مانند 09123456789.');
      return;
    }

    localStorage.setItem('carrtell_customer_profile', JSON.stringify({
      phone: customer.phone.trim(),
      fullName: customer.full_name.trim(),
    }));
    localStorage.setItem('carrtell_user_role', authUser?.role || 'customer');
    emitAuthChanged();

    const { data } = await supabase.auth.getUser();
    if (data.user?.id) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: customer.full_name.trim(),
        phone: customer.phone.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      await refreshAuth();
    }

    setStep('address');
  }

  function hasAddress() {
    if (selectedAddressId) return true;
    return Boolean(newAddress.city.trim() && newAddress.street.trim() && newAddress.plaque.trim());
  }

  function canGoPayment() {
    if (!hasAddress()) {
      setMessage('یک آدرس ذخیره‌شده انتخاب کن یا آدرس جدید را کامل وارد کن.');
      return false;
    }
    return true;
  }

  async function createOrder() {
    if (!isAuthenticated) {
      sessionStorage.setItem('carrtell_checkout_resume', 'info');
      setShowLoginGate(true);
      return;
    }
    if (!canGoPayment()) return;
    setLoading(true);
    setMessage('');

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      const carId = selectedCar?.car_id || selectedCar?.id || null;
      const orderAddress = selectedAddress
        ? addressText(selectedAddress)
        : [newAddress.city, newAddress.neighborhood, newAddress.street, `پلاک ${newAddress.plaque}`, newAddress.unit ? `واحد ${newAddress.unit}` : ''].filter(Boolean).join('، ');

      const orderPayload = {
        user_id: user?.id || authUser?.id || null,
        customer_name: customer.full_name,
        customer_phone: customer.phone,
        status: 'pending_payment',
        payment_status: 'unpaid',
        total_amount: total,
        subtotal,
        delivery_type: deliveryMode,
        car_id: carId,
        car_name: carTitle || null,
        address_id: selectedAddress?.id || null,
        address_text: orderAddress,
        latitude: selectedAddress?.latitude || (newAddress.latitude ? Number(newAddress.latitude) : null),
        longitude: selectedAddress?.longitude || (newAddress.longitude ? Number(newAddress.longitude) : null),
        customer_note: customer.note || null,
        items,
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (error) throw error;

      const orderId = String(order.id);
      setCreatedOrderId(orderId);
      sessionStorage.setItem('carrtell_last_order_id', orderId);
      setStep('done');
      navigate(`/payment?orderId=${encodeURIComponent(orderId)}`);
    } catch (error: any) {
      setMessage(error?.message || 'ثبت سفارش انجام نشد. جدول orders یا ستون‌های پرداخت را بررسی کن.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8" dir="rtl">
      {showLoginGate && !isAuthenticated && !authLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={() => setShowLoginGate(false)}>
          <div className="w-full max-w-md rounded-[2rem] border border-amber-400/25 bg-slate-900 p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
              <LogIn className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-black">ورود برای ادامه خرید</h2>
            <p className="mt-2 text-center text-sm leading-7 text-slate-300">محصولات سبد شما حفظ می‌شوند. ابتدا با شماره موبایل وارد شو، سپس اطلاعات مشتری، آدرس، نوع دریافت، پرداخت و فاکتور را مرحله‌به‌مرحله تکمیل می‌کنی.</p>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('carrtell_checkout_resume', 'info');
                navigate('/login-otp?returnTo=%2Fcart');
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300"
            >
              <LogIn className="h-5 w-5" /> ورود / ثبت‌نام با موبایل
            </button>
            <button type="button" onClick={() => setShowLoginGate(false)} className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3 text-sm text-slate-300 hover:bg-white/5">بازگشت به سبد خرید</button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/25 p-5 shadow-2xl shadow-amber-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-amber-300">تکمیل خرید Carrtell</p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">سبد خرید و ثبت سفارش</h1>
              <p className="mt-2 text-sm text-slate-300">پس از ورود، اطلاعات مشتری، آدرس، روش دریافت، پرداخت و فاکتور را مرحله‌به‌مرحله تکمیل کن.</p>
            </div>
            {carTitle ? (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                سفارش برای خودروی شما: <b>{carTitle}</b>
              </div>
            ) : (
              <Link to="/profile" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
                خودرو انتخاب نشده؛ از پروفایل یا هدر خودرو را انتخاب کن.
              </Link>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-5">
            {steps.map((item, index) => {
              const activeIndex = steps.findIndex((s) => s.key === step);
              const isActive = item.key === step;
              const done = index < activeIndex;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStep(item.key)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm transition ${
                    isActive
                      ? 'border-amber-300 bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : done
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/10 bg-slate-950/60 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{message}</div>
        )}

        {isAuthenticated && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> ورود شما تایید شده است.</span>
            <span>{authUser?.phone || authUser?.fullName || 'مشتری Carrtell'}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            {step === 'cart' && (
              <div className={cardClass}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black">محصولات سبد خرید</h2>
                  <Link to="/shop" className="text-sm text-amber-300 hover:text-amber-200">ادامه خرید</Link>
                </div>
                {!items.length ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-slate-300">
                    سبد خرید خالی است.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const id = getItemId(item);
                      return (
                        <div key={id} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white/5">
                            {(item.image_url || item.image) ? (
                              <img src={item.image_url || item.image} alt={getItemName(item)} className="h-full w-full object-contain" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white">{getItemName(item)}</h3>
                            <p className="mt-1 text-sm text-slate-400">{item.brand_name || item.category_name || 'محصول خودرو'}</p>
                            <p className="mt-2 text-amber-300">{money(getItemPrice(item))}</p>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <button onClick={() => removeItem(id)} className="text-xs text-red-300 hover:text-red-200">حذف</button>
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-2 py-1">
                              <button onClick={() => updateQty(id, getItemQty(item) - 1)} className="px-2 text-lg">−</button>
                              <span className="w-6 text-center">{getItemQty(item).toLocaleString('fa-IR')}</span>
                              <button onClick={() => updateQty(id, getItemQty(item) + 1)} className="px-2 text-lg">+</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-5 flex justify-end">
                  <button onClick={beginCheckout} className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300">
                    ادامه ثبت سفارش
                  </button>
                </div>
              </div>
            )}

            {step === 'info' && (
              <div className={cardClass}>
                <h2 className="mb-4 text-xl font-black">اطلاعات مشتری</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-300">
                    نام و نام خانوادگی
                    <input className={inputClass} value={customer.full_name} onChange={(e) => setCustomer({ ...customer, full_name: e.target.value })} placeholder="مثلاً امین اورعی" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    شماره تماس
                    <input className={inputClass} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="09xxxxxxxxx" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                    توضیحات سفارش
                    <textarea className={inputClass} rows={4} value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} placeholder="توضیحات اختیاری برای سفارش یا سرویس" />
                  </label>
                </div>
                <div className="mt-5 flex justify-between">
                  <button onClick={() => setStep('cart')} className="rounded-2xl border border-white/10 px-5 py-3 text-slate-200 hover:bg-white/5">بازگشت</button>
                  <button onClick={() => void saveCustomerAndContinue()} className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300">ادامه</button>
                </div>
              </div>
            )}

            {step === 'address' && (
              <div className={cardClass}>
                <h2 className="mb-4 text-xl font-black">آدرس و روش دریافت</h2>
                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  <button onClick={() => setDeliveryMode('delivery')} className={`rounded-2xl border p-4 text-right ${deliveryMode === 'delivery' ? 'border-amber-300 bg-amber-400/10' : 'border-white/10 bg-slate-950/50'}`}>
                    <Truck className="mb-2 h-5 w-5 text-amber-300" />
                    <b>ارسال محصول</b>
                    <p className="mt-1 text-sm text-slate-400">محصول برای مشتری ارسال شود.</p>
                  </button>
                  <button onClick={() => setDeliveryMode('service')} className={`rounded-2xl border p-4 text-right ${deliveryMode === 'service' ? 'border-amber-300 bg-amber-400/10' : 'border-white/10 bg-slate-950/50'}`}>
                    <Wrench className="mb-2 h-5 w-5 text-amber-300" />
                    <b>خرید + سرویس در محل</b>
                    <p className="mt-1 text-sm text-slate-400">محصول همراه سرویس در محل انجام شود.</p>
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="space-y-2 text-sm text-slate-300">
                    انتخاب آدرس ذخیره‌شده
                    <select className={selectClass} value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                      <option value="">آدرس جدید وارد می‌کنم</option>
                      {addresses.map((address) => <option key={address.id} value={address.id}>{address.title || addressText(address)}</option>)}
                    </select>
                  </label>

                  {!selectedAddressId && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className={inputClass} placeholder="شهر" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                      <input className={inputClass} placeholder="محله" value={newAddress.neighborhood} onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })} />
                      <input className={`${inputClass} md:col-span-2`} placeholder="خیابان و آدرس" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} />
                      <input className={inputClass} placeholder="پلاک" value={newAddress.plaque} onChange={(e) => setNewAddress({ ...newAddress, plaque: e.target.value })} />
                      <input className={inputClass} placeholder="واحد" value={newAddress.unit} onChange={(e) => setNewAddress({ ...newAddress, unit: e.target.value })} />
                      <input className={inputClass} placeholder="Latitude / اختیاری" value={newAddress.latitude} onChange={(e) => setNewAddress({ ...newAddress, latitude: e.target.value })} />
                      <input className={inputClass} placeholder="Longitude / اختیاری" value={newAddress.longitude} onChange={(e) => setNewAddress({ ...newAddress, longitude: e.target.value })} />
                    </div>
                  )}
                </div>

                <div className="mt-5 flex justify-between">
                  <button onClick={() => setStep('info')} className="rounded-2xl border border-white/10 px-5 py-3 text-slate-200 hover:bg-white/5">بازگشت</button>
                  <button onClick={() => canGoPayment() && setStep('payment')} className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300">ادامه پرداخت</button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className={cardClass}>
                <h2 className="mb-4 text-xl font-black">بازبینی و پرداخت</h2>
                <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <p>مشتری: <b className="text-white">{customer.full_name}</b></p>
                  <p>شماره تماس: <b className="text-white">{customer.phone}</b></p>
                  <p>روش دریافت: <b className="text-white">{deliveryMode === 'service' ? 'خرید + سرویس در محل' : 'ارسال محصول'}</b></p>
                  <p>آدرس: <b className="text-white">{selectedAddress ? addressText(selectedAddress) : [newAddress.city, newAddress.street, newAddress.plaque].filter(Boolean).join('، ')}</b></p>
                  {carTitle && <p>خودرو: <b className="text-amber-200">{carTitle}</b></p>}
                </div>
                <div className="mt-5 flex justify-between">
                  <button onClick={() => setStep('address')} className="rounded-2xl border border-white/10 px-5 py-3 text-slate-200 hover:bg-white/5">بازگشت</button>
                  <button disabled={loading} onClick={createOrder} className="rounded-2xl bg-emerald-400 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
                    {loading ? 'در حال ثبت...' : 'ثبت سفارش و رفتن به پرداخت'}
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className={cardClass}>
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-300" />
                <h2 className="text-xl font-black">سفارش ثبت شد</h2>
                <p className="mt-2 text-slate-300">برای پرداخت به صفحه پرداخت منتقل می‌شوی.</p>
                {createdOrderId && <p className="mt-2 text-sm text-slate-400">کد سفارش: {createdOrderId}</p>}
              </div>
            )}
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className={cardClass}>
              <h3 className="mb-4 text-lg font-black">خلاصه سفارش</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between"><span>تعداد کالا</span><b>{items.length.toLocaleString('fa-IR')}</b></div>
                <div className="flex justify-between"><span>جمع کالاها</span><b>{money(subtotal)}</b></div>
                <div className="flex justify-between"><span>روش دریافت</span><b>{deliveryMode === 'service' ? 'سرویس در محل' : 'ارسال'}</b></div>
                <div className="border-t border-white/10 pt-3 text-base">
                  <div className="flex justify-between"><span>مبلغ قابل پرداخت</span><b className="text-amber-300">{money(total)}</b></div>
                </div>
              </div>
            </div>

            {(suggestions.length > 0 || packages.length > 0) && (
              <div className={cardClass}>
                <div className="mb-3 flex items-center gap-2 text-amber-200">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-black">پیشنهاد قبل پرداخت</h3>
                </div>
                <div className="space-y-3">
                  {packages.slice(0, 2).map((item) => (
                    <Link key={`p-${item.id}`} to={`/packages/${item.id}`} className="block rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm hover:bg-amber-400/15">
                      <b>{item.name || item.title}</b>
                      <p className="mt-1 text-xs text-slate-300">پکیج آماده مدیر برای خودروی انتخابی</p>
                    </Link>
                  ))}
                  {suggestions.slice(0, 3).map((item) => (
                    <Link key={item.id} to={`/product/${item.id}`} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm hover:bg-white/5">
                      <div className="h-12 w-12 rounded-xl bg-white/5">
                        {(item.image_url || item.image) ? <img src={item.image_url || item.image} className="h-full w-full object-contain" /> : null}
                      </div>
                      <div>
                        <b>{item.name || item.title}</b>
                        <p className="mt-1 text-xs text-amber-300">{money(toNumber(item.sale_price || item.price))}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
