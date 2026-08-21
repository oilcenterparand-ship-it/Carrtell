import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Loader2,
  MapPin,
  PackageSearch,
  Phone,
  Search,
  Sparkles,
  UserRound,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react';
import { getActiveCarsForCustomer, getCarTitle, type Car as AdminCar } from '../admin/services/carsApi';
import { getProducts, type Product } from '../admin/services/productsApi';
import { PRODUCT_CATEGORIES } from '../config/productCategories';
import { formatCustomerAddress, getCustomerAddresses, type CustomerAddress } from '../customer/services/addressApi';
import { createServiceRequest } from '../customer/services/serviceRequestsApi';
import { getApprovedPackagesForVehicle } from '../customer/services/packageRecommendationApi';
import type { CarPackage } from '../admin/services/packagesApi';
import { useAuth } from '../auth/AuthProvider';
import { verifyMobileOtp } from '../auth/authApi';
import { requestOtp } from '../services/smsOtpApi';
import MapLocationPicker from '../components/MapLocationPicker';
import { saveSelectedCustomerCar } from '../customer/services/selectedCar';
import {
  calculateServicePricing,
  getBookingServices,
  getBookingSlots,
  getServicePricingSettings,
  type BookingService,
  type BookingSlot,
  type ServicePricingSettings,
} from '../customer/services/serviceBookingApi';

const money = (value: number) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;

function localIranPhone(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return digits;
}
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
const STEPS = ['انتخاب خدمت', 'انتخاب خودرو', 'محصول و پکیج', 'زمان', 'اطلاعات و آدرس', 'تأیید و پرداخت'];

function normalizeCategory(value: unknown) {
  return String(value || '')
    .toLocaleLowerCase('fa')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ')
    .replace(/[^0-9a-zآ-ی]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function serviceCategoryKeys(services: BookingService[]) {
  const labels = services.flatMap((item) => item.recommended_categories || []).filter(Boolean);
  const keys = new Set<string>();
  labels.forEach((label) => {
    keys.add(normalizeCategory(label));
    PRODUCT_CATEGORIES.forEach((category) => {
      if (normalizeCategory(category.label) === normalizeCategory(label)) keys.add(normalizeCategory(category.value));
    });
  });
  return keys;
}

function productMatchesService(product: Product, services: BookingService[]) {
  const keys = serviceCategoryKeys(services);
  if (!keys.size) return true;
  const productCategory = normalizeCategory(product.category);
  return Array.from(keys).some((key) => key === productCategory || key.includes(productCategory) || productCategory.includes(key));
}

function productAvailableForCar(product: Product, carId?: string | null) {
  if (product.is_active === false || product.is_out_of_stock || Number(product.stock || 0) <= 0) return false;
  if (product.compatible_all_cars) return true;
  if (!carId) return false;

  const source = product as Product & {
    product_compatible_cars?: Array<{ car_id?: string | null }>;
    compatible_cars?: Array<{ id?: string | null; car_id?: string | null }>;
  };

  if (Array.isArray(product.compatible_car_ids) && product.compatible_car_ids.includes(carId)) return true;
  if (Array.isArray(source.product_compatible_cars) && source.product_compatible_cars.some((row) => row?.car_id === carId)) return true;
  if (Array.isArray(source.compatible_cars) && source.compatible_cars.some((row) => row?.id === carId || row?.car_id === carId)) return true;
  return false;
}

function packageItems(pkg: CarPackage, productCatalog: Product[] = []) {
  const source = pkg as CarPackage & {
    car_package_items?: Array<{
      id?: string;
      package_id?: string;
      product_id: string;
      quantity: number;
      product?: Product;
      products?: Product | Product[];
    }>;
  };

  const rawItems = Array.isArray(pkg.items)
    ? pkg.items
    : Array.isArray(source.car_package_items)
      ? source.car_package_items
      : [];

  return rawItems.map((item) => {
    const extended = item as typeof item & { products?: Product | Product[] };
    const embedded = item.product || (Array.isArray(extended.products) ? extended.products[0] : extended.products);
    const resolved = embedded || productCatalog.find((product) => product.id === item.product_id);
    return { ...item, product: resolved };
  });
}

function getDateOptions() {
  return Array.from({ length: 10 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const value = date.toISOString().slice(0, 10);
    return { value, label: new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' }).format(date) };
  });
}

export default function BookPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const bookingStartedAsGuestRef = useRef<boolean | null>(null);
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<CarPackage[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [pricing, setPricing] = useState<ServicePricingSettings>({ travel_fee: 0, night_fee: 0, holiday_fee: 0, out_of_area_fee: 0, night_start_hour: 18, club_discount_percent: 0, service_area_cities: [] });
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [date, setDate] = useState(tomorrow());
  const [slotId, setSlotId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [pickedLocation, setPickedLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [city, setCity] = useState('پرند');
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestNumber, setRequestNumber] = useState('');
  const [error, setError] = useState('');
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  const [carSearch, setCarSearch] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [pendingCarId, setPendingCarId] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  const selectedCar = useMemo(() => cars.find((item) => item.id === selectedCarId) || null, [cars, selectedCarId]);
  const selectedServices = useMemo(() => services.filter((item) => selectedServiceIds.includes(item.id)), [services, selectedServiceIds]);
  const selectedSlot = useMemo(() => slots.find((item) => item.id === slotId) || null, [slots, slotId]);
  const selectedAddress = useMemo(() => addresses.find((item) => item.id === addressId) || null, [addresses, addressId]);
  const dateOptions = useMemo(getDateOptions, []);
  const carBrands = useMemo(
    () => Array.from(new Set(cars.map((car) => String(car.brand || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fa')),
    [cars],
  );

  const filteredCars = useMemo(() => {
    const query = carSearch.trim().toLocaleLowerCase('fa');
    const brandQuery = carBrand.trim().toLocaleLowerCase('fa');
    return cars
      .filter((car) => !brandQuery || String(car.brand || '').trim().toLocaleLowerCase('fa') === brandQuery)
      .map((car) => {
        const title = getCarTitle(car).toLocaleLowerCase('fa');
        const model = String(car.model || '').toLocaleLowerCase('fa');
        let score = 1;
        if (query) {
          if (title === query) score = 1000;
          else if (model === query) score = 950;
          else if (model.startsWith(query)) score = 900;
          else if (title.startsWith(query)) score = 850;
          else if (title.includes(query)) score = 700;
          else score = 0;
        }
        return { car, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || getCarTitle(a.car).localeCompare(getCarTitle(b.car), 'fa'))
      .map((entry) => entry.car);
  }, [cars, carBrand, carSearch]);

  const recommendationCatalog = useMemo(() => {
    const byId = new Map<string, Product>();
    products.forEach((product) => {
      if (product.id) byId.set(product.id, product);
    });
    packages.forEach((pkg) => {
      packageItems(pkg, products).forEach((item) => {
        if (item.product?.id) byId.set(item.product.id, item.product);
      });
    });
    return Array.from(byId.values());
  }, [products, packages]);

  const selectedCarPackageProductIds = useMemo(() => {
    if (!selectedCar) return new Set<string>();
    const ids = new Set<string>();
    packages
      .filter((pkg) => pkg.is_active !== false && pkg.car_id === selectedCar.id)
      .forEach((pkg) => packageItems(pkg, recommendationCatalog).forEach((item) => {
        if (item.product_id) ids.add(item.product_id);
      }));
    return ids;
  }, [packages, recommendationCatalog, selectedCar]);

  const recommendedProducts = useMemo(() => {
    if (!selectedCar || !selectedServices.length) return [];
    return recommendationCatalog
      .filter((product) => productAvailableForCar(product, selectedCar.id) || Boolean(product.id && selectedCarPackageProductIds.has(product.id)))
      .filter((product) => productMatchesService(product, selectedServices))
      .sort((a, b) => Number(b.recommendation_priority || 0) - Number(a.recommendation_priority || 0))
      .slice(0, 12);
  }, [recommendationCatalog, selectedCar, selectedServices, selectedCarPackageProductIds]);

  const recommendedPackages = useMemo(() => {
    if (!selectedCar || !selectedServices.length) return [];
    return packages
      .filter((pkg) => pkg.is_active !== false)
      .filter((pkg) => !pkg.car_id || pkg.car_id === selectedCar.id)
      .filter((pkg) => packageItems(pkg, recommendationCatalog).some((item) => {
        if (!item.product || item.product.is_active === false || item.product.is_out_of_stock || Number(item.product.stock || 0) <= 0) return false;
        const packageTargetsCar = pkg.car_id === selectedCar.id;
        return (packageTargetsCar || productAvailableForCar(item.product, selectedCar.id)) && productMatchesService(item.product, selectedServices);
      }))
      .slice(0, 6);
  }, [packages, recommendationCatalog, selectedCar, selectedServices]);

  const packageProductIds = useMemo(() => {
    const ids = new Set<string>();
    recommendedPackages
      .filter((pkg) => pkg.id && selectedPackageIds.includes(pkg.id))
      .forEach((pkg) => packageItems(pkg, recommendationCatalog).forEach((item) => {
        if (!item.product_id || !item.product || item.product.is_active === false || item.product.is_out_of_stock || Number(item.product.stock || 0) <= 0) return;
        const packageTargetsCar = pkg.car_id === selectedCar?.id;
        if (packageTargetsCar || productAvailableForCar(item.product, selectedCar?.id)) ids.add(item.product_id);
      }));
    return Array.from(ids);
  }, [recommendedPackages, selectedPackageIds, selectedCar, recommendationCatalog]);

  const allSelectedProductIds = useMemo(() => Array.from(new Set([...selectedProductIds, ...packageProductIds])), [selectedProductIds, packageProductIds]);
  const selectedProducts = useMemo(() => recommendationCatalog.filter((product) => product.id && allSelectedProductIds.includes(product.id)), [recommendationCatalog, allSelectedProductIds]);
  const productTotal = useMemo(() => selectedProducts.reduce((sum, product) => sum + Number(product.amazing_price || product.price || 0), 0), [selectedProducts]);
  const servicePrice = useMemo(
    () => calculateServicePricing({ services: selectedServices, pricing, date, slot: selectedSlot, city, isClubMember: true }),
    [selectedServices, pricing, date, selectedSlot, city],
  );
  const estimatedTotal = servicePrice.total + productTotal;

  useEffect(() => {
    if (authLoading || bookingStartedAsGuestRef.current !== null) return;
    bookingStartedAsGuestRef.current = !user;
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    // Auth/OTP can refresh `user` while the guest is already filling this step.
    // Prefill only empty fields so a refresh never erases customer-entered data.
    const accountPhone = localIranPhone(user.phone);
    setCustomerPhone((current) => current.trim() ? current : accountPhone);
    setCustomerName((current) => current.trim() ? current : (user.fullName || ''));
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    const accountPhone = localIranPhone(user.phone);
    const bookingPhone = localIranPhone(customerPhone);

    // A customer already authenticated with the same mobile number must not
    // receive another OTP just to book a service.
    if (accountPhone && bookingPhone && accountPhone === bookingPhone) {
      setPhoneVerified(true);
      setOtpSent(false);
      setOtpCode('');
      setOtpMessage('شماره موبایل از حساب کاربری شما تأیید شده است.');
    }
  }, [authLoading, user, customerPhone]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookingData() {
      setLoading(true);
      setPackagesLoading(true);
      setError('');

      const [
        carsResult,
        productsResult,
        servicesResult,
        pricingResult,
        packagesResult,
      ] = await Promise.allSettled([
        getActiveCarsForCustomer(),
        getProducts(),
        getBookingServices(),
        getServicePricingSettings(),
        getApprovedPackagesForVehicle(null),
      ]);

      if (cancelled) return;

      if (carsResult.status === 'fulfilled') {
        setCars(carsResult.value || []);
      } else {
        console.error('Booking cars failed to load', carsResult.reason);
        setCars([]);
      }

      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value || []);
      } else {
        console.error('Booking products failed to load', productsResult.reason);
        setProducts([]);
      }

      if (servicesResult.status === 'fulfilled') {
        setServices(servicesResult.value || []);
      } else {
        console.error('Booking services failed to load', servicesResult.reason);
        setServices([]);
      }

      if (pricingResult.status === 'fulfilled') {
        setPricing(pricingResult.value);
      } else {
        console.error('Booking pricing failed to load', pricingResult.reason);
      }

      if (packagesResult.status === 'fulfilled') {
        setPackages(packagesResult.value || []);
      } else {
        console.error('Booking packages failed to load', packagesResult.reason);
        setPackages([]);
      }

      const failedRecommendationDependencies = [
        carsResult.status === 'rejected' ? 'خودروها' : '',
        productsResult.status === 'rejected' ? 'کالاها' : '',
        packagesResult.status === 'rejected' ? 'پکیج‌ها' : '',
      ].filter(Boolean);

      if (servicesResult.status === 'rejected') {
        setError('فهرست خدمات بارگذاری نشد. لطفاً صفحه را دوباره باز کنید.');
      } else if (failedRecommendationDependencies.length) {
        setError(`بخشی از اطلاعات پیشنهادها (${failedRecommendationDependencies.join('، ')}) بارگذاری نشد. انتخاب خدمت همچنان در دسترس است؛ برای دریافت پیشنهاد کامل صفحه را دوباره باز کنید.`);
      }

      setPackagesLoading(false);
      setLoading(false);
    }

    void loadBookingData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedPackageIds([]);
  }, [selectedCarId]);

  useEffect(() => {
    getBookingSlots(date).then((items) => {
      setSlots(items);
      if (!items.some((item) => item.id === slotId && item.remaining > 0)) setSlotId(items.find((item) => item.remaining > 0)?.id || '');
    });
  }, [date]);

  useEffect(() => { if (selectedCar) saveSelectedCustomerCar(selectedCar); }, [selectedCar]);
  useEffect(() => {
    if (!carPickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('ct-modal-open');
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('ct-modal-open');
    };
  }, [carPickerOpen]);

  useEffect(() => {
    if (customerPhone.trim().length < 10) { setAddresses([]); return; }
    getCustomerAddresses(customerPhone.trim()).then((items) => {
      setAddresses(items);
      const first = items.find((item) => item.is_default) || items[0];
      if (first?.id) { setAddressId(first.id); setCity(first.city || city); }
    });
  }, [customerPhone]);

  function toggleService(id: string) {
    setSelectedServiceIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
    setSelectedProductIds([]);
    setSelectedPackageIds([]);
  }

  function toggleProduct(id?: string) {
    if (!id) return;
    setSelectedProductIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  function togglePackage(id?: string) {
    if (!id) return;
    setSelectedPackageIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  async function sendBookingOtp() {
    setError(''); setOtpMessage('');
    if (!/^09\d{9}$/.test(customerPhone.trim())) return setError('شماره موبایل معتبر وارد کنید؛ مانند 09123456789.');
    setOtpBusy(true);
    try {
      await requestOtp(customerPhone.trim());
      setOtpSent(true); setOtpCode(''); setOtpMessage('درخواست ارسال کد ثبت شد؛ کد پیامکی را پس از دریافت وارد کنید.');
    } catch (e) { setError(e instanceof Error ? e.message : 'ارسال کد تأیید انجام نشد.'); }
    finally { setOtpBusy(false); }
  }

  async function verifyBookingOtp() {
    setError(''); setOtpMessage('');
    if (!otpCode.trim()) return setError('کد تأیید پیامک‌شده را وارد کنید.');
    setOtpBusy(true);
    try {
      await verifyMobileOtp(customerPhone.trim(), otpCode.trim());
      setPhoneVerified(true); setOtpMessage('شماره موبایل با موفقیت تأیید شد.');
    } catch (e) { setError(e instanceof Error ? e.message : 'کد تأیید صحیح نیست.'); }
    finally { setOtpBusy(false); }
  }

  function cancelBooking() {
    if (window.confirm('رزرو سرویس لغو شود؟ اطلاعات واردشده در این مرحله از بین می‌رود.')) navigate('/');
  }

  function next() {
    setError('');
    if (step === 1 && !selectedServiceIds.length) return setError('حداقل یک خدمت را انتخاب کنید.');
    if (step === 2 && !selectedCar) return setError('خودروی خود را انتخاب و تأیید کنید.');
    if (step === 4 && (!date || !selectedSlot)) return setError('روز و بازه زمانی دارای ظرفیت را انتخاب کنید.');
    if (step === 5 && !customerName.trim()) return setError('نام و نام خانوادگی را وارد کنید.');
    if (step === 5 && !/^09\d{9}$/.test(customerPhone.trim())) return setError('شماره موبایل معتبر وارد کنید.');
    if (step === 5 && !phoneVerified) return setError('برای ادامه، شماره موبایل را با کد پیامکی تأیید کنید.');
    if (step === 5 && !(selectedAddress || manualAddress.trim() || pickedLocation)) return setError('آدرس را وارد کنید یا موقعیت دقیق را روی نقشه انتخاب کنید.');
    setStep((value) => Math.min(STEPS.length, value + 1));
  }

  async function submit() {
    if (!selectedCar || !selectedSlot || !selectedServices.length || !phoneVerified) return;
    setSubmitting(true); setError('');
    try {
      const addressText = selectedAddress ? formatCustomerAddress(selectedAddress) : (manualAddress.trim() || pickedLocation?.address || 'موقعیت انتخاب‌شده روی نقشه');
      const latitude = selectedAddress?.latitude ?? pickedLocation?.latitude ?? null;
      const longitude = selectedAddress?.longitude ?? pickedLocation?.longitude ?? null;
      const request = await createServiceRequest({
        customer_name: customerName.trim() || 'مشتری کارتل',
        customer_phone: customerPhone.trim(),
        customer_user_id: bookingStartedAsGuestRef.current === true ? null : (user?.id || null),
        vehicle_id: selectedCar.id || null,
        vehicle_title: getCarTitle(selectedCar),
        current_km: Number(currentKm || 0),
        last_service_km: Number(currentKm || 0),
        service_interval_km: Number(selectedCar.service_interval_km || 5000),
        address_id: selectedAddress?.id || null,
        address_text: addressText,
        latitude,
        longitude,
        city,
        preferred_date: date,
        preferred_time: selectedSlot.start_time,
        booking_slot_id: selectedSlot.id,
        booking_slot_label: selectedSlot.label,
        service_title: selectedServices.map((item) => item.title).join(' + '),
        service_ids: selectedServiceIds,
        service_items: selectedServices.map((item) => ({ id: item.id, title: item.title, labor_fee: item.base_labor_fee, estimated_minutes: item.estimated_minutes })),
        suggested_product_ids: allSelectedProductIds,
        pricing_breakdown: { ...servicePrice, products: productTotal, total: estimatedTotal },
        estimated_total: estimatedTotal,
        note: [
          note.trim(),
          selectedPackageIds.length ? `پکیج‌های انتخابی: ${recommendedPackages.filter((pkg) => pkg.id && selectedPackageIds.includes(pkg.id)).map((pkg) => pkg.title).join('، ')}` : '',
        ].filter(Boolean).join('\n') || null,
      });
      setRequestNumber(request.request_number);
      navigate(`/service-payment/${request.id}`, { replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : 'ثبت رزرو انجام نشد.'); }
    finally { setSubmitting(false); }
  }

  if (loading || authLoading) return <main className="min-h-screen bg-slate-100 pt-32 text-slate-900" dir="rtl"><Loader2 className="mx-auto h-9 w-9 animate-spin" /></main>;
  if (requestNumber) return <main className="min-h-screen bg-slate-100 px-4 pb-20 pt-32 text-slate-900" dir="rtl"><div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-xl"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" /><h1 className="mt-5 text-3xl font-black">درخواست سرویس ثبت شد</h1><p className="mt-3 text-slate-500">شماره درخواست: <b className="text-slate-900">{requestNumber}</b></p></div></main>;

  return (
    <main className="ct-book-page min-h-screen bg-slate-100 px-3 pb-28 pt-24 text-slate-900 sm:px-4 sm:pt-28" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <header className="ct-book-hero mb-4 rounded-[1.5rem] bg-gradient-to-l from-slate-900 via-slate-800 to-amber-700 p-5 text-white shadow-xl sm:rounded-[2rem] sm:p-7">
          <div className="flex items-center gap-3"><Wrench className="h-8 w-8 text-amber-300" /><div><h1 className="text-xl font-black sm:text-3xl">رزرو سرویس در محل</h1><p className="mt-2 text-sm text-white/70">فقط چند سؤال کوتاه؛ ما محصول و پکیج مناسب خودروی شما را پیشنهاد می‌دهیم.</p></div></div>
        </header>

        <div className="ct-book-progress mb-4 grid grid-cols-6 gap-1 sm:mb-6 sm:gap-2" aria-label="مراحل رزرو">
          {STEPS.map((label, index) => (
            <div key={label} className={`rounded-xl px-1 py-2 text-center text-[10px] font-bold sm:rounded-2xl sm:px-2 sm:py-3 sm:text-xs ${step >= index + 1 ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-400'}`}>
              <span className="sm:hidden">{index + 1}</span><span className="hidden sm:inline">{index + 1}. {label}</span>
            </div>
          ))}
        </div>

        {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>}
        <div className="mb-4 flex justify-end"><button type="button" onClick={cancelBooking} className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-500">انصراف از رزرو</button></div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="ct-book-form overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
            {step === 1 && (
              <div className="space-y-4" data-booking-step="service">
                <div><p className="text-xs font-bold text-amber-600">مرحله ۱ از ۶</p><h2 className="mt-1 text-xl font-black">چه خدماتی برای خودرو می‌خواهید؟</h2><p className="mt-1 text-sm text-slate-500">یک یا چند خدمت انتخاب کنید؛ پیشنهاد کالا در مرحله بعد از انتخاب خودرو ساخته می‌شود.</p></div>
                <div className="grid gap-3 md:grid-cols-2">{services.map((service) => { const active = selectedServiceIds.includes(service.id); return <button type="button" key={service.id} onClick={() => toggleService(service.id)} className={`rounded-2xl border p-4 text-right transition ${active ? 'ct-book-service-selected border-emerald-500 bg-slate-950 text-white shadow-md' : 'border-slate-200 bg-slate-50 hover:border-amber-300'}`}><div className="flex items-start gap-3"><span className="text-2xl">{service.icon}</span><div className="flex-1"><div className="flex items-center justify-between"><b>{service.title}</b>{active && <Check className="h-5 w-5 text-emerald-400" />}</div><p className={`mt-1 text-xs leading-6 ${active ? 'text-slate-300' : 'text-slate-500'}`}>{service.description}</p><div className="mt-2 text-sm font-bold text-amber-600">اجرت {money(service.base_labor_fee)}</div></div></div></button>; })}</div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5" data-booking-step="vehicle">
                <div><p className="text-xs font-bold text-amber-600">مرحله ۲ از ۶</p><h2 className="mt-1 flex items-center gap-2 text-xl font-black"><Car className="h-5 w-5 text-amber-500" /> خودروی شما چیست؟</h2><p className="mt-1 text-sm text-slate-500">سازنده و مدل را انتخاب کنید تا فقط کالاهای سازگار نمایش داده شوند.</p></div>
                <button type="button" onClick={() => { setPendingCarId(selectedCarId); setCarSearch(''); setCarBrand(selectedCar?.brand || ''); setCarPickerOpen(true); }} className="ct-book-car-trigger flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-slate-950 px-4 py-4 text-right text-white outline-none transition hover:border-amber-400"><span className="truncate font-bold">{selectedCar ? getCarTitle(selectedCar) : 'انتخاب خودرو'}</span><span className="text-xs text-amber-300">{selectedCar ? 'تغییر' : 'انتخاب'}</span></button>
                {selectedCar && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="ml-2 inline h-5 w-5" />خودرو تأیید شد: <b>{getCarTitle(selectedCar)}</b></div>}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6" data-booking-step="recommendations">
                <div><p className="text-xs font-bold text-amber-600">مرحله ۳ از ۶</p><h2 className="mt-1 text-xl font-black">پیشنهاد مناسب {selectedCar ? getCarTitle(selectedCar) : 'خودروی شما'}</h2><p className="mt-1 text-sm text-slate-500">فقط کالاهای موجود، سازگار با خودرو و مرتبط با خدمات انتخابی نمایش داده می‌شوند. انتخاب کالا اختیاری است.</p></div>

                {packagesLoading ? <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />در حال آماده‌سازی پکیج‌ها...</div> : recommendedPackages.length > 0 && (
                  <section aria-label="پکیج‌های پیشنهادی">
                    <div className="mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /><h3 className="font-black">پکیج‌های آماده پیشنهادی</h3></div>
                    <div className="grid gap-3 md:grid-cols-2">{recommendedPackages.map((pkg) => { const active = Boolean(pkg.id && selectedPackageIds.includes(pkg.id)); const availableItems = packageItems(pkg, recommendationCatalog).filter((item) => item.product && item.product.is_active !== false && !item.product.is_out_of_stock && Number(item.product.stock || 0) > 0); const total = availableItems.reduce((sum, item) => sum + Number(item.product?.amazing_price || item.product?.price || 0) * Number(item.quantity || 1), 0); return <button type="button" key={pkg.id || pkg.title} onClick={() => togglePackage(pkg.id)} className={`rounded-2xl border p-4 text-right transition ${active ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}><div className="flex items-start justify-between gap-3"><div><b className="text-sm">{pkg.title}</b><p className="mt-1 text-xs leading-6 text-slate-500">{pkg.description || `${availableItems.length.toLocaleString('fa-IR')} قلم مناسب خودروی شما`}</p><span className="mt-2 block text-sm font-black text-amber-700">{money(total)}</span></div>{active && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}</div></button>; })}</div>
                  </section>
                )}

                <section aria-label="محصولات پیشنهادی">
                  <div className="mb-3 flex items-center gap-2"><PackageSearch className="h-5 w-5 text-amber-500" /><h3 className="font-black">محصولات مرتبط با سرویس</h3></div>
                  {recommendedProducts.length ? <div className="grid gap-3 md:grid-cols-2">{recommendedProducts.map((product) => { const active = Boolean(product.id && allSelectedProductIds.includes(product.id)); return <button type="button" key={product.id} onClick={() => toggleProduct(product.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-right ${active ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" /> : <PackageSearch className="h-6 w-6 text-slate-300" />}</div><div className="min-w-0 flex-1"><b className="line-clamp-2 text-sm">{product.name}</b><p className="mt-1 text-xs text-slate-500">{product.recommendation_reason || 'سازگار با خودرو و خدمت انتخابی'}</p><span className="mt-2 block text-sm font-black text-amber-700">{money(Number(product.amazing_price || product.price || 0))}</span></div>{active && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}</button>; })}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500"><PackageSearch className="mb-2 h-6 w-6" />برای این خودرو و خدمت، کالای موجود و سازگار پیدا نشد. می‌توانید رزرو سرویس را بدون کالا ادامه دهید.</div>}
                </section>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6" data-booking-step="time">
                <div><p className="text-xs font-bold text-amber-600">مرحله ۴ از ۶</p><h2 className="mt-1 flex items-center gap-2 text-xl font-black"><CalendarDays className="h-5 w-5 text-amber-500" /> چه زمانی مناسب شماست؟</h2></div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{dateOptions.map((item) => <button type="button" data-booking-slot aria-pressed={date === item.value} key={item.value} onClick={() => setDate(item.value)} className={`ct-booking-slot rounded-2xl border p-3 text-sm font-bold ${date === item.value ? 'is-selected border-amber-400 bg-amber-50' : 'border-slate-200'}`}>{item.label}</button>)}</div>
                <div className="grid gap-3 md:grid-cols-3">{slots.map((slot) => <button type="button" data-booking-slot aria-pressed={slotId === slot.id} disabled={slot.remaining <= 0} key={slot.id} onClick={() => setSlotId(slot.id)} className={`ct-booking-slot rounded-2xl border p-4 ${slotId === slot.id ? 'is-selected border-amber-400 bg-amber-50' : 'border-slate-200'} disabled:cursor-not-allowed disabled:opacity-45`}><Clock3 className="mx-auto mb-2 h-5 w-5" /><b>{slot.label}</b><p className={`mt-2 text-xs ${slot.remaining > 1 ? 'text-emerald-600' : slot.remaining === 1 ? 'text-amber-600' : 'text-rose-600'}`}>{slot.remaining > 0 ? `${slot.remaining.toLocaleString('fa-IR')} ظرفیت باقی‌مانده` : 'تکمیل'}</p></button>)}</div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5" data-booking-step="address">
                <div><p className="text-xs font-bold text-amber-600">مرحله ۵ از ۶</p><h2 className="mt-1 flex items-center gap-2 text-xl font-black"><MapPin className="h-5 w-5 text-amber-500" /> اطلاعات و محل سرویس</h2></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2"><span className="text-sm font-bold">نام و نام خانوادگی</span><div className="relative"><UserRound className="absolute right-4 top-4 h-4 w-4 text-slate-400" /><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="نام مشتری" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-4 pr-11 outline-none focus:border-amber-400" /></div></label>
                  <div className="space-y-2"><span className="text-sm font-bold">شماره موبایل</span><div className="flex gap-2"><div className="relative min-w-0 flex-1"><Phone className="absolute right-4 top-4 h-4 w-4 text-slate-400" /><input inputMode="numeric" autoComplete="tel" maxLength={11} value={customerPhone} onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, 11); setCustomerPhone(value); const sameAsAccount = Boolean(user?.phone && localIranPhone(user.phone) === localIranPhone(value)); setPhoneVerified(sameAsAccount); setOtpSent(false); setOtpCode(''); setOtpMessage(sameAsAccount ? 'شماره موبایل از حساب کاربری شما تأیید شده است.' : ''); }} placeholder="09123456789" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-3 pr-11 text-left font-bold outline-none focus:border-amber-400" dir="ltr" /></div><button type="button" onClick={sendBookingOtp} disabled={otpBusy || phoneVerified} className={`shrink-0 rounded-2xl px-3 text-xs font-black ${phoneVerified ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-slate-950'} disabled:opacity-70`}>{phoneVerified ? 'تأیید شد' : otpBusy ? '...' : 'تأیید شماره'}</button></div>{otpSent && !phoneVerified && <div className="mt-2 flex gap-2"><input inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))} placeholder="کد تأیید" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center tracking-[.25em] outline-none focus:border-emerald-500" /><button type="button" onClick={verifyBookingOtp} disabled={otpBusy} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60">ثبت کد</button></div>}{otpSent && !phoneVerified && <button type="button" onClick={sendBookingOtp} disabled={otpBusy} className="mt-2 text-xs font-black text-amber-600 underline underline-offset-4 disabled:opacity-50">ارسال مجدد کد</button>}{otpMessage && <p className={`mt-2 text-xs font-bold ${phoneVerified ? 'text-emerald-600' : 'text-amber-600'}`}>{otpMessage}</p>}</div>
                  <label className="space-y-2"><span className="text-sm font-bold">کیلومتر فعلی</span><input type="number" value={currentKm} onChange={(event) => setCurrentKm(event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-amber-400" /></label>
                </div>
                {addresses.length > 0 && <div className="grid gap-2">{addresses.map((address) => <button type="button" key={address.id} onClick={() => { setAddressId(address.id || ''); setCity(address.city); }} className={`rounded-2xl border p-4 text-right ${addressId === address.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}><b>{address.title}</b><p className="mt-1 text-xs text-slate-500">{formatCustomerAddress(address)}</p></button>)}</div>}
                <textarea value={manualAddress} onChange={(event) => setManualAddress(event.target.value)} rows={3} placeholder="آدرس کامل؛ پلاک، واحد و توضیحات تکمیلی" className="w-full rounded-2xl border border-slate-300 bg-white p-4 outline-none focus:border-amber-400" />
                <MapLocationPicker initialLatitude={selectedAddress?.latitude || pickedLocation?.latitude} initialLongitude={selectedAddress?.longitude || pickedLocation?.longitude} onConfirm={(location) => { setPickedLocation(location); if (location.address && !manualAddress.trim()) setManualAddress(location.address); }} />
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="توضیحات تکمیلی برای سرویس‌کار" className="w-full rounded-2xl border border-slate-300 bg-white p-4 outline-none focus:border-amber-400" />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6" data-booking-step="review">
                <div><p className="text-xs font-bold text-amber-600">مرحله ۶ از ۶</p><h2 className="mt-1 text-xl font-black">مرور نهایی و رفتن به پرداخت</h2><p className="mt-1 text-sm text-slate-500">همه چیز را یک‌بار بررسی کنید؛ بعد از ثبت، وارد صفحه پرداخت می‌شوید.</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="grid gap-3 text-sm text-slate-600"><p>خدمات: <b className="text-slate-900">{selectedServices.map((item) => item.title).join('، ')}</b></p><p>خودرو: <b className="text-slate-900">{selectedCar && getCarTitle(selectedCar)}</b></p><p>کالاهای انتخابی: <b className="text-slate-900">{selectedProducts.length ? selectedProducts.map((item) => item.name).join('، ') : 'بدون کالا'}</b></p><p>زمان: <b className="text-slate-900">{dateOptions.find((item) => item.value === date)?.label} - {selectedSlot?.label}</b></p><p>آدرس: <b className="text-slate-900">{selectedAddress ? formatCustomerAddress(selectedAddress) : manualAddress}</b></p></div></div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex justify-between text-sm"><span>خدمات و اعزام</span><b>{money(servicePrice.total)}</b></div><div className="mt-2 flex justify-between text-sm"><span>کالاهای انتخابی</span><b>{money(productTotal)}</b></div><div className="mt-4 flex justify-between border-t border-amber-200 pt-4 text-lg font-black"><span>مبلغ قابل پرداخت</span><b className="text-amber-800">{money(estimatedTotal)}</b></div></div>
              </div>
            )}

            <div className="ct-book-actions mt-7 flex items-center justify-between gap-3">
              <button type="button" disabled={step === 1} onClick={() => { setError(''); setStep((value) => Math.max(1, value - 1)); }} className="ct-book-back min-h-12 rounded-xl px-5 py-3 font-bold disabled:opacity-40">مرحله قبل</button>
              {step < STEPS.length ? <button type="button" onClick={next} className="ct-book-next flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-black text-white sm:flex-none sm:px-8">ادامه <ChevronLeft className="h-4 w-4" /></button> : <button type="button" onClick={submit} disabled={submitting} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60 sm:flex-none sm:px-6">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} ثبت رزرو و رفتن به پرداخت</button>}
            </div>
          </section>

          {selectedServices.length > 0 && (
            <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
              <div className="mb-4 flex items-center gap-2"><WalletCards className="h-5 w-5 text-amber-500" /><h2 className="font-black">برآورد هزینه</h2></div>
              <div className="space-y-3 text-sm"><div className="flex justify-between"><span>اجرت خدمات</span><b>{money(servicePrice.labor)}</b></div><div className="flex justify-between"><span>ایاب‌وذهاب</span><b>{money(servicePrice.travel)}</b></div>{productTotal > 0 && <div className="flex justify-between"><span>محصولات انتخابی</span><b>{money(productTotal)}</b></div>}<div className="border-t border-slate-200 pt-4"><div className="flex items-center justify-between text-lg"><span className="font-black">جمع تقریبی</span><b className="text-amber-700">{money(estimatedTotal)}</b></div></div></div>
              <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-800"><Sparkles className="mb-2 h-5 w-5" />پیشنهادهای کالا بعد از انتخاب خودرو فقط از محصولات موجود و سازگار ساخته می‌شوند.</div>
            </aside>
          )}
        </div>

        {carPickerOpen && (
          <div className="ct-book-car-modal-backdrop fixed inset-0 z-[100000] flex items-end justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setCarPickerOpen(false); }}>
            <section className="ct-book-car-modal flex max-h-[78dvh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border-2 border-amber-400 bg-slate-950 text-white shadow-2xl" dir="rtl">
              <header className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="font-black">انتخاب خودرو</h2><p className="mt-1 text-xs text-white/55">اول سازنده، بعد مدل را انتخاب کنید.</p></div><button type="button" onClick={() => setCarPickerOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" aria-label="بستن"><X className="h-5 w-5" /></button></header>
              <div className="grid gap-2 p-3"><label className="grid gap-1 text-xs font-bold text-white/70"><span>۱. شرکت سازنده</span><select value={carBrand} onChange={(event) => { setCarBrand(event.target.value); setCarSearch(''); setPendingCarId(''); }} className="h-12 rounded-xl border border-white/15 bg-slate-900 px-3 text-base text-white outline-none"><option value="">انتخاب سازنده</option>{carBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></label><label className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3"><Search className="h-5 w-5 text-amber-300" /><input value={carSearch} disabled={!carBrand} onChange={(event) => setCarSearch(event.target.value)} placeholder={carBrand ? `۲. جستجو بین خودروهای ${carBrand}...` : 'ابتدا سازنده را انتخاب کن'} className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35 disabled:opacity-50" /></label></div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">{filteredCars.map((car) => { const active = pendingCarId === car.id; return <button type="button" key={car.id} data-car-id={car.id || undefined} onClick={() => setPendingCarId(car.id || '')} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-right ${active ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-white/10 bg-white/5 text-white'}`}><span className="font-bold">{getCarTitle(car)}</span>{active && <Check className="h-5 w-5" />}</button>; })}{!filteredCars.length && <div className="p-8 text-center text-sm text-white/50">خودرویی با این عبارت پیدا نشد.</div>}</div>
              <footer className="grid grid-cols-2 gap-2 border-t border-white/10 p-3"><button type="button" onClick={() => setCarPickerOpen(false)} className="rounded-xl border border-white/15 px-4 py-3 font-bold">انصراف</button><button type="button" disabled={!pendingCarId} onClick={() => { setSelectedCarId(pendingCarId); setSelectedProductIds([]); setSelectedPackageIds([]); setCarPickerOpen(false); }} className="rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 disabled:opacity-40">تأیید خودرو</button></footer>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
