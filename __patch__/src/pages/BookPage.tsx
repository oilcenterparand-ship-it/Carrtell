import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Car, CheckCircle2, ClipboardCheck, Gauge, Loader2, MapPin, PackageSearch, Phone, ShoppingCart, UserRound, Wrench } from 'lucide-react';
import { getActiveCarsForCustomer, getCarTitle, type Car as AdminCar } from '../admin/services/carsApi';
import { formatCustomerAddress, getCustomerAddresses, type CustomerAddress } from '../customer/services/addressApi';
import { getCustomerVehicles, type CustomerVehicle } from '../customer/services/garageApi';
import { createServiceRequest } from '../customer/services/serviceRequestsApi';
import { onSelectedCustomerCarChange, readSelectedCustomerCar, saveSelectedCustomerCar } from '../customer/services/selectedCar';

const timeSlots = ['۰۸:۰۰', '۰۹:۰۰', '۱۰:۰۰', '۱۱:۰۰', '۱۲:۰۰', '۱۳:۰۰', '۱۴:۰۰', '۱۵:۰۰', '۱۶:۰۰', '۱۷:۰۰'];

function toInputDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function getDateOptions() {
  return Array.from({ length: 7 }).map((_, index) => {
    const value = toInputDate(index + 1);
    return { value, label: index === 0 ? 'فردا' : new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(value)) };
  });
}

function findAdminCar(cars: AdminCar[], selectedId?: string | null) {
  if (!selectedId) return null;
  return cars.find((car) => car.id === selectedId) || null;
}

type CartProduct = {
  id?: string;
  product_id?: string;
  name?: string;
  title?: string;
  quantity?: number;
  qty?: number;
};

function readPurchasedProducts(): CartProduct[] {
  for (const key of ['cart', 'carrtell_cart', 'cart_items']) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // داده قدیمی یا خراب سبد خرید نادیده گرفته می‌شود.
    }
  }
  return [];
}

function cartProductName(item: CartProduct) {
  return item.name || item.title || 'محصول خودرو';
}

export default function BookPage() {
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<CustomerVehicle[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(readSelectedCustomerCar()?.id || '');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [lastServiceKm, setLastServiceKm] = useState('');
  const [serviceIntervalKm, setServiceIntervalKm] = useState('5000');
  const [preferredDate, setPreferredDate] = useState(toInputDate(1));
  const [preferredTime, setPreferredTime] = useState(timeSlots[0]);
  const [note, setNote] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successNumber, setSuccessNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [purchasedProducts, setPurchasedProducts] = useState<CartProduct[]>(() => readPurchasedProducts());

  const selectedCar = useMemo(() => findAdminCar(cars, selectedCarId), [cars, selectedCarId]);
  const selectedAddress = useMemo(() => addresses.find((address) => address.id === selectedAddressId) || null, [addresses, selectedAddressId]);
  const nextServiceKm = useMemo(() => Number(lastServiceKm || 0) + Number(serviceIntervalKm || 5000), [lastServiceKm, serviceIntervalKm]);
  const dateOptions = useMemo(getDateOptions, []);


  useEffect(() => {
    const syncCart = () => setPurchasedProducts(readPurchasedProducts());
    syncCart();
    window.addEventListener('cart:updated', syncCart);
    window.addEventListener('storage', syncCart);
    return () => {
      window.removeEventListener('cart:updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getActiveCarsForCustomer()
      .then((items) => {
        if (!mounted) return;
        setCars(items);
        const selected = readSelectedCustomerCar();
        if (selected?.id && items.some((car) => car.id === selected.id)) setSelectedCarId(selected.id);
      })
      .catch(() => setCars([]))
      .finally(() => mounted && setLoading(false));

    const unsubscribe = onSelectedCustomerCarChange(() => {
      const selected = readSelectedCustomerCar();
      setSelectedCarId(selected?.id || '');
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedCar) return;
    setServiceIntervalKm(String(selectedCar.service_interval_km || 5000));
    saveSelectedCustomerCar(selectedCar);
  }, [selectedCar]);

  useEffect(() => {
    const cleanPhone = customerPhone.trim();
    if (cleanPhone.length < 10) {
      setAddresses([]);
      setSavedVehicles([]);
      return;
    }

    let mounted = true;
    Promise.all([getCustomerAddresses(cleanPhone), getCustomerVehicles(cleanPhone)])
      .then(([addressItems, vehicleItems]) => {
        if (!mounted) return;
        setAddresses(addressItems);
        setSavedVehicles(vehicleItems);
        const defaultAddress = addressItems.find((item) => item.is_default) || addressItems[0];
        if (defaultAddress?.id && !selectedAddressId) setSelectedAddressId(defaultAddress.id);

        const selectedTitle = selectedCar ? getCarTitle(selectedCar) : '';
        const matchingVehicle = vehicleItems.find((item) => item.title === selectedTitle || item.title.includes(selectedCar?.model || ''));
        if (matchingVehicle) {
          if (!currentKm) setCurrentKm(String(matchingVehicle.current_km || ''));
          if (!lastServiceKm) setLastServiceKm(String(matchingVehicle.last_service_km || ''));
          if (!serviceIntervalKm) setServiceIntervalKm(String(matchingVehicle.service_interval_km || selectedCar?.service_interval_km || 5000));
        }
      })
      .catch(() => {
        if (mounted) {
          setAddresses([]);
          setSavedVehicles([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [customerPhone, currentKm, lastServiceKm, selectedAddressId, selectedCar, selectedCarId, serviceIntervalKm]);

  async function handleSubmit() {
    setErrorMessage('');
    setSuccessNumber('');
    if (!selectedCar) {
      setErrorMessage('لطفاً خودرو را انتخاب کنید.');
      return;
    }

    const addressText = selectedAddress ? formatCustomerAddress(selectedAddress) : manualAddress.trim();
    if (!addressText) {
      setErrorMessage('لطفاً آدرس سرویس را انتخاب یا وارد کنید.');
      return;
    }

    setSubmitting(true);
    try {
      const request = await createServiceRequest({
        customer_name: customerName.trim() || 'مشتری کارتل',
        customer_phone: customerPhone.trim(),
        vehicle_id: selectedCar.id || null,
        vehicle_title: getCarTitle(selectedCar),
        current_km: Number(currentKm || 0),
        last_service_km: Number(lastServiceKm || 0),
        service_interval_km: Number(serviceIntervalKm || selectedCar.service_interval_km || 5000),
        address_id: selectedAddress?.id || null,
        address_text: addressText,
        latitude: selectedAddress?.latitude || null,
        longitude: selectedAddress?.longitude || null,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        note: note.trim() || null,
      });
      setSuccessNumber(request.request_number);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ثبت درخواست سرویس انجام نشد.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!purchasedProducts.length) {
    return (
      <main className="min-h-screen bg-navy-950 px-4 pb-16 pt-28 text-white" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[2rem] border border-gold-500/25 bg-gradient-to-l from-gold-500/15 via-white/[0.04] to-sky-500/10 p-6 shadow-2xl shadow-black/20 md:p-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gold-500 text-navy-950">
                <PackageSearch className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-black md:text-4xl">اول محصول موردنظرت را انتخاب کن</h1>
              <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
                سرویس در محل فقط بعد از انتخاب محصول فعال می‌شود. ابتدا روغن، فیلتر یا پکیج مناسب خودرو را به سبد خرید اضافه کن؛ سپس در مرحله ثبت سفارش گزینه «خرید + سرویس در محل» نمایش داده می‌شود.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold-500 px-6 py-4 font-black text-navy-950 transition hover:bg-gold-400">
                  <ShoppingCart className="h-5 w-5" /> انتخاب محصول
                </Link>
                <Link to="/cart" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10">
                  مشاهده سبد خرید
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy-950 px-4 pb-16 pt-28 text-white" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-gold-500/20 bg-gradient-to-l from-gold-500/20 via-white/[0.04] to-sky-500/10 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gold-500 px-4 py-1 text-xs font-black text-navy-950">
                <Wrench className="h-4 w-4" /> رزرو سرویس در محل
              </div>
              <h1 className="text-2xl font-black md:text-4xl">سرویس خودرو بر اساس کیلومتر، نه تاریخ</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">خودروی انتخاب‌شده، کیلومتر فعلی، آخرین سرویس و آدرس ذخیره‌شده را وارد کن تا درخواست سرویس برای پنل مدیریت ثبت شود.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-navy-950/70 p-4 text-sm text-white/70">
              <div>سرویس بعدی پیشنهادی</div>
              <div className="mt-1 text-2xl font-black text-gold-400">{nextServiceKm.toLocaleString('fa-IR')} کیلومتر</div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-emerald-200">محصول انتخاب‌شده برای سرویس</h2>
              <p className="mt-1 text-sm text-white/60">سرویس در محل برای سفارش فعلی فعال شده است.</p>
            </div>
            <Link to="/cart" className="text-sm font-bold text-gold-300 hover:text-gold-200">ویرایش سبد خرید</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {purchasedProducts.map((item, index) => (
              <span key={`${item.product_id || item.id || index}`} className="rounded-xl border border-white/10 bg-navy-950/50 px-3 py-2 text-sm text-white/80">
                {cartProductName(item)} × {Math.max(1, Number(item.quantity || item.qty || 1)).toLocaleString('fa-IR')}
              </span>
            ))}
          </div>
        </section>

        {successNumber ? (
          <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-300" />
            <h2 className="text-2xl font-black">درخواست سرویس ثبت شد</h2>
            <p className="mt-3 text-white/70">شماره درخواست: <span className="font-black text-gold-300">{successNumber}</span></p>
            <p className="mt-2 text-sm text-white/50">وضعیت اولیه درخواست «در انتظار بررسی» است و مدیر از پنل مدیریت آن را تأیید می‌کند.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <section className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80"><UserRound className="h-4 w-4 text-gold-400" /> نام مشتری</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400" placeholder="نام و نام خانوادگی" /></label>
                <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80"><Phone className="h-4 w-4 text-gold-400" /> موبایل</span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400" placeholder="09xxxxxxxxx" inputMode="tel" /></label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-black"><Car className="h-5 w-5 text-gold-400" /> خودروی سرویس</h2>{loading && <Loader2 className="h-5 w-5 animate-spin text-gold-400" />}</div>
                <select value={selectedCarId} onChange={(event) => setSelectedCarId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400">
                  <option value="">انتخاب خودرو از خودروهای تعریف‌شده مدیریت</option>
                  {cars.map((car) => <option key={car.id} value={car.id}>{getCarTitle(car)}</option>)}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80"><Gauge className="h-4 w-4 text-gold-400" /> کیلومتر فعلی</span><input value={currentKm} onChange={(event) => setCurrentKm(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400" inputMode="numeric" placeholder="مثلاً 52000" /></label>
                <label className="block"><span className="mb-2 text-sm font-bold text-white/80">آخرین سرویس</span><input value={lastServiceKm} onChange={(event) => setLastServiceKm(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400" inputMode="numeric" placeholder="مثلاً 45000" /></label>
                <label className="block"><span className="mb-2 text-sm font-bold text-white/80">دوره سرویس</span><input value={serviceIntervalKm} onChange={(event) => setServiceIntervalKm(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400" inputMode="numeric" placeholder="5000" /></label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/80"><Calendar className="h-4 w-4 text-gold-400" /> تاریخ</span><select value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400">{dateOptions.map((date) => <option key={date.value} value={date.value}>{date.label}</option>)}</select></label>
                <label className="block"><span className="mb-2 text-sm font-bold text-white/80">ساعت مراجعه</span><select value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400">{timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
              </div>

              <div>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-black"><MapPin className="h-5 w-5 text-gold-400" /> آدرس سرویس</h2>
                {addresses.length > 0 ? (
                  <div className="grid gap-3">{addresses.map((address) => <button key={address.id} type="button" onClick={() => setSelectedAddressId(address.id || '')} className={`rounded-2xl border p-4 text-right transition ${selectedAddressId === address.id ? 'border-gold-400 bg-gold-500/10' : 'border-white/10 bg-navy-900 hover:border-white/20'}`}><b>{address.title}</b><p className="mt-1 text-sm text-white/55">{formatCustomerAddress(address)}</p></button>)}</div>
                ) : (
                  <textarea value={manualAddress} onChange={(event) => setManualAddress(event.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400" placeholder="اگر آدرس ذخیره‌شده نداری، آدرس سرویس را اینجا بنویس." />
                )}
              </div>

              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-400" placeholder="توضیحات تکمیلی برای سرویس‌کار" />
              {errorMessage && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{errorMessage}</div>}
              <button type="button" onClick={handleSubmit} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-500 px-6 py-4 font-black text-navy-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ClipboardCheck className="h-5 w-5" />}ثبت درخواست سرویس</button>
            </section>

            <aside className="h-fit space-y-4 rounded-[2rem] border border-white/10 bg-navy-900/70 p-5">
              <h2 className="text-lg font-black">خلاصه درخواست</h2>
              <div className="space-y-3 text-sm text-white/65">
                <div className="rounded-2xl bg-white/5 p-4"><b className="text-white">خودرو:</b> {selectedCar ? getCarTitle(selectedCar) : 'انتخاب نشده'}</div>
                <div className="rounded-2xl bg-white/5 p-4"><b className="text-white">سرویس بعدی:</b> {nextServiceKm.toLocaleString('fa-IR')} کیلومتر</div>
                <div className="rounded-2xl bg-white/5 p-4"><b className="text-white">زمان:</b> {preferredDate} - {preferredTime}</div>
                <div className="rounded-2xl bg-white/5 p-4"><b className="text-white">آدرس‌های ذخیره‌شده:</b> {addresses.length.toLocaleString('fa-IR')}</div>
                <div className="rounded-2xl bg-white/5 p-4"><b className="text-white">خودروهای پروفایل:</b> {savedVehicles.length.toLocaleString('fa-IR')}</div>
              </div>
              <p className="text-xs leading-6 text-white/45">بعد از ثبت، درخواست در پنل مدیریت با وضعیت «در انتظار بررسی» نمایش داده می‌شود.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
