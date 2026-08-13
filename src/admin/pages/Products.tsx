import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, Product } from '../services/productsApi';
import { getCars, getCarTitle, type Car } from '../services/carsApi';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '../../config/productCategories';
import { getOilSpecs, type OilSpec } from '../services/oilSpecsApi';
import { getBrands, type Brand } from '../services/brandsApi';
import { getWarehouses, type Warehouse } from '../services/warehousesApi';
import ImageUploader from '../components/ImageUploader';


function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function gregorianToJalali(gy: number, gm: number, gd: number) {
  const gdm = [0,31,59,90,120,151,181,212,243,273,304,334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

function jalaliToGregorian(jy: number, jm: number, jd: number) {
  jy += 1595;
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0,31,((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
  let gm = 1;
  for (; gm <= 12 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return { gy, gm, gd };
}

function toLocalDateTimeValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function parseAmazingJalali(value?: string | null) {
  const date = value ? new Date(value) : new Date(Date.now() + 48 * 60 * 60 * 1000);
  const { jy, jm, jd } = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { jy, jm, jd, hour: date.getHours(), minute: date.getMinutes() };
}

function setAmazingFromJalali(form: Product, setForm: (product: Product) => void, patch: Partial<{ jy: number; jm: number; jd: number; hour: number; minute: number }>) {
  const current = parseAmazingJalali(form.amazing_ends_at);
  const next = { ...current, ...patch };
  if (!next.jy || !next.jm || !next.jd) return;
  const { gy, gm, gd } = jalaliToGregorian(Number(next.jy), Number(next.jm), Number(next.jd));
  const date = new Date(gy, gm - 1, gd, Number(next.hour || 0), Number(next.minute || 0), 0, 0);
  setForm({ ...form, amazing_ends_at: toLocalDateTimeValue(date) });
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="space-y-2 rounded-xl bg-slate-950/30 p-2">
      <span className="block text-xs font-bold text-slate-300">{label}</span>
      {children}
      {hint && <span className="block text-[11px] leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

const emptyProduct: Product = {
  name: '',
  brand: '',
  category: 'engine-oil',
  oil_grade: '',
  quality_level: '',
  price: 0,
  amazing_price: null,
  amazing_ends_at: '',
  stock: 0,
  image_url: '',
  image_urls: [],
  specifications: {},
  is_active: true,
  is_featured: false,
  is_best_seller: false,
  is_out_of_stock: false,
  compatible_all_cars: false,
  suitable_cars: [],
  compatible_car_ids: [],
  compatible_transmissions: [],
  description: '',
  card_features: '',
  recommendation_reason: '',
  recommendation_priority: 0,
  related_product_ids: [],
  warehouse_id: null,
  oil_base: '',
  upsell_title: 'همراه این محصول پیشنهاد می‌کنیم',
};


const TRANSMISSION_TYPES = [
  'همه گیربکس‌ها',
  'دستی',
  'اتوماتیک AT',
  'CVT',
  'DCT / دوکلاچه',
  'AMT',
  'تیپ‌ترونیک',
  'DSG',
  'AL4',
  'ZF',
  'ATF Dexron III',
  'ATF Dexron VI',
  'Multi Vehicle ATF',
  'CVT Fluid',
  'DCT Fluid',
  '75W-80',
  '75W-90',
  '80W-90',
  '85W-90',
];

function isGearboxProduct(category?: string) {
  const value = String(category || '').trim().toLowerCase();
  if (!value) return false;

  return [
    'gear-oil',
    'gearbox-oil',
    'transmission-oil',
    'transmission-fluid',
    'vascazin',
    'vascazine',
  ].includes(value) || value.includes('gear') || value.includes('transmission') || value.includes('گیربکس') || value.includes('واسکازین');
}

function specificationsToText(specifications: Product['specifications'] | string | null | undefined) {
  if (!specifications) return '';
  if (typeof specifications === 'string') {
    return specifications.replace(/\\n/g, '\n');
  }
  return Object.entries(specifications)
    .map(([key, value]) => `${key}: ${String(value ?? '')}`)
    .join('\n');
}

function parseSpecificationsText(value: string) {
  return value
    .replace(/\\n/g, '\n')
    .split('\n')
    .reduce<Record<string, string>>((acc, rawLine) => {
      const line = rawLine.trim();
      if (!line) return acc;
      const colonIndex = [line.indexOf(':'), line.indexOf('：'), line.indexOf('؛')]
        .filter((index) => index >= 0)
        .sort((a, b) => a - b)[0];
      if (colonIndex === undefined || colonIndex <= 0) return acc;
      const key = line.slice(0, colonIndex).trim();
      const specificationValue = line.slice(colonIndex + 1).trim();
      if (key) acc[key] = specificationValue;
      return acc;
    }, {});
}

function toggleTextValue(list: string[] = [], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [oilSpecs, setOilSpecs] = useState<OilSpec[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState<Product>(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [carSearch, setCarSearch] = useState('');
  const [activeBrand, setActiveBrand] = useState('all');
  const [customTransmission, setCustomTransmission] = useState('');
  const [relatedSearch, setRelatedSearch] = useState('');
  const [relatedCategory, setRelatedCategory] = useState('all');
  const [openRelatedCategories, setOpenRelatedCategories] = useState<string[]>([]);
  const [specificationsText, setSpecificationsText] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productSort, setProductSort] = useState('newest');
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditDraft, setQuickEditDraft] = useState<Partial<Product>>({});
  const [recentProductIds, setRecentProductIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('carrtell_recent_product_ids') || '[]');
    } catch {
      return [];
    }
  });

  async function loadData() {
    const [productsData, carsData, oilSpecsData, brandsData, warehousesData] = await Promise.all([getProducts(), getCars(), getOilSpecs(), getBrands(), getWarehouses()]);
    setProducts(productsData);
    setCars(carsData.filter((car) => car.is_active !== false));
    setOilSpecs(oilSpecsData.filter((item) => item.is_active !== false));
    setBrands(brandsData.filter((item) => item.is_active !== false));
    setWarehouses(warehousesData.filter((item) => item.is_active !== false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const oilGrades = useMemo(() => oilSpecs.filter((item) => item.type === 'grade'), [oilSpecs]);
  const qualityLevels = useMemo(() => oilSpecs.filter((item) => item.type === 'quality'), [oilSpecs]);
  const oilBases = useMemo(() => oilSpecs.filter((item) => item.type === 'base'), [oilSpecs]);
  const amazingJalali = parseAmazingJalali(form.amazing_ends_at);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const result = products.filter((item) => {
      const haystack = `${item.name || ''} ${item.brand || ''} ${getCategoryLabel(item.category)} ${item.id || ''} ${item.description || ''}`.toLowerCase();
      const searchOk = !query || haystack.includes(query);
      const categoryOk = productCategoryFilter === 'all' || item.category === productCategoryFilter;
      const statusOk = productStatusFilter === 'all'
        || (productStatusFilter === 'available' && item.is_active !== false && !item.is_out_of_stock && item.stock > 0)
        || (productStatusFilter === 'out' && (item.is_out_of_stock || item.stock <= 0))
        || (productStatusFilter === 'featured' && item.is_featured)
        || (productStatusFilter === 'bestseller' && item.is_best_seller)
        || (productStatusFilter === 'inactive' && item.is_active === false);
      return searchOk && categoryOk && statusOk;
    });

    return [...result].sort((a, b) => {
      if (productSort === 'name') return (a.name || '').localeCompare(b.name || '', 'fa');
      if (productSort === 'stock-desc') return Number(b.stock || 0) - Number(a.stock || 0);
      if (productSort === 'stock-asc') return Number(a.stock || 0) - Number(b.stock || 0);
      if (productSort === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
      if (productSort === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
      return 0;
    });
  }, [products, productSearch, productCategoryFilter, productStatusFilter, productSort]);

  const recentProducts = useMemo(() => {
    return recentProductIds
      .map((id) => products.find((item) => item.id === id))
      .filter(Boolean)
      .slice(0, 10) as Product[];
  }, [products, recentProductIds]);

  const carBrands = useMemo(() => {
    return Array.from(new Set(cars.map((car) => car.brand || 'سایر خودروها')));
  }, [cars]);


  const relatedCandidates = useMemo(() => {
    const query = relatedSearch.trim().toLowerCase();
    return products.filter((item) => {
      if (!item.id || item.id === editingProductId) return false;
      const categoryOk = relatedCategory === 'all' || item.category === relatedCategory;
      const haystack = `${item.name || ''} ${item.brand || ''} ${getCategoryLabel(item.category)}`.toLowerCase();
      return categoryOk && (!query || haystack.includes(query));
    });
  }, [products, editingProductId, relatedSearch, relatedCategory]);

  const relatedGroups = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    relatedCandidates.forEach((item) => {
      const key = item.category || 'other';
      grouped.set(key, [...(grouped.get(key) || []), item]);
    });
    return Array.from(grouped.entries());
  }, [relatedCandidates]);

  const selectedRelatedProducts = useMemo(() => {
    const selectedIds = new Set(form.related_product_ids || []);
    return products.filter((item) => item.id && selectedIds.has(item.id));
  }, [products, form.related_product_ids]);

  function toggleRelatedProduct(id: string) {
    const current = form.related_product_ids || [];
    const next = current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id];
    setForm({ ...form, related_product_ids: next });
  }

  function toggleRelatedCategory(category: string) {
    setOpenRelatedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }
  const filteredCars = useMemo(() => {
    const q = carSearch.trim().toLowerCase();
    return cars.filter((car) => {
      const brandOk = activeBrand === 'all' || (car.brand || 'سایر خودروها') === activeBrand;
      const text = `${getCarTitle(car)} ${car.brand || ''} ${car.model || ''} ${car.engine || ''}`.toLowerCase();
      return brandOk && (!q || text.includes(q));
    });
  }, [cars, carSearch, activeBrand]);

  const groupedFilteredCars = useMemo(() => {
    return filteredCars.reduce<Record<string, Car[]>>((groups, car) => {
      const brand = car.brand || 'سایر خودروها';
      groups[brand] = [...(groups[brand] || []), car];
      return groups;
    }, {});
  }, [filteredCars]);

  function toggleCar(carId?: string) {
    if (!carId || form.compatible_all_cars) return;
    const current = form.compatible_car_ids || [];
    const next = current.includes(carId)
      ? current.filter((id) => id !== carId)
      : [...current, carId];
    setForm({ ...form, compatible_car_ids: next });
  }

  function toggleAllCars(checked: boolean) {
    setForm({
      ...form,
      compatible_all_cars: checked,
      compatible_car_ids: checked ? [] : form.compatible_car_ids || [],
    });
  }

  function resetForm() {
    setForm(emptyProduct);
    setEditingProductId(null);
    setCarSearch('');
    setActiveBrand('all');
    setCustomTransmission('');
    setSpecificationsText('');
  }

  function rememberRecentProduct(id?: string) {
    if (!id) return;
    setRecentProductIds((current) => {
      const next = [id, ...current.filter((item) => item !== id)].slice(0, 10);
      localStorage.setItem('carrtell_recent_product_ids', JSON.stringify(next));
      return next;
    });
  }

  function editProduct(item: Product) {
    rememberRecentProduct(item.id);
    const normalizedCategory = isGearboxProduct(item.category) ? 'gear-oil' : item.category;
    setForm({
      ...emptyProduct,
      ...item,
      category: normalizedCategory,
      compatible_car_ids: item.compatible_car_ids || [],
      compatible_transmissions: item.compatible_transmissions || [],
      compatible_all_cars: !!item.compatible_all_cars,
      suitable_cars: item.suitable_cars || [],
      is_featured: !!item.is_featured,
      is_best_seller: !!item.is_best_seller,
      is_out_of_stock: !!item.is_out_of_stock,
      related_product_ids: item.related_product_ids || [],
      upsell_title: item.upsell_title || 'همراه این محصول پیشنهاد می‌کنیم',
    });
    setSpecificationsText(specificationsToText(item.specifications));
    setEditingProductId(item.id || null);
    setCarSearch('');
    setActiveBrand('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveProduct() {
    if (!form.name.trim()) {
      alert('نام محصول الزامی است');
      return;
    }

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, form);
        alert('تغییرات محصول ذخیره شد ✅');
      } else {
        await createProduct(form);
        alert('محصول ذخیره شد ✅');
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ذخیره انجام نشد. لطفاً Console یا خطای Supabase را بررسی کن.');
    }
  }

  function openQuickEdit(item: Product) {
    if (!item.id) return;
    setQuickEditId(item.id);
    setQuickEditDraft({
      price: item.price,
      stock: item.stock,
      is_active: item.is_active,
      is_featured: item.is_featured,
      is_best_seller: item.is_best_seller,
      is_out_of_stock: item.is_out_of_stock,
    });
    rememberRecentProduct(item.id);
  }

  async function saveQuickEdit(item: Product) {
    if (!item.id) return;
    try {
      const payload: Partial<Product> = {
        ...quickEditDraft,
        price: Number(quickEditDraft.price ?? item.price),
        stock: Number(quickEditDraft.stock ?? item.stock),
      };
      if (payload.stock === 0) payload.is_out_of_stock = true;
      if ((payload.stock || 0) > 0 && payload.is_out_of_stock === undefined) payload.is_out_of_stock = false;
      await updateProduct(item.id, payload);
      setQuickEditId(null);
      setQuickEditDraft({});
      rememberRecentProduct(item.id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ویرایش سریع ذخیره نشد. اتصال Supabase را بررسی کن.');
    }
  }

  async function toggleProductOption(item: Product, option: 'is_featured' | 'is_best_seller' | 'is_out_of_stock') {
    if (!item.id) return;

    const nextValue = !item[option];
    const payload: Partial<Product> = { [option]: nextValue };

    if (option === 'is_out_of_stock' && nextValue) {
      payload.stock = 0;
    }

    await updateProduct(item.id, payload);
    loadData();
  }

  function statusBadge(item: Product) {
    const badges = [];
    if (item.compatible_all_cars) badges.push('همه خودروها');
    if (item.is_featured) badges.push('پیشنهاد ویژه');
    if (item.is_best_seller) badges.push('پرفروش');
    if (item.is_out_of_stock || item.stock <= 0) badges.push('ناموجود');
    if (!item.is_active) badges.push('غیرفعال');
    return badges;
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm('محصول حذف شود؟')) return;
    await deleteProduct(id);
    loadData();
  }

  function carNames(item: Product) {
    if (item.compatible_all_cars) return ['سازگار با تمامی خودروها'];
    return (item.compatible_car_ids || [])
      .map((id) => cars.find((car) => car.id === id))
      .filter(Boolean)
      .map((car) => getCarTitle(car as Car));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت محصولات Carrtell</h1>
        <p className="mt-2 text-sm text-slate-400">
          هر محصول را به خودروهای سازگار وصل کن تا فروشگاه و AI فقط گزینه‌های درست را پیشنهاد بدهند.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-slate-900 p-5 md:grid-cols-2">
        {editingProductId && (
          <div className="rounded-xl bg-blue-500/10 p-3 text-sm font-bold text-blue-200 md:col-span-2">
            حالت ویرایش فعال است؛ بعد از تغییر اطلاعات، روی «ذخیره تغییرات» بزن.
          </div>
        )}

        <Field label="نام محصول" hint="مثال: ایرانول 16000 2050 یا فیلتر روغن پراید آرتین">
          <input placeholder="نام محصول" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded bg-slate-800 p-3 text-white" />
        </Field>
        <Field label="برند محصول" hint="برند را از فهرست برندهای ذخیره‌شده انتخاب کن. برای افزودن برند جدید از بخش مدیریت برندها استفاده کن.">
          <select value={form.brand_id || ''} onChange={(e) => { const brand = brands.find((item) => item.id === e.target.value); setForm({ ...form, brand_id: e.target.value || null, brand: brand?.name || '' }); }} className="w-full rounded bg-slate-800 p-3 text-white">
            <option value="">انتخاب برند</option>
            {brands.map((brand) => <option key={brand.id || brand.name} value={brand.id}>{brand.name}</option>)}
          </select>
          <a href="/admin/brands" className="mt-2 inline-flex text-xs font-bold text-yellow-300">+ افزودن یا مدیریت برندها</a>
        </Field>

        <Field label="دسته‌بندی محصول" hint="محصول در همین دسته داخل فروشگاه و فیلترها نمایش داده می‌شود.">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded bg-slate-800 p-3 text-white">
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </Field>

        <Field label="تصویر محصول" hint="عکس قبل از آپلود به WebP تبدیل و کم‌حجم می‌شود؛ واترمارک تنظیم‌شده سایت هم اعمال می‌شود.">
          <ImageUploader
            label="آپلود تصویر محصول"
            folder="products"
            value={form.image_url || ''}
            onChange={(url) => setForm({ ...form, image_url: url })}
          />
        </Field>

        <Field label="گالری تصاویر محصول" hint="آدرس تصاویر اضافی را هرکدام در یک خط وارد کن. تصویر اصلی همان تصویر بالا است.">
          <textarea
            rows={4}
            value={(form.image_urls || []).join('\n')}
            onChange={(e) => setForm({ ...form, image_urls: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
            placeholder="https://.../image-2.webp\nhttps://.../image-3.webp"
            className="w-full rounded bg-slate-800 p-3 text-white"
          />
        </Field>

        <Field label="گرید روغن / ویسکوزیته" hint="برای روغن‌ها استفاده می‌شود؛ مثل 10W-40 یا 5W-30. از بخش «گرید و سطح کیفی» قابل مدیریت است.">
          <select value={form.oil_grade || ''} onChange={(e) => setForm({ ...form, oil_grade: e.target.value })} className="w-full rounded bg-slate-800 p-3 text-white">
            <option value="">انتخاب گرید</option>
            {oilGrades.map((grade) => (
              <option key={grade.id || grade.title} value={grade.title}>{grade.title}</option>
            ))}
          </select>
        </Field>

        <Field label="سطح کیفی" hint="مثل API SN، SM، SL یا استانداردهای مشابه. از پنل قابل کم‌وزیاد شدن است.">
          <select value={form.quality_level || ''} onChange={(e) => setForm({ ...form, quality_level: e.target.value })} className="w-full rounded bg-slate-800 p-3 text-white">
            <option value="">انتخاب سطح کیفی</option>
            {qualityLevels.map((level) => (
              <option key={level.id || level.title} value={level.title}>{level.title}</option>
            ))}
          </select>
        </Field>

        <Field label="نوع پایه روغن" hint="جایگزین فیلد API؛ گزینه‌ها از بخش گرید و مشخصات روغن قابل مدیریت هستند.">
          <select value={form.oil_base || ''} onChange={(e) => setForm({ ...form, oil_base: e.target.value })} className="w-full rounded bg-slate-800 p-3 text-white">
            <option value="">انتخاب نوع پایه روغن</option>
            {oilBases.map((item) => <option key={item.id || item.title} value={item.title}>{item.title}</option>)}
          </select>
        </Field>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 md:col-span-2">
          <div className="mb-3 flex flex-col gap-1">
            <b className="text-sm text-white">سازگاری با گیربکس / واسکازین</b>
            <span className="text-xs leading-5 text-slate-400">
              برای محصولات دسته «واسکازین / روغن گیربکس» مشخص کن این روغن مناسب چه نوع گیربکس‌هایی است؛ مثل CVT، اتوماتیک، دستی یا ATF. برای روغن موتور می‌توانی خالی بگذاری.
            </span>
          </div>

          {isGearboxProduct(form.category) ? (
            <>
              <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                {TRANSMISSION_TYPES.map((type) => (
                  <label key={type} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 p-3 text-sm font-bold text-white hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={(form.compatible_transmissions || []).includes(type)}
                      onChange={() => setForm({ ...form, compatible_transmissions: toggleTextValue(form.compatible_transmissions || [], type) })}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                <input
                  value={customTransmission}
                  onChange={(e) => setCustomTransmission(e.target.value)}
                  placeholder="افزودن گزینه دلخواه؛ مثال: فلومکس مولتی پلکس، SP-III، ATF+4"
                  className="rounded-xl bg-slate-800 p-3 text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = customTransmission.trim();
                    if (!value) return;
                    setForm({ ...form, compatible_transmissions: Array.from(new Set([...(form.compatible_transmissions || []), value])) });
                    setCustomTransmission('');
                  }}
                  className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black text-slate-950"
                >
                  افزودن گیربکس
                </button>
              </div>

              {!!(form.compatible_transmissions || []).length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(form.compatible_transmissions || []).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setForm({ ...form, compatible_transmissions: (form.compatible_transmissions || []).filter((x) => x !== item) })}
                      className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200"
                    >
                      {item} ×
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="rounded-xl bg-slate-800 p-3 text-xs text-slate-400">
              این بخش فقط وقتی دسته محصول را روی «واسکازین / روغن گیربکس» بگذاری فعال می‌شود تا فرم محصولات معمولی شلوغ نشود.
            </p>
          )}
        </div>


        <Field label="قیمت اصلی" hint="مبلغ به تومان ذخیره می‌شود.">
          <div className="flex overflow-hidden rounded bg-slate-800"><input inputMode="numeric" placeholder="مثلاً 1,750,000" value={form.price ? Number(form.price).toLocaleString('en-US') : ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value.replace(/\D/g, '')) || 0 })} className="min-w-0 flex-1 bg-transparent p-3 text-white outline-none" /><span className="grid place-items-center border-r border-slate-700 px-3 text-xs font-bold text-yellow-300">تومان</span></div>
        </Field>
        <Field label="قیمت شگفت‌انگیز" hint="قیمت تخفیفی موقت به تومان.">
          <div className="flex overflow-hidden rounded bg-slate-800"><input inputMode="numeric" placeholder="مثلاً 1,500,000" value={form.amazing_price ? Number(form.amazing_price).toLocaleString('en-US') : ''} onChange={(e) => { const raw=e.target.value.replace(/\D/g, ''); setForm({ ...form, amazing_price: raw ? Number(raw) : null }); }} className="min-w-0 flex-1 bg-transparent p-3 text-white outline-none" /><span className="grid place-items-center border-r border-slate-700 px-3 text-xs font-bold text-yellow-300">تومان</span></div>
        </Field>

        <div className="rounded-xl bg-slate-950/30 p-3 md:col-span-2">
          <div className="mb-3 flex flex-col gap-1">
            <b className="text-sm text-white">پایان پیشنهاد شگفت‌انگیز به تاریخ شمسی</b>
            <span className="text-xs text-slate-400">مثال: اگر می‌خواهی تخفیف تا ۲ روز و ۸ ساعت دیگر فعال باشد، تاریخ و ساعت پایان را اینجا وارد کن. تایمر فروشگاه دقیقاً از همین زمان کم می‌شود.</span>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            <input aria-label="سال شمسی" placeholder="سال شمسی، مثال 1405" type="number" value={amazingJalali.jy} onChange={(e) => setAmazingFromJalali(form, setForm, { jy: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
            <input aria-label="ماه شمسی" placeholder="ماه" type="number" min={1} max={12} value={amazingJalali.jm} onChange={(e) => setAmazingFromJalali(form, setForm, { jm: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
            <input aria-label="روز شمسی" placeholder="روز" type="number" min={1} max={31} value={amazingJalali.jd} onChange={(e) => setAmazingFromJalali(form, setForm, { jd: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
            <input aria-label="ساعت پایان" placeholder="ساعت" type="number" min={0} max={23} value={amazingJalali.hour} onChange={(e) => setAmazingFromJalali(form, setForm, { hour: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
            <input aria-label="دقیقه پایان" placeholder="دقیقه" type="number" min={0} max={59} value={amazingJalali.minute} onChange={(e) => setAmazingFromJalali(form, setForm, { minute: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          </div>
          <button type="button" onClick={() => setForm({ ...form, amazing_ends_at: null, amazing_price: null })} className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700">پاک کردن تخفیف شگفت‌انگیز</button>
        </div>

        <Field label="موجودی انبار" hint="تعداد قابل فروش در انبار انتخاب‌شده.">
          <input placeholder="مثلاً 8" type="number" min={0} value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: Number(e.target.value || 0) })} className="w-full rounded bg-slate-800 p-3 text-white" />
        </Field>
        <Field label="محل نگهداری موجودی" hint="انبار فروشگاه، انبار مرکزی پرند یا هر انبار دیگری که در پنل تعریف شده است.">
          <select value={form.warehouse_id || ''} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value || null })} className="w-full rounded bg-slate-800 p-3 text-white">
            <option value="">انتخاب انبار</option>
            {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
          </select>
        </Field>

        <div className="flex flex-wrap gap-4 rounded bg-slate-800 p-3 text-white md:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> فعال</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> پیشنهاد ویژه / شگفت‌انگیز</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} /> پرفروش</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_out_of_stock} onChange={(e) => setForm({ ...form, is_out_of_stock: e.target.checked, stock: e.target.checked ? 0 : form.stock })} /> ناموجود</label>
        </div>

        <Field label="ویژگی‌های اصلی روی کارت محصول" hint="یک متن کوتاه و فروشگاهی بنویس؛ مثال: 4 لیتری • API SN • مناسب موتورهای بنزینی">
          <input
            placeholder="مثال: 4 لیتری • API SN • مناسب موتورهای بنزینی"
            value={form.card_features || ''}
            onChange={(e) => setForm({ ...form, card_features: e.target.value })}
            className="w-full rounded bg-slate-800 p-3 text-white"
            maxLength={120}
          />
        </Field>


        <Field label="دلیل پیشنهاد برای خودرو" hint="متن کوتاهی که روی کارت محصول سازگار نمایش داده می‌شود؛ مثال: مناسب موتور TU5 یا توصیه‌شده برای خودروی شما">
          <input
            placeholder="مثال: مناسب موتور TU5"
            value={form.recommendation_reason || ''}
            onChange={(e) => setForm({ ...form, recommendation_reason: e.target.value })}
            className="w-full rounded bg-slate-800 p-3 text-white"
            maxLength={100}
          />
        </Field>

        <Field label="اولویت پیشنهاد برای خودرو" hint="عدد بزرگ‌تر یعنی این محصول در پیشنهادهای خودرویی بالاتر نمایش داده شود.">
          <input
            type="number"
            min={0}
            max={999}
            value={form.recommendation_priority || 0}
            onChange={(e) => setForm({ ...form, recommendation_priority: Number(e.target.value || 0) })}
            className="w-full rounded bg-slate-800 p-3 text-white"
          />
        </Field>

        <Field label="عنوان پیشنهاد خرید مکمل" hint="عنوان باکس «با هم بخرید» در صفحه محصول.">
          <input
            value={form.upsell_title || ''}
            onChange={(e) => setForm({ ...form, upsell_title: e.target.value })}
            placeholder="همراه این محصول پیشنهاد می‌کنیم"
            className="w-full rounded bg-slate-800 p-3 text-white"
            maxLength={90}
          />
        </Field>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 md:col-span-2">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-bold text-white">محصولات مکمل برای «با هم بخرید»</h2>
              <p className="mt-1 text-xs text-slate-400">با جستجو یا فیلتر دسته‌بندی، محصول مکمل را سریع پیدا کن.</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300">
              {selectedRelatedProducts.length.toLocaleString('fa-IR')} محصول انتخاب‌شده
            </div>
          </div>

          {selectedRelatedProducts.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              {selectedRelatedProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => item.id && toggleRelatedProduct(item.id)}
                  className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-rose-500/15 hover:text-rose-200"
                  title="حذف از انتخاب"
                >
                  <span className="max-w-44 truncate">{item.name}</span>
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          )}

          <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <input
              value={relatedSearch}
              onChange={(event) => setRelatedSearch(event.target.value)}
              placeholder="جستجوی نام محصول، برند یا دسته‌بندی..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-yellow-400/60"
            />
            <button
              type="button"
              onClick={() => { setRelatedSearch(''); setRelatedCategory('all'); }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              پاک کردن فیلتر
            </button>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setRelatedCategory('all')}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${relatedCategory === 'all' ? 'bg-yellow-400 text-slate-950' : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
            >
              همه ({products.filter((item) => item.id && item.id !== editingProductId).length.toLocaleString('fa-IR')})
            </button>
            {PRODUCT_CATEGORIES.map((category) => {
              const count = products.filter((item) => item.id && item.id !== editingProductId && item.category === category.value).length;
              if (!count) return null;
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setRelatedCategory(category.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${relatedCategory === category.value ? 'bg-yellow-400 text-slate-950' : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                >
                  {category.label} ({count.toLocaleString('fa-IR')})
                </button>
              );
            })}
          </div>

          <div className="max-h-[32rem] space-y-2 overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 p-2">
            {relatedGroups.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">محصولی با این جستجو پیدا نشد.</div>
            ) : relatedGroups.map(([category, items]) => {
              const isOpen = relatedSearch.trim() !== '' || relatedCategory !== 'all' || openRelatedCategories.includes(category);
              const selectedCount = items.filter((item) => item.id && (form.related_product_ids || []).includes(item.id)).length;
              return (
                <div key={category} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
                  <button
                    type="button"
                    onClick={() => toggleRelatedCategory(category)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right"
                  >
                    <span>
                      <b className="block text-sm text-white">{getCategoryLabel(category)}</b>
                      <small className="text-slate-500">{items.length.toLocaleString('fa-IR')} کالا{selectedCount ? ` • ${selectedCount.toLocaleString('fa-IR')} انتخاب‌شده` : ''}</small>
                    </span>
                    <span className={`text-lg text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
                  </button>

                  {isOpen && (
                    <div className="grid gap-2 border-t border-slate-800 p-2 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => {
                        const checked = !!item.id && (form.related_product_ids || []).includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => item.id && toggleRelatedProduct(item.id)}
                            className={`flex min-h-24 items-center gap-3 rounded-xl border p-3 text-right transition ${checked ? 'border-emerald-500/35 bg-emerald-500/12' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-800/80'}`}
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-white">
                              {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-contain p-1" /> : <div className="flex h-full items-center justify-center text-[10px] text-slate-400">بدون عکس</div>}
                            </div>
                            <span className="min-w-0 flex-1">
                              <b className={`block line-clamp-2 text-sm ${checked ? 'text-emerald-100' : 'text-slate-200'}`}>{item.name}</b>
                              <small className="mt-1 block text-slate-500">{item.brand || getCategoryLabel(item.category)}</small>
                              <small className="mt-1 block font-black text-yellow-300">{item.price.toLocaleString('fa-IR')} تومان</small>
                            </span>
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black ${checked ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-600 text-slate-500'}`}>{checked ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Field label="توضیحات کامل محصول" hint="این متن در صفحه محصول و توضیح Hover استفاده می‌شود.">
          <textarea placeholder="توضیحات محصول" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded bg-slate-800 p-3 text-white" rows={3} />
        </Field>

        <Field label="مشخصات فنی" hint="هر مشخصه را به شکل «عنوان: مقدار» در یک خط بنویس؛ مثال: حجم: 4 لیتر">
          <textarea
            rows={6}
            value={specificationsText}
            onChange={(e) => {
              const nextText = e.target.value;
              setSpecificationsText(nextText);
              setForm((current) => ({ ...current, specifications: parseSpecificationsText(nextText) }));
            }}
            placeholder={'حجم: 4 لیتر\nاستاندارد: API SN\nکشور سازنده: ایران'}
            className="w-full rounded bg-slate-800 p-3 text-white"
          />
          <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-400">
            {Object.keys(form.specifications || {}).length
              ? `${Object.keys(form.specifications || {}).length.toLocaleString('fa-IR')} مشخصه آماده ذخیره است.`
              : 'هر مشخصه را در یک خط جدا و با علامت «:» وارد کن.'}
          </div>
        </Field>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 md:col-span-2">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-white">سازگاری با خودرو</h2>
              <p className="text-xs text-slate-400">محصول برای چه خودروهایی مناسب است؟</p>
            </div>
            <input placeholder="جستجوی خودرو..." value={carSearch} onChange={(e) => setCarSearch(e.target.value)} className="rounded bg-slate-800 p-2 text-sm text-white" />
          </div>

          <label className="mb-4 flex cursor-pointer items-center justify-between rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm font-black text-yellow-200">
            <span>سازگاری با تمامی خودروها</span>
            <input type="checkbox" checked={!!form.compatible_all_cars} onChange={(e) => toggleAllCars(e.target.checked)} />
          </label>

          {!form.compatible_all_cars && (
            <>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveBrand('all')}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${activeBrand === 'all' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  همه شرکت‌ها
                </button>
                {carBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setActiveBrand(brand)}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${activeBrand === brand ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              {cars.length === 0 ? (
                <p className="rounded-xl bg-yellow-400/10 p-3 text-sm text-yellow-200">
                  هنوز خودرویی ثبت نشده. اول از منوی «خودروها» دیتابیس خودروها را بساز.
                </p>
              ) : (
                <div className="max-h-72 space-y-4 overflow-auto pl-1">
                  {Object.entries(groupedFilteredCars).map(([brand, brandCars]) => (
                    <div key={brand}>
                      <h3 className="mb-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-yellow-300">{brand}</h3>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {brandCars.map((car) => (
                          <label key={car.id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 p-3 text-sm text-white hover:bg-slate-700">
                            <input type="checkbox" checked={(form.compatible_car_ids || []).includes(car.id!)} onChange={() => toggleCar(car.id)} />
                            <span>{getCarTitle(car)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-2 md:flex-row">
          <button onClick={saveProduct} className="flex-1 rounded bg-yellow-400 p-3 font-bold text-slate-950">
            {editingProductId ? 'ذخیره تغییرات' : 'افزودن محصول'}
          </button>
          {editingProductId && (
            <button onClick={resetForm} className="rounded bg-slate-700 px-6 py-3 font-bold text-white hover:bg-slate-600">
              لغو ویرایش
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(150px,auto))]">
          <input
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder="جستجو با نام، برند، دسته یا شناسه محصول..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-yellow-400 focus:outline-none"
          />
          <select value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white">
            <option value="all">همه دسته‌ها</option>
            {PRODUCT_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
          <select value={productStatusFilter} onChange={(event) => setProductStatusFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white">
            <option value="all">همه وضعیت‌ها</option>
            <option value="available">موجود و فعال</option>
            <option value="out">ناموجود</option>
            <option value="featured">پیشنهاد ویژه</option>
            <option value="bestseller">پرفروش</option>
            <option value="inactive">غیرفعال</option>
          </select>
          <select value={productSort} onChange={(event) => setProductSort(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white">
            <option value="newest">جدیدترین</option>
            <option value="name">نام محصول</option>
            <option value="stock-desc">بیشترین موجودی</option>
            <option value="stock-asc">کمترین موجودی</option>
            <option value="price-desc">بیشترین قیمت</option>
            <option value="price-asc">کمترین قیمت</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs text-slate-300">
          <span>کل محصولات: <b className="text-white">{products.length.toLocaleString('fa-IR')}</b></span>
          <span>نتیجه نمایش: <b className="text-yellow-300">{filteredProducts.length.toLocaleString('fa-IR')}</b></span>
          {(productSearch || productCategoryFilter !== 'all' || productStatusFilter !== 'all') && (
            <button type="button" onClick={() => { setProductSearch(''); setProductCategoryFilter('all'); setProductStatusFilter('all'); setProductSort('newest'); }} className="rounded-lg bg-slate-800 px-3 py-2 font-bold text-white">پاک کردن فیلترها</button>
          )}
        </div>

        {recentProducts.length > 0 && (
          <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <b className="text-sm text-yellow-200">محصولات اخیراً ویرایش‌شده</b>
              <button type="button" onClick={() => { setRecentProductIds([]); localStorage.removeItem('carrtell_recent_product_ids'); }} className="text-xs text-slate-400">پاک کردن</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recentProducts.map((item) => (
                <button key={item.id} type="button" onClick={() => editProduct(item)} className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredProducts.map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-900 p-4 text-white">
            <div className="flex flex-col gap-3 md:flex-row md:justify-between">
            <div>
              <b>{item.name}</b>
              <p className="text-sm text-slate-400">{getCategoryLabel(item.category)} | قیمت اصلی: {item.price.toLocaleString('fa-IR')} تومان | موجودی: {item.stock}</p>
              {(item.amazing_price || item.amazing_ends_at) && (
                <p className="mt-1 text-xs text-pink-300">
                  شگفت‌انگیز: {item.amazing_price ? item.amazing_price.toLocaleString('fa-IR') + ' تومان' : '-'} | پایان: {item.amazing_ends_at ? new Date(item.amazing_ends_at).toLocaleString('fa-IR') : '-'}
                </p>
              )}
              {(item.oil_grade || item.quality_level) && (
                <p className="mt-1 text-xs text-slate-500">
                  گرید: {item.oil_grade || '-'} | سطح کیفی: {item.quality_level || '-'}
                </p>
              )}
              {!!(item.compatible_transmissions || []).length && (
                <p className="mt-1 text-xs text-cyan-300">
                  مناسب گیربکس: {(item.compatible_transmissions || []).slice(0, 4).join('، ')}{(item.compatible_transmissions || []).length > 4 ? ' و بیشتر' : ''}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {statusBadge(item).map((badge) => (
                  <span key={badge} className="rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-bold text-yellow-200">{badge}</span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {carNames(item).slice(0, 6).map((name) => (
                  <span key={name} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{name}</span>
                ))}
                {!item.compatible_all_cars && (item.compatible_car_ids?.length || 0) > 6 && <span className="text-xs text-slate-500">+ موارد بیشتر</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <button onClick={() => editProduct(item)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-400">ویرایش کامل</button>
              <button onClick={() => openQuickEdit(item)} className="rounded-lg bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25">ویرایش سریع</button>
              <button onClick={() => toggleProductOption(item, 'is_featured')} className={`rounded-lg px-3 py-2 text-xs font-bold ${item.is_featured ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>پیشنهاد ویژه</button>
              <button onClick={() => toggleProductOption(item, 'is_best_seller')} className={`rounded-lg px-3 py-2 text-xs font-bold ${item.is_best_seller ? 'bg-green-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>پرفروش</button>
              <button onClick={() => toggleProductOption(item, 'is_out_of_stock')} className={`rounded-lg px-3 py-2 text-xs font-bold ${item.is_out_of_stock || item.stock <= 0 ? 'bg-red-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>ناموجود</button>
              <button onClick={() => remove(item.id)} className="px-3 py-2 text-sm text-red-400">حذف</button>
            </div>
            </div>

            {quickEditId === item.id && (
              <div className="mt-4 grid gap-3 rounded-xl border border-cyan-400/20 bg-slate-950/70 p-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1 text-xs text-slate-400">
                  <span>قیمت</span>
                  <input type="number" value={Number(quickEditDraft.price ?? item.price)} onChange={(event) => setQuickEditDraft({ ...quickEditDraft, price: Number(event.target.value) })} className="w-full rounded-lg bg-slate-800 p-3 text-white" />
                </label>
                <label className="space-y-1 text-xs text-slate-400">
                  <span>موجودی</span>
                  <input type="number" value={Number(quickEditDraft.stock ?? item.stock)} onChange={(event) => setQuickEditDraft({ ...quickEditDraft, stock: Number(event.target.value) })} className="w-full rounded-lg bg-slate-800 p-3 text-white" />
                </label>
                <div className="grid grid-cols-2 gap-2 md:col-span-2">
                  {[
                    ['is_active', 'فعال'],
                    ['is_featured', 'پیشنهاد ویژه'],
                    ['is_best_seller', 'پرفروش'],
                    ['is_out_of_stock', 'ناموجود'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white">
                      <span>{label}</span>
                      <input type="checkbox" checked={!!quickEditDraft[key as keyof Product]} onChange={(event) => setQuickEditDraft({ ...quickEditDraft, [key]: event.target.checked })} />
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 md:col-span-2 lg:col-span-4">
                  <button type="button" onClick={() => saveQuickEdit(item)} className="flex-1 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950">ذخیره سریع</button>
                  <button type="button" onClick={() => { setQuickEditId(null); setQuickEditDraft({}); }} className="rounded-lg bg-slate-800 px-5 py-3 text-sm font-bold text-white">انصراف</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">محصولی با این جستجو و فیلتر پیدا نشد.</div>
        )}
      </div>
    </div>
  );
}

export default Products;
