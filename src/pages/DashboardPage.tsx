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
  LogOut,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { deleteCustomerAddress, formatCustomerAddress, getCustomerAddresses, saveCustomerAddress, type CustomerAddress } from '../customer/services/addressApi';
import { getActiveCarsForCustomer, getCarTitle, type Car as AdminCar } from '../admin/services/carsApi';
import { readSelectedCustomerCar, saveSelectedCustomerCar } from '../customer/services/selectedCar';
import MapLocationPicker from '../components/MapLocationPicker';
import { getOrderItems, getOrdersByPhone, type Order } from '../admin/services/ordersApi';
import { downloadInvoicePdf } from '../utils/invoicePdf';
import { useAuth } from '../auth/AuthProvider';
import { deleteCurrentCustomerAccount, setCustomerCredentials } from '../auth/authApi';
import { requestOtp, verifyOtp } from '../services/smsOtpApi';
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
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile>(() => readJson<CustomerProfile | null>(CARTELL_USER_KEY, null) || { phone: '' });
  const [form, setForm] = useState<CustomerProfile>(() => readJson<CustomerProfile | null>(CARTELL_USER_KEY, null) || { phone: '' });
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressForm, setAddressForm] = useState<CustomerAddress>(() => emptyAddress(profile.phone));
  const [savingAddress, setSavingAddress] = useState(false);
  const [cars, setCars] = useState<AdminCar[]>([]);
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
  const [credentialUsername, setCredentialUsername] = useState(user?.username || '');
  const [credentialPassword, setCredentialPassword] = useState('');
  const [credentialConfirm, setCredentialConfirm] = useState('');
  const [credentialBusy, setCredentialBusy] = useState(false);
  const [credentialNotice, setCredentialNotice] = useState('');
  const [deleteStep, setDeleteStep] = useState<'idle' | 'otp'>('idle');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState('');

  const isLoggedIn = Boolean(user?.id && user?.phone);

  useEffect(() => { setCredentialUsername(user?.username || ''); }, [user?.username]);

  async function saveLoginCredentials() {
    setCredentialNotice('');
    if (credentialPassword !== credentialConfirm) return setCredentialNotice('تکرار رمز عبور با رمز جدید یکسان نیست.');
    setCredentialBusy(true);
    try {
      await setCustomerCredentials(credentialUsername, credentialPassword);
      setCredentialPassword(''); setCredentialConfirm('');
      setCredentialNotice('نام کاربری و رمز عبور با موفقیت ذخیره شد.');
    } catch (error) { setCredentialNotice(error instanceof Error ? error.message : 'ذخیره اطلاعات ورود انجام نشد.'); }
    finally { setCredentialBusy(false); }
  }

  async function logoutFromDashboard() {
    await signOut();
    window.location.assign('/');
  }

  async function requestAccountDeleteOtp() {
    if (!form.phone) return setDeleteNotice('شماره موبایل حساب پیدا نشد.');
    if (!window.confirm('حذف حساب دائمی است. برای ادامه کد تأیید پیامکی ارسال شود؟')) return;
    setDeleteBusy(true); setDeleteNotice('');
    try {
      await requestOtp(form.phone);
      setDeleteStep('otp');
      setDeleteNotice('کد تأیید به شماره حساب ارسال شد.');
    } catch (error) { setDeleteNotice(error instanceof Error ? error.message : 'ارسال کد انجام نشد.'); }
    finally { setDeleteBusy(false); }
  }

  async function confirmAccountDeletion() {
    if (!deleteOtp.trim()) return setDeleteNotice('کد تأیید را وارد کنید.');
    setDeleteBusy(true); setDeleteNotice('');
    try {
      const verified = await verifyOtp(form.phone, deleteOtp.trim());
      if (!verified.ok) throw new Error('کد تأیید صحیح نیست.');
      await deleteCurrentCustomerAccount();
      window.location.assign('/?accountDeleted=1');
    } catch (error) { setDeleteNotice(error instanceof Error ? error.message : 'حذف حساب انجام نشد.'); }
    finally { setDeleteBusy(false); }
  }
  const selectedAdminCar = cars.find((car) => car.id === selectedCarId);
  const defaultVehicle = vehicles.find((item) => item.is_default) || vehicles[0] || null;
  const reminders = useMemo(() => buildReminders(vehicles), [vehicles]);
  const activeReminder = reminders.find((item) => item.vehicle_id === defaultVehicle?.id) || reminders[0] || null;
  const activeOrder = userOrders.find((order) => !['completed', 'cancelled'].includes(order.status || '')) || userOrders[0] || null;

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id || !user.phone) {
      setProfile({ phone: '' });
      setForm({ phone: '' });
      setUserOrders([]);
      setVehicles([]);
      setAddresses([]);
      setServiceHistory([]);
      return;
    }

    const localPhone = user.phone.replace(/^\+98/, '0');
    const next: CustomerProfile = {
      phone: localPhone,
      fullName: user.fullName || undefined,
    };
    localStorage.setItem(CARTELL_USER_KEY, JSON.stringify(next));
    setProfile(next);
    setForm((current) => current.phone === localPhone ? { ...current, phone: localPhone, fullName: current.fullName || next.fullName } : next);
  }, [authLoading, user?.id, user?.phone, user?.fullName]);

  const loadCustomerCars = async () => {
    try {
      const items = await getActiveCarsForCustomer();
      setCars(items);
      const saved = readSelectedCustomerCar();
      if (saved?.id && items.some((car) => car.id === saved.id)) setSelectedCarId(saved.id);
    } catch {
      setCars([]);
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

  if (!isLoggedIn) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f6f7f9] text-slate-900 px-4 pb-10 pt-8">
        <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <LogIn className="text-[var(--primary,#f5c518)]" />
            <div>
              <h1 className="text-2xl font-black">ورود به حساب Carrtell</h1>
              <p className="text-sm text-slate-500">برای مشاهده سفارش‌ها و خودروهای خود با شماره موبایل وارد شوید.</p>
            </div>
          </div>
          <a href="/login-otp?returnTo=%2Fdashboard" className="block w-full rounded-2xl bg-[var(--primary,#f5c518)] py-4 text-center font-black text-black">ورود / ثبت‌نام</a>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="ct-customer-dashboard min-h-screen bg-[#08111f] text-slate-100 px-4 pb-8 pt-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-bold text-[var(--primary,#f5c518)]">پنل کاربری Carrtell</p>
              <h1 className="text-2xl font-black">{form.fullName?.trim() ? `سلام، ${form.fullName.trim()}` : 'سلام، خوش آمدید'} 👋</h1>
              <p className="mt-1 text-sm text-slate-500">همه اطلاعات سفارش، خودرو و سرویس‌هایت یکجا در دسترس است.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/book" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary,#f5c518)] px-5 py-3 font-black text-black"><Wrench size={18} /> رزرو سرویس</a>
              <button type="button" onClick={() => void logoutFromDashboard()} className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 font-black text-rose-700"><LogOut size={18} /> خروج از حساب</button>
            </div>
          </div>
        </header>

        <nav className="ct-dashboard-tabs sticky top-3 z-20 grid grid-cols-5 gap-1.5 rounded-2xl border border-slate-700/70 bg-[#0d182a]/95 p-1.5 shadow-lg shadow-black/20 backdrop-blur">
          {([
            ['overview', 'خانه حساب', Home],
            ['orders', 'سفارش‌ها', FileText],
            ['vehicles', 'خودرو و سلامت', Car],
            ['addresses', 'آدرس‌ها', MapPin],
            ['profile', 'مشخصات من', User],
          ] as const).map(([panel, label, Icon]) => (
            <button key={String(panel)} type="button" onClick={() => { setActivePanel(panel as DashboardPanel); window.history.replaceState(null, '', panel === 'overview' ? '/dashboard' : `#${panel}`); }} className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-black transition ${activePanel === panel ? 'bg-[var(--primary,#f5c518)] text-slate-950 shadow-md' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={17} />{label}</button>
          ))}
        </nav>

        {activePanel === 'overview' && (
          <section className="ct-dashboard-category-hub grid gap-4 lg:grid-cols-3" aria-label="دسته‌بندی امکانات حساب">
            <article className="rounded-3xl border border-slate-700 bg-[#0d182a] p-5">
              <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-slate-950"><FileText /></span><div><h2 className="font-black">خرید و سفارش‌ها</h2><p className="mt-1 text-xs text-slate-400">پیگیری سفارش و دریافت فاکتور</p></div></div>
              <div className="my-4 rounded-2xl bg-slate-950/55 p-4"><span className="text-xs text-slate-400">آخرین وضعیت</span><b className="mt-2 block">{activeOrder ? getStatusLabel(activeOrder.status) : 'سفارشی ثبت نشده'}</b></div>
              <button type="button" onClick={() => { setActivePanel('orders'); window.history.replaceState(null, '', '#orders'); }} className="w-full rounded-2xl border border-slate-600 px-4 py-3 font-black hover:border-amber-400">مشاهده سفارش‌ها</button>
            </article>

            <article className="rounded-3xl border border-slate-700 bg-[#0d182a] p-5">
              <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-slate-950"><Car /></span><div><h2 className="font-black">خودرو و سرویس</h2><p className="mt-1 text-xs text-slate-400">گاراژ، سلامت خودرو و سوابق سرویس</p></div></div>
              <div className="my-4 rounded-2xl bg-slate-950/55 p-4"><span className="text-xs text-slate-400">خودروی فعال</span><b className="mt-2 block">{defaultVehicle?.title || (selectedAdminCar ? getCarTitle(selectedAdminCar) : 'خودرو انتخاب نشده')}</b>{activeReminder && <small className="mt-1 block text-amber-300">{getServiceStatusLabel(activeReminder.status)}</small>}</div>
              <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setActivePanel('vehicles'); window.history.replaceState(null, '', '#vehicles'); }} className="rounded-2xl border border-slate-600 px-3 py-3 text-sm font-black hover:border-amber-400">مدیریت خودرو</button><a href="/book" className="rounded-2xl bg-amber-400 px-3 py-3 text-center text-sm font-black text-slate-950">رزرو سرویس</a></div>
            </article>

            <article className="rounded-3xl border border-slate-700 bg-[#0d182a] p-5">
              <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-slate-950"><User /></span><div><h2 className="font-black">مشخصات و نشانی‌ها</h2><p className="mt-1 text-xs text-slate-400">اطلاعات ورود، تماس و آدرس‌های من</p></div></div>
              <div className="my-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-slate-950/55 p-3"><span className="text-[10px] text-slate-400">پروفایل</span><b className="mt-1 block text-sm">{form.fullName ? 'تکمیل شده' : 'نیاز به تکمیل'}</b></div><div className="rounded-2xl bg-slate-950/55 p-3"><span className="text-[10px] text-slate-400">آدرس‌ها</span><b className="mt-1 block text-sm">{addresses.length.toLocaleString('fa-IR')} مورد</b></div></div>
              <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setActivePanel('profile'); window.history.replaceState(null, '', '#profile'); }} className="rounded-2xl border border-slate-600 px-3 py-3 text-sm font-black hover:border-amber-400">مشخصات من</button><button type="button" onClick={() => { setActivePanel('addresses'); window.history.replaceState(null, '', '#addresses'); }} className="rounded-2xl border border-slate-600 px-3 py-3 text-sm font-black hover:border-amber-400">آدرس‌ها</button></div>
            </article>
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

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><KeyRound className="text-[var(--primary,#f5c518)]" /><h2 className="text-xl font-black">نام کاربری و رمز عبور</h2></div>
            <p className="mb-4 text-sm leading-7 text-slate-500">برای ورود بدون پیامک، نام کاربری و رمز دلخواهت را اینجا تعیین یا تغییر بده.</p>
            <div className="grid gap-3">
              <input dir="ltr" autoCapitalize="none" autoComplete="username" value={credentialUsername} onChange={(e) => setCredentialUsername(e.target.value.toLowerCase())} placeholder="نام کاربری" className={fieldClass} />
              <input dir="ltr" type="password" autoComplete="new-password" value={credentialPassword} onChange={(e) => setCredentialPassword(e.target.value)} placeholder="رمز جدید؛ حداقل ۸ کاراکتر" className={fieldClass} />
              <input dir="ltr" type="password" autoComplete="new-password" value={credentialConfirm} onChange={(e) => setCredentialConfirm(e.target.value)} placeholder="تکرار رمز جدید" className={fieldClass} />
            </div>
            {credentialNotice && <p className="mt-3 text-sm font-bold text-slate-600">{credentialNotice}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={credentialBusy || credentialPassword.length < 8 || !credentialUsername.trim()} onClick={() => void saveLoginCredentials()} className="rounded-2xl bg-[var(--primary,#f5c518)] px-6 py-3 font-black text-black disabled:opacity-50">{credentialBusy ? 'در حال ذخیره...' : 'ذخیره نام کاربری و رمز'}</button>
              <a href={`/login-otp?recovery=1&phone=${encodeURIComponent(form.phone || '')}&returnTo=%2Fdashboard%23profile`} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-bold text-slate-700">بازیابی با پیامک</a>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" /><div><h2 className="font-black text-rose-900">حذف حساب کاربری</h2><p className="mt-1 text-sm leading-6 text-rose-700">اطلاعات شخصی و دسترسی حساب حذف می‌شود. سوابق مالی لازم فقط به‌صورت ناشناس نگهداری می‌شود.</p></div></div>
            {deleteStep === 'idle' ? (
              <button type="button" onClick={() => void requestAccountDeleteOtp()} disabled={deleteBusy} className="mt-4 rounded-2xl border border-rose-300 bg-white px-5 py-3 text-sm font-black text-rose-700 disabled:opacity-50">{deleteBusy ? 'در حال ارسال کد...' : 'حذف حساب با تأیید پیامکی'}</button>
            ) : (
              <div className="mt-4 space-y-3">
                <input inputMode="numeric" autoComplete="one-time-code" value={deleteOtp} onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="کد ۶ رقمی تأیید" className={fieldClass} />
                <div className="flex gap-2"><button type="button" onClick={() => void confirmAccountDeletion()} disabled={deleteBusy || deleteOtp.length < 4} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{deleteBusy ? 'در حال حذف...' : 'تأیید و حذف دائمی'}</button><button type="button" onClick={() => { setDeleteStep('idle'); setDeleteOtp(''); setDeleteNotice(''); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">انصراف</button></div>
              </div>
            )}
            {deleteNotice && <p className="mt-3 text-sm font-bold text-rose-700">{deleteNotice}</p>}
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
