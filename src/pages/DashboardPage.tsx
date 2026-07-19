import { useEffect, useMemo, useState } from 'react';
import {
  User,
  Car,
  MapPin,
  FileText,
  LogIn,
  Home,
  Download,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  MessageSquare,
  Gauge,
  Wrench,
  ShieldCheck,
  Clock3,
  ClipboardList,
} from 'lucide-react';
import { deleteCustomerAddress, formatCustomerAddress, getCustomerAddresses, saveCustomerAddress, type CustomerAddress } from '../customer/services/addressApi';
import { getActiveCarsForCustomer, getCarTitle, type Car as AdminCar } from '../admin/services/carsApi';
import { readSelectedCustomerCar, saveSelectedCustomerCar } from '../customer/services/selectedCar';
import MapLocationPicker from '../components/MapLocationPicker';
import { getOrderItems, getOrdersByPhone, type Order } from '../admin/services/ordersApi';
import { downloadInvoicePdf } from '../utils/invoicePdf';
import {
  buildReminders,
  deleteCustomerVehicle,
  getCustomerVehicles,
  getServiceStatusClass,
  getServiceStatusLabel,
  saveCustomerVehicle,
  setDefaultCustomerVehicle,
  updateVehicleKilometers,
  type CustomerVehicle,
  type ServiceReminder,
} from '../customer/services/garageApi';
import { getServiceCatalogItems, getServiceHistory, saveServiceHistory, type ServiceCatalogItem, type ServiceHistoryRecord } from '../customer/services/serviceHistoryApi';

const CARTELL_USER_KEY = 'carrtell_customer_profile';

type CustomerProfile = {
  phone: string;
  fullName?: string;
  preferredContact?: string;
  city?: string;
  address?: string;
};

const IRAN_CITIES = [
  'آبادان','آبیک','آمل','اراک','اردبیل','ارومیه','اسلامشهر','اصفهان','اهواز','ایلام','بابل','بابلسر','بجنورد','بندر انزلی','بندرعباس','بوشهر','بیرجند','پاکدشت','پردیس','پرند','تبریز','تربت حیدریه','تهران','جهرم','چابهار','چهاردانگه','خرم‌آباد','خرمشهر','خمینی‌شهر','دزفول','دماوند','رشت','رفسنجان','رباط کریم','ری','زاهدان','زنجان','ساری','ساوه','سبزوار','سمنان','سنندج','شاهرود','شاهین‌شهر','شهرکرد','شهریار','شیراز','قائم‌شهر','قزوین','قم','کرج','کرمان','کرمانشاه','کاشان','گرگان','گنبد کاووس','لاهیجان','مراغه','مرودشت','مشهد','ملارد','ملایر','نیشابور','ورامین','همدان','یاسوج','یزد'
];

const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[var(--primary,#f5c518)] focus:ring-2 focus:ring-[var(--primary,#f5c518)]/20';
const darkFieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[var(--primary,#f5c518)] focus:ring-2 focus:ring-[var(--primary,#f5c518)]/20';
const optionStyle = { background: '#ffffff', color: '#0f172a' };

const statusLabels: Record<string, string> = {
  pending_payment: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  pending_review: 'در انتظار بررسی',
  pending: 'در انتظار بررسی',
  confirmed: 'تأیید شده',
  processing: 'در حال آماده‌سازی',
  sent: 'ارسال شده',
  completed: 'تحویل شده',
  cancelled: 'لغو شده',
};

const statusBadgeClass: Record<string, string> = {
  pending_payment: 'border-orange-400/20 bg-orange-400/10 text-orange-100',
  paid: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  pending_review: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  pending: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  confirmed: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  processing: 'border-purple-400/20 bg-purple-400/10 text-purple-200',
  sent: 'border-blue-400/20 bg-blue-400/10 text-blue-200',
  completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  cancelled: 'border-red-400/20 bg-red-500/10 text-red-200',
};

function getStatusLabel(status?: string) {
  return statusLabels[status || ''] || 'در انتظار بررسی';
}

function getStatusClass(status?: string) {
  return statusBadgeClass[status || ''] || statusBadgeClass.pending_review;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function toman(value?: number) {
  return `${Number(value || 0).toLocaleString('fa-IR')} تومان`;
}

function km(value?: number | null) {
  return `${Number(value || 0).toLocaleString('fa-IR')} کیلومتر`;
}

const emptyAddress = (phone = ''): CustomerAddress => ({
  customer_phone: phone,
  title: 'خانه',
  province: '',
  city: '',
  district: '',
  street: '',
  plaque: '',
  unit: '',
  description: '',
  latitude: null,
  longitude: null,
  is_default: false,
});

const emptyVehicle = (phone = ''): Partial<CustomerVehicle> => ({
  customer_phone: phone,
  admin_car_id: '',
  title: '',
  brand: '',
  model: '',
  engine: '',
  transmission_type: '',
  plate_number: '',
  current_km: 0,
  last_service_km: 0,
  service_interval_km: 7000,
  is_default: false,
});

type DashboardPanel = 'overview' | 'profile' | 'orders' | 'vehicles' | 'addresses';

function panelFromHash(): DashboardPanel {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  if (hash.includes('orders')) return 'orders';
  if (hash.includes('vehicles')) return 'vehicles';
  if (hash.includes('addresses')) return 'addresses';
  if (hash.includes('profile')) return 'profile';
  return 'overview';
}

export default function DashboardPage() {
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile>(() => readJson<CustomerProfile | null>(CARTELL_USER_KEY, null) || { phone: '' });
  const [form, setForm] = useState<CustomerProfile>(() => readJson<CustomerProfile | null>(CARTELL_USER_KEY, null) || { phone: '' });
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressForm, setAddressForm] = useState<CustomerAddress>(() => emptyAddress(profile.phone));
  const [savingAddress, setSavingAddress] = useState(false);
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [carsError, setCarsError] = useState('');
  const [selectedCarId, setSelectedCarId] = useState(() => readSelectedCustomerCar()?.id || '');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [vehicleForm, setVehicleForm] = useState<Partial<CustomerVehicle>>(() => emptyVehicle(profile.phone));
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryRecord[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [serviceForm, setServiceForm] = useState({ service_type: 'سرویس خارج از Carrtell', service_date: new Date().toISOString().slice(0, 10), service_km: 0, next_service_km: 0, products_used: '', notes: '', warning_notes: '', invoice_image_url: '', changed_ids: [] as string[] });
  const [savingService, setSavingService] = useState(false);
  const [activePanel, setActivePanel] = useState<DashboardPanel>(() => panelFromHash());

  const isLoggedIn = Boolean(profile.phone);
  const selectedAdminCar = cars.find((car) => car.id === selectedCarId);
  const defaultVehicle = vehicles.find((item) => item.is_default) || vehicles[0] || null;
  const reminders = useMemo(() => buildReminders(vehicles), [vehicles]);
  const activeReminder = reminders.find((item) => item.vehicle_id === defaultVehicle?.id) || reminders[0] || null;
  const activeOrder = userOrders.find((order) => !['completed', 'cancelled'].includes(order.status || '')) || userOrders[0] || null;

  const loadCustomerCars = async () => {
    setCarsLoading(true);
    setCarsError('');
    try {
      const items = await getActiveCarsForCustomer();
      setCars(items);
      const saved = readSelectedCustomerCar();
      if (saved?.id && items.some((car) => car.id === saved.id)) setSelectedCarId(saved.id);
    } catch (error: any) {
      setCars([]);
      setCarsError(error?.message || 'لیست خودروها از پنل مدیریت دریافت نشد.');
    } finally {
      setCarsLoading(false);
    }
  };

  const loadGarage = async (customerPhone = profile.phone) => {
    const normalizedPhone = customerPhone.trim();
    if (!normalizedPhone) return;
    const items = await getCustomerVehicles(normalizedPhone);
    setVehicles(items);
  };

  const loadServiceHistory = async (customerPhone = profile.phone, vehicleId = defaultVehicle?.id) => {
    const normalizedPhone = customerPhone.trim();
    if (!normalizedPhone) return;
    const items = await getServiceHistory(normalizedPhone, vehicleId || null);
    setServiceHistory(items);
  };

  useEffect(() => { loadCustomerCars(); getServiceCatalogItems().then(setServiceCatalog).catch(() => setServiceCatalog([])); }, []);

  useEffect(() => {
    const syncPanel = () => setActivePanel(panelFromHash());
    window.addEventListener('hashchange', syncPanel);
    return () => window.removeEventListener('hashchange', syncPanel);
  }, []);

  useEffect(() => {
    if (!profile.phone) return;
    setAddressForm((prev) => ({ ...prev, customer_phone: profile.phone }));
    setVehicleForm((prev) => ({ ...prev, customer_phone: profile.phone }));
    getCustomerAddresses(profile.phone).then(setAddresses).catch(() => setAddresses([]));
    loadGarage(profile.phone).catch(() => setVehicles([]));
  }, [profile.phone]);

  useEffect(() => {
    if (!profile.phone) return;
    loadServiceHistory(profile.phone, defaultVehicle?.id).catch(() => setServiceHistory([]));
  }, [profile.phone, defaultVehicle?.id]);

  const loadCustomerOrders = async (customerPhone = profile.phone) => {
    const normalizedPhone = customerPhone.trim();
    if (!normalizedPhone) {
      setUserOrders([]);
      return;
    }

    setOrdersLoading(true);
    setOrdersError('');
    try {
      const items = await getOrdersByPhone(normalizedPhone);
      setUserOrders(items);
    } catch (error: any) {
      setUserOrders([]);
      setOrdersError(error?.message || 'سفارش‌ها از Supabase دریافت نشدند.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => { if (profile.phone) loadCustomerOrders(profile.phone); }, [profile.phone]);

  const sendCode = () => {
    if (!phone.trim()) return alert('شماره موبایل را وارد کن.');
    setCodeSent(true);
    alert('کد تایید آزمایشی ارسال شد. کد: 1234');
  };

  const login = () => {
    const next = { ...profile, phone };
    localStorage.setItem(CARTELL_USER_KEY, JSON.stringify(next));
    setProfile(next);
    setForm(next);
  };

  const saveProfile = () => {
    localStorage.setItem(CARTELL_USER_KEY, JSON.stringify(form));
    setProfile(form);
    alert('اطلاعات پروفایل ذخیره شد.');
  };

  const saveAddress = async () => {
    if (!profile.phone) return alert('ابتدا شماره موبایل را در پروفایل ثبت کن.');
    if (!addressForm.city || !addressForm.street) return alert('شهر و خیابان/آدرس را وارد کن.');
    setSavingAddress(true);
    try {
      await saveCustomerAddress({ ...addressForm, customer_phone: profile.phone });
      const fresh = await getCustomerAddresses(profile.phone);
      setAddresses(fresh);
      setAddressForm(emptyAddress(profile.phone));
      alert('آدرس ذخیره شد.');
    } catch (error: any) {
      alert(error?.message || 'ذخیره آدرس انجام نشد.');
    } finally {
      setSavingAddress(false);
    }
  };

  const removeAddress = async (id?: string) => {
    if (!id) return;
    if (!confirm('این آدرس حذف شود؟')) return;
    await deleteCustomerAddress(id);
    setAddresses((items) => items.filter((item) => item.id !== id));
  };

  const selectCustomerCar = async (carId: string) => {
    setSelectedCarId(carId);
    const selected = cars.find((car) => car.id === carId);
    saveSelectedCustomerCar(selected || null);
    if (!selected || !defaultVehicle) return;
    await setDefaultCustomerVehicle(profile.phone, defaultVehicle.id);
  };

  const fillVehicleFromAdminCar = (carId: string) => {
    const car = cars.find((item) => item.id === carId);
    if (!car) {
      setVehicleForm((prev) => ({ ...prev, admin_car_id: carId }));
      return;
    }
    setVehicleForm((prev) => ({
      ...prev,
      admin_car_id: car.id,
      title: prev.title || '',
      brand: car.brand,
      model: car.model,
      engine: car.engine || '',
      transmission_type: car.transmission_type || '',
      service_interval_km: Number(car.service_interval_km || prev.service_interval_km || 7000),
    }));
  };

  const saveVehicle = async () => {
    if (!profile.phone) return alert('ابتدا وارد پروفایل شو.');
    if (!vehicleForm.admin_car_id) return alert('خودرو را انتخاب کن.');
    if (!vehicleForm.title?.trim()) return alert('یک نام دلخواه برای خودرو وارد کن؛ مثل خودروی خودم یا ماشین همسرم.');
    setSavingVehicle(true);
    try {
      const selectedAdmin = cars.find((car) => car.id === vehicleForm.admin_car_id);
      const saved = await saveCustomerVehicle({
        ...vehicleForm,
        customer_phone: profile.phone,
        title: vehicleForm.title.trim(),
        brand: vehicleForm.brand || selectedAdmin?.brand || '',
        model: vehicleForm.model || selectedAdmin?.model || '',
        engine: vehicleForm.engine || selectedAdmin?.engine || '',
        transmission_type: vehicleForm.transmission_type || selectedAdmin?.transmission_type || '',
        current_km: Number(vehicleForm.current_km || 0),
        last_service_km: Number(vehicleForm.last_service_km || 0),
        service_interval_km: Number(vehicleForm.service_interval_km || selectedAdmin?.service_interval_km || 7000),
      } as any);
      if (saved.is_default || vehicles.length === 0) {
        await setDefaultCustomerVehicle(profile.phone, saved.id);
        if (selectedAdmin) saveSelectedCustomerCar(selectedAdmin);
      }
      setVehicleForm(emptyVehicle(profile.phone));
      await loadGarage(profile.phone);
      alert('خودرو در گاراژ ذخیره شد.');
    } catch (error: any) {
      alert(error?.message || 'ذخیره خودرو انجام نشد.');
    } finally {
      setSavingVehicle(false);
    }
  };

  const makeVehicleDefault = async (vehicle: CustomerVehicle) => {
    await setDefaultCustomerVehicle(profile.phone, vehicle.id);
    setSelectedCarId(vehicle.admin_car_id || '');
    saveSelectedCustomerCar({
      id: vehicle.id,
      title: vehicle.title,
      brand: vehicle.brand || undefined,
      model: vehicle.model || undefined,
      engine: vehicle.engine || undefined,
      transmission_type: vehicle.transmission_type || null,
    });
    await loadGarage(profile.phone);
  };

  const removeVehicle = async (vehicle: CustomerVehicle) => {
    if (!confirm('این خودرو از گاراژ حذف شود؟')) return;
    await deleteCustomerVehicle(vehicle.id);
    await loadGarage(profile.phone);
  };

  const saveKmUpdate = async (vehicle: CustomerVehicle) => {
    const currentKm = Number(prompt('کیلومتر فعلی خودرو را وارد کن:', String(vehicle.current_km || 0)) || vehicle.current_km || 0);
    await updateVehicleKilometers(vehicle, currentKm);
    await loadGarage(profile.phone);
  };

  const saveServiceRecord = async () => {
    if (!defaultVehicle) return alert('ابتدا یک خودرو در گاراژ انتخاب کن.');
    const serviceKm = Number(serviceForm.service_km || defaultVehicle.current_km || 0);
    if (!serviceKm) return alert('کیلومتر انجام سرویس را وارد کن.');
    setSavingService(true);
    try {
      const nextKm = Number(serviceForm.next_service_km || 0);
      if (!nextKm) return alert('کیلومتر سرویس بعدی را به‌صورت دستی وارد کن.');
      if (nextKm <= serviceKm) return alert('کیلومتر سرویس بعدی باید بیشتر از کیلومتر انجام سرویس باشد.');
      const changedItems = serviceCatalog.filter((item) => serviceForm.changed_ids.includes(item.id)).map((item) => ({ id: item.id, title: item.title, emoji: item.emoji || '🔧' }));
      await saveServiceHistory({
        customer_phone: profile.phone,
        vehicle_id: defaultVehicle.id,
        vehicle_title: defaultVehicle.title,
        source: 'customer',
        performed_by_name: form.fullName || 'ثبت‌شده توسط مشتری',
        service_type: serviceForm.service_type,
        service_date: serviceForm.service_date,
        service_km: serviceKm,
        next_service_km: nextKm,
        changed_items: changedItems,
        products_used: serviceForm.products_used.split(',').map((item) => item.trim()).filter(Boolean),
        notes: serviceForm.notes,
        warning_notes: serviceForm.warning_notes,
        invoice_image_url: serviceForm.invoice_image_url || null,
      });
      await updateVehicleKilometers(defaultVehicle, serviceKm, serviceKm);
      setServiceForm({ service_type: 'سرویس خارج از Carrtell', service_date: new Date().toISOString().slice(0, 10), service_km: 0, next_service_km: 0, products_used: '', notes: '', warning_notes: '', invoice_image_url: '', changed_ids: [] });
      await loadGarage(profile.phone);
      await loadServiceHistory(profile.phone, defaultVehicle.id);
      alert('دفترچه سرویس به‌روزرسانی شد.');
    } catch (error: any) {
      alert(error?.message || 'ثبت سرویس انجام نشد.');
    } finally {
      setSavingService(false);
    }
  };

  const downloadInvoice = async (order: Order) => {
    setDownloadingInvoiceId(order.id);
    try {
      const items = await getOrderItems(order.id);
      downloadInvoicePdf(order, items);
    } catch (error: any) {
      alert(error?.message || 'دانلود فاکتور انجام نشد.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const summaryCards: Array<{ panel: DashboardPanel; icon: typeof FileText; title: string; value: string; hint: string }> = [
    { panel: 'orders', icon: FileText, title: 'سفارش‌ها', value: userOrders.length.toLocaleString('fa-IR'), hint: activeOrder ? getStatusLabel(activeOrder.status) : 'سفارشی ثبت نشده' },
    { panel: 'vehicles', icon: Car, title: 'خودروهای من', value: vehicles.length.toLocaleString('fa-IR'), hint: defaultVehicle?.title || 'خودرویی ثبت نشده' },
    { panel: 'addresses', icon: MapPin, title: 'آدرس‌ها', value: addresses.length.toLocaleString('fa-IR'), hint: addresses.find((item) => item.is_default)?.title || 'آدرس پیش‌فرض ندارد' },
    { panel: 'profile', icon: User, title: 'حساب کاربری', value: form.fullName ? 'تکمیل شده' : 'نیاز به تکمیل', hint: form.phone || 'شماره موبایل ثبت نشده' },
  ];

  if (!isLoggedIn) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f6f7f9] text-slate-900 px-4 pb-10 pt-32">
        <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <LogIn className="text-[var(--primary,#f5c518)]" />
            <div>
              <h1 className="text-2xl font-black">ورود به پروفایل</h1>
              <p className="text-sm text-slate-500">برای مشاهده سفارش‌ها، گاراژ و دفترچه سرویس شماره موبایل را وارد کن.</p>
            </div>
          </div>

          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره موبایل" className={`mb-3 ${darkFieldClass}`} />
          {codeSent && <input placeholder="کد تایید: 1234" className={`mb-3 ${darkFieldClass}`} />}
          <button onClick={codeSent ? login : sendCode} className="w-full rounded-2xl bg-[var(--primary,#f5c518)] py-4 font-black text-black">
            {codeSent ? 'ورود به پروفایل' : 'ارسال کد تایید'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f6f7f9] text-slate-900 px-4 pb-8 pt-32">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-bold text-[var(--primary,#f5c518)]">پنل کاربری Carrtell</p>
              <h1 className="text-2xl font-black">سلام {form.fullName || 'مشتری عزیز'} 👋</h1>
              <p className="mt-1 text-sm text-slate-500">همه اطلاعات سفارش، خودرو و سرویس‌هایت یکجا در دسترس است.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/book" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black"><Wrench size={18} /> رزرو سرویس</a>
              <a href="/shop" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-bold"><Home size={18} /> فروشگاه</a>
            </div>
          </div>
        </header>

        <nav className="sticky top-24 z-20 grid grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-900/5 backdrop-blur sm:grid-cols-5">
          {([
            ['overview', 'خلاصه', Home],
            ['orders', 'سفارش‌ها', FileText],
            ['vehicles', 'خودرو و سلامت', Car],
            ['addresses', 'آدرس‌ها', MapPin],
            ['profile', 'حساب کاربری', User],
          ] as const).map(([panel, label, Icon]) => (
            <button key={String(panel)} type="button" onClick={() => { setActivePanel(panel as DashboardPanel); window.history.replaceState(null, '', panel === 'overview' ? '/dashboard' : `#${panel}`); }} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition ${activePanel === panel ? 'bg-[var(--primary,#f5c518)] text-black shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={17} />{label}</button>
          ))}
        </nav>

        {activePanel === 'overview' && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button type="button" key={card.title} onClick={() => { setActivePanel(card.panel); window.history.replaceState(null, '', `#${card.panel}`); }} className="rounded-3xl border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary,#f5c518)]/60 hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--primary,#f5c518)]/15"><Icon className="text-[var(--primary,#f5c518)]" /></span><span className="text-xs text-slate-500">مشاهده ←</span></div>
                    <div className="text-sm text-slate-500">{card.title}</div><div className="mt-1 text-2xl font-black">{card.value}</div><div className="mt-2 truncate text-xs text-slate-500">{card.hint}</div>
                  </button>
                );
              })}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="font-black">وضعیت فعلی</h2><p className="mt-1 text-xs text-slate-500">مهم‌ترین اطلاعات حساب تو</p></div><Clock3 className="text-[var(--primary,#f5c518)]" /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">آخرین سفارش</p><p className="mt-2 font-black">{activeOrder ? (activeOrder.order_number || 'سفارش اخیر') : 'سفارشی ثبت نشده'}</p><p className="mt-1 text-sm text-[var(--primary,#f5c518)]">{activeOrder ? getStatusLabel(activeOrder.status) : 'از فروشگاه شروع کن'}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">خودروی فعال</p><p className="mt-2 font-black">{defaultVehicle?.title || selectedAdminCar ? (defaultVehicle?.title || getCarTitle(selectedAdminCar!)) : 'خودرو انتخاب نشده'}</p><p className="mt-1 text-sm text-slate-500">{defaultVehicle ? `کیلومتر فعلی: ${km(defaultVehicle.current_km)}` : 'برای پیشنهاد دقیق خودرو را اضافه کن'}</p></div>
                </div>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5">
                <h2 className="font-black">دسترسی سریع</h2>
                <div className="mt-4 grid gap-2">
                  <a href="/book" className="flex items-center justify-between rounded-2xl bg-[var(--primary,#f5c518)] px-4 py-3 font-black text-black"><span>رزرو سرویس در محل</span><Wrench size={18} /></a>
                  <button onClick={() => setActivePanel('vehicles')} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold"><span>پرونده سلامت خودرو</span><ShieldCheck size={18} /></button>
                  <button onClick={() => setActivePanel('addresses')} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold"><span>مدیریت آدرس‌ها</span><MapPin size={18} /></button>
                </div>
              </article>
            </section>
          </>
        )}

        {activePanel === 'overview' && defaultVehicle && activeReminder && (
          <section className={`rounded-3xl border p-5 ${getServiceStatusClass(activeReminder.status)}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Gauge className="shrink-0" />
                <div>
                  <h2 className="font-black">یادآوری سرویس کیلومتری {defaultVehicle.title}</h2>
                  <p className="text-sm leading-7 opacity-90">کیلومتر فعلی: {km(defaultVehicle.current_km)} | سرویس بعدی: {km(activeReminder.next_service_km)} | {getServiceStatusLabel(activeReminder.status)}</p>
                </div>
              </div>
              <a href="/book" className="rounded-2xl bg-black/30 px-5 py-3 font-black text-slate-900">رزرو سرویس</a>
            </div>
          </section>
        )}

        {activePanel === 'profile' && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><User className="text-[var(--primary,#f5c518)]" /><h2 className="text-xl font-black">اطلاعات مشتری</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-500">نام و نام خانوادگی
                <input value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-500">شماره تماس
                <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} />
              </label>
              <label className="space-y-1 text-sm text-slate-500">روش ارتباط
                <select value={form.preferredContact || ''} onChange={(e) => setForm({ ...form, preferredContact: e.target.value })} className={fieldClass}>
                  <option style={optionStyle} value="">انتخاب کن</option><option style={optionStyle} value="phone">تماس تلفنی</option><option style={optionStyle} value="sms">پیامک</option><option style={optionStyle} value="whatsapp">واتساپ</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-slate-500">شهر
                <select value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} className={fieldClass}>
                  <option style={optionStyle} value="">انتخاب شهر</option>{IRAN_CITIES.map((city) => <option style={optionStyle} key={city} value={city}>{city}</option>)}
                </select>
              </label>
            </div>
            <button onClick={saveProfile} className="mt-4 rounded-2xl bg-[var(--primary,#f5c518)] px-6 py-3 font-black text-black">ذخیره اطلاعات</button>
          </div>

          <div id="vehicles" className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><Car className="text-[var(--primary,#f5c518)]" /><h2 className="text-xl font-black">خودروی فعال سایت</h2></div>
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <label className="block text-sm font-bold text-slate-500">انتخاب خودرو از پنل مدیریت
                <select value={selectedCarId} onChange={(e) => selectCustomerCar(e.target.value)} className={`mt-2 ${fieldClass}`} disabled={carsLoading}>
                  <option style={optionStyle} value="">{carsLoading ? 'در حال دریافت خودروها...' : 'انتخاب خودرو'}</option>
                  {cars.map((car) => <option style={optionStyle} key={car.id} value={car.id}>{getCarTitle(car)}</option>)}
                </select>
                {carsError && <p className="mt-2 text-xs text-red-300">{carsError}</p>}
                <button type="button" onClick={loadCustomerCars} className="mt-3 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-200">بروزرسانی لیست خودروها</button>
              </label>
              {selectedAdminCar ? (
                <div className="rounded-2xl border border-[var(--primary,#f5c518)]/20 bg-[var(--primary,#f5c518)]/10 p-4 text-sm leading-7 text-slate-500">
                  <b className="block text-slate-900">{getCarTitle(selectedAdminCar)}</b>
                  {selectedAdminCar.transmission_type && <span>گیربکس: {selectedAdminCar.transmission_type}</span>}
                  {selectedAdminCar.service_interval_km ? <span className="block">دوره سرویس پیشنهادی: {km(selectedAdminCar.service_interval_km)}</span> : null}
                  <p className="mt-2 text-xs text-[var(--primary,#f5c518)]">محصولات، پکیج‌ها و پیشنهادها بر اساس همین خودرو اولویت می‌گیرند.</p>
                </div>
              ) : <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">خودروت را انتخاب کن تا کل سایت بر اساس آن فیلتر شود.</div>}
            </div>
          </div>
        </section>
        )}

        {activePanel === 'vehicles' && (
        <>
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ShieldCheck className="text-[var(--primary,#f5c518)]" /><h2 className="text-xl font-black">گاراژ من</h2></div>
            <button onClick={() => { setVehicleForm(emptyVehicle(profile.phone)); }} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold">فرم خودرو جدید</button>
          </div>
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 font-black"><Plus size={18} className="text-[var(--primary,#f5c518)]" /> افزودن / ویرایش خودرو</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={vehicleForm.admin_car_id || ''} onChange={(e) => fillVehicleFromAdminCar(e.target.value)} className={fieldClass}>
                  <option style={optionStyle} value="">انتخاب از خودروهای مدیریت</option>
                  {cars.map((car) => <option style={optionStyle} value={car.id} key={car.id}>{getCarTitle(car)}</option>)}
                </select>
                <input value={vehicleForm.title || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, title: e.target.value })} placeholder="نام دلخواه خودرو؛ مثال: خودروی خودم یا ماشین همسرم" className={fieldClass} />
                <input value={vehicleForm.plate_number || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })} placeholder="پلاک" className={fieldClass} />
                <input type="number" value={vehicleForm.model_year || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, model_year: Number(e.target.value || 0) })} placeholder="سال ساخت" className={fieldClass} />
                <input type="number" value={vehicleForm.current_km || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, current_km: Number(e.target.value || 0) })} placeholder="کیلومتر فعلی" className={fieldClass} />
                <input type="number" value={vehicleForm.last_service_km || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, last_service_km: Number(e.target.value || 0) })} placeholder="کیلومتر آخرین سرویس" className={fieldClass} />
                <input type="number" value={vehicleForm.service_interval_km || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, service_interval_km: Number(e.target.value || 7000) })} placeholder="بازه سرویس کیلومتری" className={fieldClass} />
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm"><input type="checkbox" checked={Boolean(vehicleForm.is_default)} onChange={(e) => setVehicleForm({ ...vehicleForm, is_default: e.target.checked })} /> خودرو پیش‌فرض باشد</label>
              </div>
              <textarea value={vehicleForm.notes || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} placeholder="یادداشت خودرو" className={`mt-3 ${fieldClass}`} rows={2} />
              <button disabled={savingVehicle} onClick={saveVehicle} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black disabled:opacity-60"><Save size={18} /> {savingVehicle ? 'در حال ذخیره...' : 'ذخیره خودرو'}</button>
            </div>

            <div className="space-y-3">
              {vehicles.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">هنوز خودرویی در گاراژ ثبت نشده است.</div>
              ) : vehicles.map((vehicle) => {
                const reminder = reminders.find((item) => item.vehicle_id === vehicle.id) as ServiceReminder | undefined;
                return (
                  <article key={vehicle.id} className={`rounded-3xl border p-4 ${vehicle.is_default ? 'border-[var(--primary,#f5c518)]/40 bg-[var(--primary,#f5c518)]/10' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <b className="block text-lg">{vehicle.title}</b>
                        <p className="text-sm text-slate-500">{vehicle.plate_number || 'بدون پلاک'} | کیلومتر فعلی: {km(vehicle.current_km)}</p>
                      </div>
                      {vehicle.is_default && <span className="rounded-full bg-[var(--primary,#f5c518)] px-3 py-1 text-xs font-black text-black">پیش‌فرض</span>}
                    </div>
                    {reminder && <div className={`mb-3 rounded-2xl border px-3 py-2 text-sm ${getServiceStatusClass(reminder.status)}`}>سرویس بعدی: {km(reminder.next_service_km)} — {getServiceStatusLabel(reminder.status)}</div>}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => makeVehicleDefault(vehicle)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold">انتخاب به‌عنوان خودرو فعال</button>
                      <button onClick={() => setVehicleForm(vehicle)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold"><Edit3 size={14} className="inline" /> ویرایش</button>
                      <button onClick={() => saveKmUpdate(vehicle)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold"><Gauge size={14} className="inline" /> بروزرسانی کیلومتر</button>
                      <button onClick={() => removeVehicle(vehicle)} className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200"><Trash2 size={14} className="inline" /> حذف</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2"><ClipboardList className="text-[var(--primary,#f5c518)]" /><h2 className="text-xl font-black">دفترچه سرویس دیجیتال</h2></div>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 font-black">➕ ثبت سرویس خارج از Carrtell</div>
              <p className="mb-4 text-xs leading-6 text-slate-500">سرویس‌هایی که در تعمیرگاه دیگری انجام شده‌اند با برچسب «ثبت‌شده توسط مشتری» در پرونده خودرو ذخیره می‌شوند.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={serviceForm.service_type} onChange={(e) => setServiceForm({ ...serviceForm, service_type: e.target.value })} placeholder="عنوان سرویس" className={fieldClass} />
                <input type="date" value={serviceForm.service_date} onChange={(e) => setServiceForm({ ...serviceForm, service_date: e.target.value })} className={fieldClass} />
                <input type="number" value={serviceForm.service_km || ''} onChange={(e) => setServiceForm({ ...serviceForm, service_km: Number(e.target.value || 0) })} placeholder="کیلومتر انجام سرویس" className={fieldClass} />
                <input type="number" value={serviceForm.next_service_km || ''} onChange={(e) => setServiceForm({ ...serviceForm, next_service_km: Number(e.target.value || 0) })} placeholder="کیلومتر سرویس بعدی (ثبت دستی)" className={fieldClass} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{serviceCatalog.map((item) => { const active = serviceForm.changed_ids.includes(item.id); return <button type="button" key={item.id} onClick={() => setServiceForm({ ...serviceForm, changed_ids: active ? serviceForm.changed_ids.filter((id) => id !== item.id) : [...serviceForm.changed_ids, item.id] })} className={`rounded-2xl border p-3 text-right text-sm ${active ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-100' : 'border-slate-200 bg-slate-50 text-slate-500'}`}><span className="ml-2">{item.emoji || '🔧'}</span>{item.title}</button>})}</div>
              <input value={serviceForm.products_used} onChange={(e) => setServiceForm({ ...serviceForm, products_used: e.target.value })} placeholder="محصولات مصرفی، با کاما جدا کن" className={`mt-3 ${fieldClass}`} />
              <textarea value={serviceForm.notes} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })} placeholder="توضیحات سرویس" className={`mt-3 ${fieldClass}`} rows={2} />
              <textarea value={serviceForm.warning_notes} onChange={(e) => setServiceForm({ ...serviceForm, warning_notes: e.target.value })} placeholder="هشدار یا مورد نیازمند بررسی در آینده" className={`mt-3 ${fieldClass}`} rows={2} />
              <input value={serviceForm.invoice_image_url} onChange={(e) => setServiceForm({ ...serviceForm, invoice_image_url: e.target.value })} placeholder="لینک تصویر فاکتور (اختیاری)" className={`mt-3 ${fieldClass}`} />
              <button disabled={savingService || !defaultVehicle} onClick={saveServiceRecord} className="mt-4 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black disabled:opacity-60">ثبت در پرونده سلامت خودرو</button>
            </div>
            <div className="space-y-3">
              {serviceHistory.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">هنوز سابقه سرویس ثبت نشده است.</div>
              ) : serviceHistory.map((item) => (
                <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><b>{item.service_type}</b><span className={`mr-2 rounded-full px-2 py-1 text-[10px] font-bold ${item.source === 'carrtell' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-sky-500/15 text-sky-200'}`}>{item.source === 'carrtell' ? 'سرویس Carrtell' : 'ثبت‌شده توسط مشتری'}</span></div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs"><Clock3 size={12} className="inline" /> {item.created_at ? new Date(item.created_at).toLocaleDateString('fa-IR') : 'ثبت دستی'}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-500">کیلومتر سرویس: {km(item.service_km)} | سرویس بعدی: {km(item.next_service_km || 0)}</p>
                  {item.changed_items?.length ? <p className="mt-2 text-xs text-emerald-200">تعویض‌شده‌ها: {item.changed_items.map((part) => `${part.emoji || '🔧'} ${part.title}`).join('، ')}</p> : null}{item.products_used?.length ? <p className="text-xs text-slate-500">مصرفی‌ها: {item.products_used.join('، ')}</p> : null}{item.warning_notes ? <p className="mt-2 rounded-xl bg-amber-400/10 p-2 text-xs text-amber-100">هشدار: {item.warning_notes}</p> : null}{item.invoice_image_url ? <a href={item.invoice_image_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-[var(--primary,#f5c518)]">مشاهده تصویر فاکتور</a> : null}
                  {item.notes ? <p className="mt-2 text-sm text-slate-500">{item.notes}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
        </>
        )}

        {activePanel === 'addresses' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2"><MapPin className="text-[var(--primary,#f5c518)]" /><h2 className="text-xl font-black">آدرس‌های منتخب</h2></div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 font-black"><Plus size={18} className="text-[var(--primary,#f5c518)]" /> افزودن / ویرایش آدرس</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={addressForm.title || ''} onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })} placeholder="عنوان آدرس: خانه، محل کار..." className={fieldClass} />
                <select value={addressForm.city || ''} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className={fieldClass}>
                  <option style={optionStyle} value="">انتخاب شهر</option>{IRAN_CITIES.map((city) => <option style={optionStyle} key={city} value={city}>{city}</option>)}
                </select>
                <input value={addressForm.district || ''} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} placeholder="محله" className={fieldClass} />
                <input value={addressForm.street || ''} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} placeholder="خیابان / آدرس اصلی" className={fieldClass} />
                <input value={addressForm.plaque || ''} onChange={(e) => setAddressForm({ ...addressForm, plaque: e.target.value })} placeholder="پلاک" className={fieldClass} />
                <input value={addressForm.unit || ''} onChange={(e) => setAddressForm({ ...addressForm, unit: e.target.value })} placeholder="واحد" className={fieldClass} />
                <input value={addressForm.latitude ?? ''} onChange={(e) => setAddressForm({ ...addressForm, latitude: e.target.value ? Number(e.target.value) : null })} placeholder="Latitude نشان" className={fieldClass} />
                <input value={addressForm.longitude ?? ''} onChange={(e) => setAddressForm({ ...addressForm, longitude: e.target.value ? Number(e.target.value) : null })} placeholder="Longitude نشان" className={fieldClass} />
              </div>
              <MapLocationPicker initialLatitude={addressForm.latitude} initialLongitude={addressForm.longitude} onConfirm={(location) => setAddressForm((prev) => ({ ...prev, latitude: location.latitude, longitude: location.longitude }))} />
              <textarea value={addressForm.description || ''} onChange={(e) => setAddressForm({ ...addressForm, description: e.target.value })} placeholder="توضیحات تکمیلی آدرس" rows={2} className={`mt-3 ${fieldClass}`} />
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" checked={Boolean(addressForm.is_default)} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} /> آدرس پیش‌فرض باشد</label>
              <button disabled={savingAddress} onClick={saveAddress} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black disabled:opacity-60"><Save size={18} /> {savingAddress ? 'در حال ذخیره...' : 'ذخیره آدرس'}</button>
            </div>

            <div className="space-y-3">
              {addresses.length === 0 ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">هنوز آدرس منتخبی ثبت نشده است.</div> : addresses.map((address) => (
                <article key={address.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <b>{address.title || 'آدرس منتخب'} {address.is_default ? <span className="mr-2 rounded-full bg-[var(--primary,#f5c518)] px-2 py-1 text-xs text-black">پیش‌فرض</span> : null}</b>
                    <div className="flex gap-2">
                      <button onClick={() => setAddressForm(address)} className="rounded-xl bg-slate-100 p-2" title="ویرایش"><Edit3 size={16} /></button>
                      <button onClick={() => removeAddress(address.id)} className="rounded-xl bg-red-500/15 p-2 text-red-300" title="حذف"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-slate-500">{formatCustomerAddress(address)}</p>
                  {(address.latitude || address.longitude) && <p className="mt-1 text-xs text-slate-500">مختصات نشان: {address.latitude || '-'} ، {address.longitude || '-'}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
        )}

        {activePanel === 'orders' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><FileText className="text-[var(--primary,#f5c518)]" /><h2 className="text-xl font-black">سفارش‌ها و فاکتورها</h2></div>
            <button type="button" onClick={() => loadCustomerOrders()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-200"><RefreshCw size={16} /> بروزرسانی سفارش‌ها</button>
          </div>

          {ordersError && <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{ordersError}</div>}
          {ordersLoading ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">در حال دریافت سفارش‌ها از Supabase...</div> : userOrders.length === 0 ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">هنوز سفارشی برای این شماره موبایل ثبت نشده است.</div> : (
            <div className="space-y-3">{userOrders.map((order, index) => (
              <div key={order.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2"><div className="font-black">{order.order_number || order.id || `سفارش ${index + 1}`}</div><span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span></div>
                    <div className="text-sm leading-7 text-slate-500">مبلغ: {toman(order.total_amount)} | تعداد کالا: {Number(order.items_count || 0).toLocaleString('fa-IR')}{order.created_at ? <span className="block">تاریخ ثبت: {new Date(order.created_at).toLocaleString('fa-IR')}</span> : null}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={downloadingInvoiceId === order.id} onClick={() => downloadInvoice(order)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary,#f5c518)] px-4 py-2 font-bold text-black disabled:opacity-60"><Download size={16} /> {downloadingInvoiceId === order.id ? 'در حال ساخت...' : 'دانلود PDF'}</button>
                    {order.id && <a href={`/invoice/${order.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-900 hover:bg-slate-200">مشاهده فاکتور</a>}
                    {order.id && <a href={`/review/${order.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-900 hover:bg-slate-200"><MessageSquare size={16} /> ثبت نظر</a>}
                  </div>
                </div>
              </div>
            ))}</div>
          )}
        </section>
        )}
      </div>
    </main>
  );
}
