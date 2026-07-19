import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  Droplets,
  Headphones,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  MessageSquare,
  Truck,
  ZoomIn,
  X,
} from 'lucide-react';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCars, getCarTitle, type Car } from '../admin/services/carsApi';
import { getCategoryLabel } from '../config/productCategories';
import { addProductToCart } from '../lib/cart';
import { defaultThemeSettings, getThemeSettings, type ThemeSettings } from '../admin/services/settingsApi';
import { CARRTELL_APPEARANCE_EVENT, loadCarrtellAppearance } from '../lib/appearanceThemes';
import { applyHomepagePreset } from '../lib/homepageThemePresets';
import { readSelectedCustomerCar } from '../customer/services/selectedCar';
import { getApprovedProductReviews, type CustomerReview } from '../admin/services/customerReviewsApi';

type DetailsTab = 'technical' | 'description' | 'compatibility';

function isDarkColor(hex?: string) {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function readableText(background?: string, light = '#f8fafc', dark = '#0f172a') {
  return isDarkColor(background) ? light : dark;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price || 0);
}

function isAmazingActive(product: Product) {
  if (!product.is_featured || !product.amazing_price || !product.amazing_ends_at) return false;
  return new Date(product.amazing_ends_at).getTime() > Date.now();
}

function productMatchesCar(product: Product, carId?: string | null) {
  if (!carId) return false;
  return !!product.compatible_all_cars || (product.compatible_car_ids || []).includes(carId);
}


export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const [selectedImage, setSelectedImage] = useState('');
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailsTab>('technical');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [productsData, carsData, themeData] = await Promise.all([
        getProducts(),
        getCars(),
        getThemeSettings(),
      ]);
      setProducts(productsData || []);
      setCars(carsData || []);
      setTheme(applyHomepagePreset({ ...defaultThemeSettings, ...(themeData || {}) }, loadCarrtellAppearance().presetId));
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const syncAppearance = () => {
      const presetId = loadCarrtellAppearance().presetId;
      setTheme((current) => applyHomepagePreset(current, presetId));
    };
    window.addEventListener(CARRTELL_APPEARANCE_EVENT, syncAppearance as EventListener);
    return () => window.removeEventListener(CARRTELL_APPEARANCE_EVENT, syncAppearance as EventListener);
  }, []);

  const selectedCustomerCar = readSelectedCustomerCar();
  const product = useMemo(() => products.find((item) => item.id === id), [products, id]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set([product.image_url, ...(product.image_urls || [])].filter(Boolean))) as string[];
  }, [product]);

  useEffect(() => {
    setSelectedImage(galleryImages[0] || '');
    setZoomOpen(false);
    setQuantity(1);
    setActiveTab('technical');
  }, [id, galleryImages.join('|')]);

  useEffect(() => {
    if (!id) {
      setReviews([]);
      return;
    }
    getApprovedProductReviews(id, 6).then(setReviews).catch(() => setReviews([]));
  }, [id]);

  const compatibleCars = useMemo(() => {
    if (!product || product.compatible_all_cars) return [];
    return (product.compatible_car_ids || [])
      .map((carId) => cars.find((car) => car.id === carId))
      .filter(Boolean) as Car[];
  }, [product, cars]);

  const selectedCarCompatibility = selectedCustomerCar?.id
    ? productMatchesCar(product as Product, selectedCustomerCar.id)
    : null;

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const explicitIds = product.related_product_ids || [];
    const explicit = explicitIds
      .map((relatedId) => products.find((item) => item.id === relatedId))
      .filter((item): item is Product => !!item && item.is_active !== false && !item.is_out_of_stock && Number(item.stock || 0) > 0);

    if (explicit.length) return explicit.slice(0, 10);

    return products
      .filter((item) => item.id !== product.id && item.is_active !== false && !item.is_out_of_stock && Number(item.stock || 0) > 0)
      .sort((a, b) => {
        const aCategory = a.category === product.category ? 2 : 0;
        const bCategory = b.category === product.category ? 2 : 0;
        const aCar = selectedCustomerCar?.id && productMatchesCar(a, selectedCustomerCar.id) ? 1 : 0;
        const bCar = selectedCustomerCar?.id && productMatchesCar(b, selectedCustomerCar.id) ? 1 : 0;
        return bCategory + bCar + (b.is_best_seller ? 1 : 0) - (aCategory + aCar + (a.is_best_seller ? 1 : 0));
      })
      .slice(0, 10);
  }, [product, products, selectedCustomerCar?.id]);

  if (loading) {
    return <main className="min-h-screen bg-slate-50 px-4 pt-28 text-center text-slate-500">در حال بارگذاری محصول...</main>;
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pt-28 text-center">
        <Droplets className="mx-auto mb-4 h-14 w-14 text-slate-200" />
        <h1 className="mb-3 text-xl font-black text-slate-900">محصول پیدا نشد</h1>
        <Link to="/shop" className="font-bold text-rose-500">بازگشت به فروشگاه</Link>
      </main>
    );
  }

  const isAvailable = product.is_active !== false && product.is_out_of_stock !== true && Number(product.stock || 0) > 0;
  const amazingActive = isAmazingActive(product);
  const finalPrice = amazingActive ? Number(product.amazing_price) : Number(product.price || 0);
  const ratingAverage = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
  const lowStock = isAvailable && Number(product.stock || 0) <= 2 ? Number(product.stock || 0) : 0;
  const primary = theme.primaryColor || '#f43f5e';
  const pageBackground = isDarkColor(theme.backgroundColor) ? '#f4f6f8' : theme.backgroundColor || '#f4f6f8';

  const technicalRows = [
    ['برند', product.brand || '—'],
    ['دسته‌بندی', getCategoryLabel(product.category)],
    ['ویسکوزیته / گرید', product.oil_grade || product.specifications?.['ویسکوزیته'] || product.specifications?.['گرید'] || '—'],
    ['سطح کیفی', product.quality_level || product.specifications?.['سطح کیفی'] || '—'],
    ['نوع گیربکس', product.transmission_type || '—'],
    ...(product.compatible_transmissions?.length ? [['گیربکس‌های سازگار', product.compatible_transmissions.join('، ')]] : []),
    ...Object.entries(product.specifications || {}).filter(([key]) => !['ویسکوزیته', 'گرید', 'سطح کیفی'].includes(key)),
  ].filter(([, value]) => value && value !== '—');

  const addToCart = () => {
    const result = addProductToCart(product, quantity);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    navigate('/cart');
  };

  return (
    <main className="min-h-screen pb-14 pt-20" dir="rtl" style={{ background: pageBackground, fontFamily: theme.fontFamily }}>
      <div className="mx-auto max-w-[1180px] px-3 sm:px-5 lg:px-6">
        <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-900">خانه</Link><span>›</span>
          <Link to="/shop" className="hover:text-slate-900">فروشگاه</Link><span>›</span>
          <span>{getCategoryLabel(product.category)}</span><span>›</span>
          <span className="line-clamp-1 text-slate-800">{product.name}</span>
        </nav>

        <section className="grid gap-3 lg:grid-cols-[1.18fr_0.82fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="grid gap-4 md:grid-cols-[0.88fr_1.12fr]">
              <div className="order-2 md:order-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {product.is_best_seller && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">پرفروش</span>}
                  {amazingActive && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-600">پیشنهاد ویژه</span>}
                  {isAvailable && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">آماده ارسال</span>}
                </div>
                <h1 className="text-xl font-black leading-8 text-slate-950 md:text-2xl">{product.name}</h1>
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-500">{product.card_features || product.description || 'اطلاعات تکمیلی این محصول از پنل مدیریت قابل ثبت است.'}</p>
                <div className="my-4 h-px bg-slate-100" />
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">برند</dt><dd className="font-black" style={{ color: primary }}>{product.brand || 'Carrtell'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">دسته‌بندی</dt><dd className="font-bold text-slate-800">{getCategoryLabel(product.category)}</dd></div>
                  {product.oil_grade && <div className="flex justify-between gap-4"><dt className="text-slate-500">ویسکوزیته</dt><dd className="font-bold text-slate-800">{product.oil_grade}</dd></div>}
                  {product.quality_level && <div className="flex justify-between gap-4"><dt className="text-slate-500">سطح کیفی</dt><dd className="font-bold text-slate-800">{product.quality_level}</dd></div>}
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">وضعیت</dt><dd className={isAvailable ? 'font-bold text-emerald-600' : 'font-bold text-rose-500'}>{isAvailable ? '● موجود در انبار' : 'ناموجود'}</dd></div>
                  {lowStock > 0 && <div className="flex justify-between gap-4"><dt className="text-slate-500">موجودی محدود</dt><dd className="font-black text-amber-600">فقط {lowStock.toLocaleString('fa-IR')} عدد باقی مانده</dd></div>}
                </dl>
              </div>

              <div className="order-1 md:order-2">
                <div className="group relative flex h-[260px] items-center justify-center overflow-hidden rounded-2xl bg-slate-50 md:h-[300px]">
                  {selectedImage ? <img src={selectedImage} alt={product.name} className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105" /> : <Droplets className="h-20 w-20 text-slate-200" />}
                  {selectedImage && <button type="button" onClick={() => setZoomOpen(true)} className="absolute bottom-2.5 left-2.5 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:text-slate-900"><ZoomIn className="h-4.5 w-4.5" /></button>}
                  <button type="button" className="absolute bottom-2.5 right-2.5 rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-rose-500"><Heart className="h-4.5 w-4.5" /></button>
                  <button type="button" className="absolute bottom-2.5 right-12 rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-slate-900"><Share2 className="h-4.5 w-4.5" /></button>
                </div>
                {galleryImages.length > 1 && <div className="mt-2 flex gap-2 overflow-x-auto pb-1">{galleryImages.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1" style={{ borderColor: selectedImage === image ? primary : '#e2e8f0' }}><img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-contain" /></button>)}</div>}
              </div>
            </div>
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-end justify-between gap-3">
              <div>
                {amazingActive && <p className="text-sm text-slate-400 line-through">{formatPrice(Number(product.price || 0))} تومان</p>}
                <p className="mt-1 text-xl font-black" style={{ color: primary }}>{formatPrice(finalPrice)} <span className="text-sm">تومان</span></p>
              </div>
              <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button type="button" onClick={() => setQuantity((current) => Math.min(current + 1, Number(product.stock || 99)))} className="h-full w-12 text-slate-500 hover:bg-slate-50"><Plus className="mx-auto h-4.5 w-4.5" /></button>
                <span className="min-w-10 text-center font-black text-slate-900">{quantity.toLocaleString('fa-IR')}</span>
                <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="h-full w-12 text-slate-500 hover:bg-slate-50"><Minus className="mx-auto h-4.5 w-4.5" /></button>
              </div>
            </div>

            {selectedCustomerCar?.id && (
              <div className={`mt-4 flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${selectedCarCompatibility ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <CarFront className={`h-5 w-5 shrink-0 ${selectedCarCompatibility ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div className="min-w-0">
                  <p className={`text-xs font-black ${selectedCarCompatibility ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {selectedCarCompatibility ? 'برای خودروی انتخابی شما مناسب است' : 'سازگاری با خودروی انتخابی تأیید نشده'}
                  </p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{selectedCustomerCar.title || 'خودروی انتخاب‌شده در پروفایل'}</p>
                </div>
              </div>
            )}

            <button type="button" disabled={!isAvailable} onClick={addToCart} className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400" style={isAvailable ? { background: primary } : undefined}>
              <ShoppingCart className="h-5 w-5" />
              {isAvailable ? 'افزودن به سبد خرید' : 'فعلاً ناموجود است'}
            </button>

            <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-slate-100 border-t border-slate-100 pt-4">
              <div className="px-2 text-center"><Truck className="mx-auto mb-2 h-5 w-5 text-slate-500" /><b className="text-xs text-slate-700">ارسال سریع</b><p className="mt-1 text-[10px] text-slate-400">۲ تا ۳ روز کاری</p></div>
              <div className="px-2 text-center"><Headphones className="mx-auto mb-2 h-5 w-5 text-slate-500" /><b className="text-xs text-slate-700">پشتیبانی ۷ روز هفته</b><p className="mt-1 text-[10px] text-slate-400">پاسخگوی شما هستیم</p></div>
              <div className="px-2 text-center"><ShieldCheck className="mx-auto mb-2 h-5 w-5 text-slate-500" /><b className="text-xs text-slate-700">ضمانت اصالت</b><p className="mt-1 text-[10px] text-slate-400">کالای معتبر</p></div>
            </div>
          </aside>
        </section>

        <section className="mt-4">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 border-b border-slate-200">
              {([
                ['technical', 'مشخصات فنی'],
                ['description', 'توضیحات محصول'],
                ['compatibility', 'سازگاری خودرو'],
              ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setActiveTab(value)} className="relative px-2 py-4 text-sm font-black transition" style={{ color: activeTab === value ? primary : '#64748b' }}>{label}{activeTab === value && <span className="absolute bottom-0 right-4 left-4 h-0.5 rounded-full" style={{ background: primary }} />}</button>)}
            </div>

            <div className="min-h-[220px] p-4 md:p-5">
              {activeTab === 'technical' && (technicalRows.length ? <div className="divide-y divide-slate-100">{technicalRows.map(([key, value]) => <div key={`${key}-${value}`} className="grid grid-cols-[0.8fr_1.2fr] gap-4 py-2.5 text-sm"><span className="text-slate-500">{key}</span><b className="text-slate-900">{value}</b></div>)}</div> : <EmptyState text="مشخصات فنی این محصول هنوز ثبت نشده است." />)}

              {activeTab === 'description' && (product.description ? <p className="whitespace-pre-line text-sm leading-8 text-slate-600">{product.description}</p> : <EmptyState text="توضیحات این محصول هنوز در پنل مدیریت ثبت نشده است." />)}

              {activeTab === 'compatibility' && (
                product.compatible_all_cars ? <div className="rounded-2xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700">این محصول برای همه خودروها فعال شده است.</div> : compatibleCars.length ? <div className="grid gap-2 sm:grid-cols-2">{compatibleCars.map((car) => <div key={car.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><span className="text-sm font-bold text-slate-700">{getCarTitle(car)}</span><CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /></div>)}</div> : <EmptyState text="خودروی سازگار برای این محصول ثبت نشده است." />
              )}
            </div>
          </article>
        </section>

        {relatedProducts.length > 0 && <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div><h2 className="text-base font-black text-slate-950">✨ معمولاً همراه این محصول خریداری می‌شود</h2><p className="mt-1 text-xs text-slate-500">محصولات مکمل و پرکاربرد مرتبط با انتخاب شما</p></div>
            <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">{relatedProducts.length.toLocaleString('fa-IR')} محصول</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2" dir="rtl">
            {relatedProducts.map((item) => <CompactRelatedCard key={item.id} item={item} primary={primary} />)}
          </div>
        </section>}

        <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-slate-500" />
              <h2 className="text-sm font-black text-slate-900">نظرات کاربران</h2>
            </div>
            {reviews.length > 0 && <div className="flex items-center gap-1 text-xs font-black text-amber-600"><Star className="h-4 w-4 fill-current" />{ratingAverage.toFixed(1)} <span className="font-medium text-slate-400">از {reviews.length.toLocaleString('fa-IR')} نظر</span></div>}
          </div>
          {reviews.length ? <div className="grid gap-2 md:grid-cols-2">{reviews.map((review) => <article key={review.id} className="rounded-2xl bg-slate-50 px-3 py-3"><div className="flex items-center justify-between gap-2"><b className="text-xs text-slate-800">{review.customer_name || 'مشتری Carrtell'}</b><span className="flex items-center gap-0.5 text-[11px] font-black text-amber-500"><Star className="h-3.5 w-3.5 fill-current" />{Number(review.rating || 0).toLocaleString('fa-IR')}</span></div><p className="mt-2 line-clamp-3 text-xs leading-6 text-slate-600">{review.comment}</p></article>)}</div> : <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">هنوز نظری برای این محصول ثبت نشده است.</p>}
        </section>

        <section className="mt-4 grid grid-cols-1 divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-x-reverse sm:divide-y-0">
          <TrustItem icon={<ShieldCheck className="h-6 w-6" />} title="ضمانت اصالت کالا" text="تضمین کیفیت و اصالت محصول" />
          <TrustItem icon={<RotateCcw className="h-6 w-6" />} title="۷ روز ضمانت بازگشت" text="طبق شرایط بازگشت کالا" />
          <TrustItem icon={<Truck className="h-6 w-6" />} title="ارسال سریع" text="ارسال به سراسر کشور" />
        </section>
      </div>

      {zoomOpen && selectedImage && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setZoomOpen(false)}><button type="button" aria-label="بستن" onClick={() => setZoomOpen(false)} className="absolute left-5 top-5 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"><X className="h-5 w-5" /></button><img src={selectedImage} alt={product.name} className="max-h-[90vh] max-w-[92vw] object-contain" onClick={(event) => event.stopPropagation()} /></div>}
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-36 items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>;
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex items-center justify-center gap-2.5 px-3 py-3 text-center text-slate-500"><span className="text-slate-400">{icon}</span><div><b className="block text-sm text-slate-700">{title}</b><span className="text-xs">{text}</span></div></div>;
}

function CompactRelatedCard({ item, primary }: { item: Product; primary: string }) {
  const price = isAmazingActive(item) ? Number(item.amazing_price || item.price || 0) : Number(item.price || 0);
  return <article className="flex w-[235px] shrink-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:shadow-md">
    <Link to={`/shop/product/${item.id}`} className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
      {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-contain p-1.5" /> : <PackageCheck className="h-9 w-9 text-slate-300" />}
    </Link>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] text-slate-400">{item.brand || getCategoryLabel(item.category)}</p>
      <Link to={`/shop/product/${item.id}`} className="mt-1 block line-clamp-2 text-sm font-black leading-6 text-slate-900">{item.name}</Link>
      <div className="mt-2 flex items-center justify-between gap-2"><b className="text-sm" style={{ color: primary }}>{formatPrice(price)} تومان</b><button type="button" onClick={() => { const result = addProductToCart(item, 1); if (!result.ok) alert(result.message); }} className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: primary }}><Plus className="h-4 w-4" /></button></div>
    </div>
  </article>;
}
