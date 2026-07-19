import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Minus, Phone, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import type { Product } from '../services/productsApi';
import type { Car } from '../services/carsApi';
import { createPhoneOrder, getPhoneOrderCars, getPhoneOrderProducts, type PhoneOrderItem } from '../services/phoneOrdersApi';

const money = (value: number) => `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;

export default function PhoneOrder() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [items, setItems] = useState<PhoneOrderItem[]>([]);
  const [query, setQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [carId, setCarId] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'onsite_service' | 'store_pickup'>('onsite_service');
  const [scheduledAt, setScheduledAt] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'card_reader' | 'cash' | 'pay_on_site'>('pay_on_site');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void Promise.all([getPhoneOrderProducts(), getPhoneOrderCars()]).then(([p, c]) => {
      setProducts(p);
      setCars(c);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('fa');
    if (!q) return products.slice(0, 20);
    return products.filter((p) => `${p.name} ${p.brand || ''} ${p.category || ''}`.toLocaleLowerCase('fa').includes(q)).slice(0, 30);
  }, [products, query]);

  const total = items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  const selectedCar = cars.find((car) => car.id === carId);
  const valid = customerName.trim().length >= 2 && /^09\d{9}$/.test(customerPhone.replace(/\s|-/g, '')) && items.length > 0 && (fulfillmentMethod === 'store_pickup' || (customerAddress.trim().length >= 8 && Boolean(scheduledAt)));

  const addProduct = (product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      return existing
        ? current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string | undefined, delta: number) => {
    setItems((current) => current.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const submit = async () => {
    if (!valid) return;
    setLoading(true);
    setMessage('');
    try {
      const order = await createPhoneOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\s|-/g, ''),
        customerAddress: fulfillmentMethod === 'onsite_service' ? customerAddress.trim() : undefined,
        customerCar: selectedCar ? [selectedCar.brand, selectedCar.model, selectedCar.trim].filter(Boolean).join(' ') : undefined,
        fulfillmentMethod,
        scheduledAt: fulfillmentMethod === 'onsite_service' ? new Date(scheduledAt).toISOString() : undefined,
        paymentMethod,
        note: note.trim(),
        items,
      });
      setMessage(`سفارش ${order.order_number || ''} با موفقیت ثبت شد.`);
      setItems([]);
      setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setCarId(''); setScheduledAt(''); setNote('');
    } catch (error: any) {
      setMessage(error?.message || 'ثبت سفارش ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  return <div dir="rtl" className="space-y-5 text-slate-100">
    <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
      <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300"><Phone /></span><div><h1 className="text-2xl font-black">ثبت سفارش تلفنی</h1><p className="mt-1 text-sm text-slate-400">ثبت سریع مشتری، کالا، زمان مراجعه و ورود خودکار به مرکز اعزام</p></div></div>
    </header>

    {message && <div className={`rounded-2xl border px-4 py-3 text-sm ${message.includes('موفقیت') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>{message}</div>}

    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="font-black">۱. اطلاعات مشتری و دریافت</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="نام و نام خانوادگی" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="شماره موبایل 09..." className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400" />
          <select value={carId} onChange={(e) => setCarId(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400"><option value="">انتخاب خودرو (اختیاری)</option>{cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model} {car.trim || ''}</option>)}</select>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400"><option value="pay_on_site">پرداخت در محل</option><option value="card_reader">کارت‌خوان هنگام مراجعه</option><option value="cash">نقدی</option><option value="online">پرداخت آنلاین</option></select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2"><button onClick={() => setFulfillmentMethod('onsite_service')} className={`rounded-2xl border p-4 text-right ${fulfillmentMethod === 'onsite_service' ? 'border-yellow-400 bg-yellow-400/10' : 'border-slate-700'}`}><b>سرویس در محل</b><p className="mt-1 text-xs text-slate-400">وارد مرکز اعزام می‌شود</p></button><button onClick={() => setFulfillmentMethod('store_pickup')} className={`rounded-2xl border p-4 text-right ${fulfillmentMethod === 'store_pickup' ? 'border-yellow-400 bg-yellow-400/10' : 'border-slate-700'}`}><b>مراجعه حضوری</b><p className="mt-1 text-xs text-slate-400">بدون مأموریت تکنسین</p></button></div>
        {fulfillmentMethod === 'onsite_service' && <div className="grid gap-3 md:grid-cols-2"><textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="آدرس کامل مشتری" className="min-h-24 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400" /><label className="rounded-2xl border border-slate-700 bg-slate-950 p-3 text-sm"><span className="mb-2 flex items-center gap-2 text-slate-400"><CalendarClock size={16}/> تاریخ و ساعت مراجعه</span><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full bg-transparent outline-none" /></label></div>}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="یادداشت اپراتور (اختیاری)" className="min-h-20 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400" />
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="font-black">۲. انتخاب محصولات</h2>
        <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی محصول..." className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pr-10 pl-4 outline-none focus:border-yellow-400" /></div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">{filteredProducts.map((product) => <button key={product.id} onClick={() => addProduct(product)} className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-right hover:border-yellow-400/40"><div><b className="text-sm">{product.name}</b><p className="mt-1 text-xs text-slate-500">{product.brand || product.category || ''}</p></div><div className="flex items-center gap-3"><span className="text-sm text-yellow-300">{money(Number(product.price || 0))}</span><Plus size={18}/></div></button>)}</div>
      </section>
    </div>

    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-black"><ShoppingCart/> اقلام سفارش</h2><b className="text-yellow-300">{money(total)}</b></div>
      <div className="space-y-2">{items.length ? items.map((item) => <div key={item.product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3"><div><b>{item.product.name}</b><p className="mt-1 text-xs text-slate-500">{money(Number(item.product.price || 0))}</p></div><div className="flex items-center gap-2"><button onClick={() => updateQuantity(item.product.id, -1)} className="rounded-xl border border-slate-700 p-2"><Minus size={15}/></button><b className="min-w-8 text-center">{item.quantity}</b><button onClick={() => updateQuantity(item.product.id, 1)} className="rounded-xl border border-slate-700 p-2"><Plus size={15}/></button><button onClick={() => setItems((current) => current.filter((row) => row.product.id !== item.product.id))} className="rounded-xl border border-rose-500/30 p-2 text-rose-300"><Trash2 size={15}/></button></div></div>) : <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">هنوز محصولی انتخاب نشده است.</div>}</div>
      <button disabled={!valid || loading} onClick={() => void submit()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={19}/>{loading ? 'در حال ثبت...' : 'ثبت نهایی سفارش تلفنی'}</button>
    </section>
  </div>;
}
