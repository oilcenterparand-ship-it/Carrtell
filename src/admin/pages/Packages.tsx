import { useEffect, useMemo, useState } from 'react';
import { PackagePlus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { getProducts, type Product } from '../services/productsApi';
import { getCars, getCarTitle, type Car } from '../services/carsApi';
import {
  createCarPackage,
  deleteCarPackage,
  getCarPackages,
  updateCarPackage,
  type CarPackage,
  type CarPackageItem,
} from '../services/packagesApi';
import { getCategoryLabel } from '../../config/productCategories';

const PACKAGE_TYPE_OPTIONS = [
  'پکیج اقتصادی',
  'پکیج ویژه',
  'پکیج حرفه‌ای',
  'پکیج مراقبت خودرویی',
  'پکیج سرویس دوره‌ای',
  'پکیج سرویس تابستانه',
  'پکیج سرویس زمستانه',
  'پکیج افزایش عملکرد',
];

const emptyPackage: CarPackage = {
  title: '',
  slug: '',
  category_title: 'پکیج اقتصادی',
  car_id: null,
  description: '',
  badge: 'اقتصادی',
  image_url: '',
  is_active: true,
  sort_order: 1,
  items: [],
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(Number(price) || 0);
}

function isProductAvailable(product: Product & { active?: boolean; is_out_of_stock?: boolean }) {
  const active = product.is_active ?? product.active ?? true;
  return active !== false && product.is_out_of_stock !== true && Number(product.stock || 0) > 0;
}

function Packages() {
  const [packages, setPackages] = useState<CarPackage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [form, setForm] = useState<CarPackage>(emptyPackage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProductId, setNewProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  async function loadData() {
    setLoading(true);
    setErrorText('');
    try {
      const [packagesData, productsData, carsData] = await Promise.all([
        getCarPackages(),
        getProducts(),
        getCars(),
      ]);
      setPackages(packagesData || []);
      setProducts((productsData || []).filter((product) => isProductAvailable(product as Product & { active?: boolean; is_out_of_stock?: boolean })));
      setCars((carsData || []).filter((car) => car.is_active !== false));
    } catch (error) {
      console.error('Packages page load error:', error);
      setErrorText('اطلاعات پکیج‌ها لود نشد. معمولاً یعنی SQL پکیج‌ها کامل اجرا نشده یا یکی از فایل‌های پچ کامل جایگزین نشده است. متن خطا داخل Console مرورگر قابل مشاهده است.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeProducts = useMemo(() => products.filter((product) => product.id), [products]);

  function resetForm() {
    setForm({ ...emptyPackage, items: [] });
    setEditingId(null);
    setNewProductId('');
  }

  function editPackage(pkg: CarPackage) {
    setForm({
      ...emptyPackage,
      ...pkg,
      car_id: pkg.car_id || null,
      items: pkg.items || [],
    });
    setEditingId(pkg.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function addProductToPackage() {
    if (!newProductId) return;
    const exists = (form.items || []).some((item) => item.product_id === newProductId);
    if (exists) {
      alert('این محصول قبلاً داخل پکیج اضافه شده');
      return;
    }

    setForm({
      ...form,
      items: [...(form.items || []), { product_id: newProductId, quantity: 1 }],
    });
    setNewProductId('');
  }

  function updateItem(productId: string, quantity: number) {
    setForm({
      ...form,
      items: (form.items || []).map((item) =>
        item.product_id === productId ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item
      ),
    });
  }

  function removeItem(productId: string) {
    setForm({ ...form, items: (form.items || []).filter((item) => item.product_id !== productId) });
  }

  function getProduct(productId: string) {
    return products.find((product) => product.id === productId);
  }

  function packageTotal(items: CarPackageItem[] = []) {
    return items.reduce((sum, item) => {
      const product = item.product || getProduct(item.product_id);
      return sum + (Number(product?.price) || 0) * (item.quantity || 1);
    }, 0);
  }

  async function savePackage() {
    if (!form.title.trim()) {
      alert('نام پکیج الزامی است');
      return;
    }
    if (!form.category_title.trim()) {
      alert('نام دسته پکیج الزامی است، مثل پکیج اقتصادی');
      return;
    }
    if (!(form.items || []).length) {
      alert('حداقل یک محصول برای پکیج انتخاب کن');
      return;
    }

    try {
      const payload = { ...form, car_id: form.car_id || null, items: form.items || [] };
      if (editingId) {
        await updateCarPackage(editingId, payload);
        alert('پکیج ویرایش شد ✅');
      } else {
        await createCarPackage(payload);
        alert('پکیج ساخته شد ✅');
      }
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Save package error:', error);
      alert('ذخیره پکیج انجام نشد. Console مرورگر را باز کن و متن خطا را بفرست.');
    }
  }

  async function removePackage(id?: string) {
    if (!id) return;
    if (!confirm('این پکیج حذف شود؟')) return;
    try {
      await deleteCarPackage(id);
      await loadData();
    } catch (error) {
      console.error('Delete package error:', error);
      alert('حذف پکیج انجام نشد.');
    }
  }

  function carLabel(carId?: string | null) {
    if (!carId) return 'همه خودروها';
    const car = cars.find((item) => item.id === carId);
    return car ? getCarTitle(car) : 'خودروی نامشخص';
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت پکیج‌های خودرویی</h1>
          <p className="mt-2 text-sm text-slate-400">
            چند محصول را انتخاب کن تا در فروشگاه به شکل پکیج اقتصادی، کامل یا مخصوص خودرو نمایش داده شود.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4" />
          بارگذاری دوباره
        </button>
      </div>

      {errorText && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
          {errorText}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-slate-900 p-8 text-center text-slate-300">در حال بارگذاری پکیج‌ها...</div>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-900 p-5 shadow-xl">
            {editingId && (
              <div className="mb-4 rounded-xl bg-blue-500/10 p-3 text-sm font-bold text-blue-200">
                حالت ویرایش پکیج فعال است.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <input placeholder="نام پکیج؛ مثال: پکیج 206 اقتصادی" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500" />
              <select value={PACKAGE_TYPE_OPTIONS.includes(form.category_title) ? form.category_title : 'custom'} onChange={(e) => setForm({ ...form, category_title: e.target.value === 'custom' ? '' : e.target.value })} className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500">
                {PACKAGE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                <option value="custom">دسته دلخواه...</option>
              </select>
              {!PACKAGE_TYPE_OPTIONS.includes(form.category_title) && (
                <input placeholder="نام دسته دلخواه پکیج" value={form.category_title} onChange={(e) => setForm({ ...form, category_title: e.target.value })} className="mt-2 rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500" />
              )}
              <select value={form.car_id || ''} onChange={(e) => setForm({ ...form, car_id: e.target.value || null })} className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">برای همه خودروها</option>
                {cars.map((car) => <option key={car.id} value={car.id}>{getCarTitle(car)}</option>)}
              </select>
              <input placeholder="برچسب؛ مثال: اقتصادی / پیشنهادی / کامل" value={form.badge || ''} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500" />
              <input placeholder="آدرس عکس پکیج" value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500" />
              <input placeholder="ترتیب نمایش" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 1 })} className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500" />
              <textarea placeholder="توضیحات پکیج" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500 md:col-span-2" />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <h2 className="mb-3 font-bold text-white">محصولات داخل پکیج</h2>
              <div className="flex flex-col gap-3 md:flex-row">
                <select value={newProductId} onChange={(e) => setNewProductId(e.target.value)} className="flex-1 rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">انتخاب محصول</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {getCategoryLabel(product.category || '')} - {formatPrice(product.price)} تومان
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addProductToPackage} className="rounded-xl bg-sky-500 px-5 py-3 font-bold text-white hover:bg-sky-400">
                  افزودن محصول
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(form.items || []).map((item) => {
                  const product = item.product || getProduct(item.product_id);
                  return (
                    <div key={item.product_id} className="flex flex-col gap-3 rounded-xl bg-slate-800 p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-bold text-white">{product?.name || 'محصول حذف‌شده یا نامشخص'}</p>
                        <p className="text-xs text-slate-400">{formatPrice(product?.price || 0)} تومان</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.product_id, Number(e.target.value))} className="w-24 rounded-lg bg-slate-900 p-2 text-center text-white" />
                        <button type="button" onClick={() => removeItem(item.product_id)} className="rounded-lg bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {!(form.items || []).length && <p className="rounded-xl bg-slate-800 p-4 text-center text-sm text-slate-400">هنوز محصولی برای این پکیج انتخاب نشده.</p>}
              </div>

              <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-200">
                جمع قیمت محصولات پکیج: {formatPrice(packageTotal(form.items))} تومان
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button type="button" onClick={savePackage} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white hover:bg-emerald-400">
                <PackagePlus className="h-5 w-5" />
                {editingId ? 'ذخیره تغییرات پکیج' : 'ساخت پکیج'}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="rounded-xl bg-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-600">انصراف از ویرایش</button>}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-white">پکیج‌های ساخته‌شده</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-white">{pkg.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{pkg.category_title} • {carLabel(pkg.car_id)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${pkg.is_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                      {pkg.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{pkg.description || 'بدون توضیح'}</p>
                  <div className="mt-3 space-y-2">
                    {(pkg.items || []).map((item) => (
                      <div key={item.id || item.product_id} className="flex justify-between rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-200">
                        <span>{item.product?.name || 'محصول'}</span>
                        <span>× {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                    <strong className="text-emerald-300">{formatPrice(packageTotal(pkg.items))} تومان</strong>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editPackage(pkg)} className="rounded-lg bg-blue-500/20 p-2 text-blue-200 hover:bg-blue-500/30"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => removePackage(pkg.id)} className="rounded-lg bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!packages.length && <p className="rounded-xl bg-slate-800 p-5 text-center text-slate-400">هنوز پکیجی ساخته نشده.</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default Packages;
