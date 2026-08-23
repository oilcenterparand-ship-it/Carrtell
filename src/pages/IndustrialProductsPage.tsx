import { useEffect, useMemo, useState } from 'react';
import { Factory, Filter, Search, Truck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts, type Product } from '../admin/services/productsApi';
import { buildCategoryTree, getCategoryDescendantIds, getProductCategories, type ProductCategory } from '../admin/services/categoriesApi';
import { ProductCard } from './ShopPage';
import { addProductToCart, readCart, type CartItem } from '../lib/cart';

const ROOT_SLUG = 'industrial-diesel';

export default function IndustrialProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('all');
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const [productRows, categoryRows] = await Promise.all([getProducts(), getProductCategories()]); setProducts(productRows.filter((item) => item.is_active !== false)); setCategories(categoryRows.filter((item) => item.is_active !== false)); } finally { setLoading(false); } })(); }, []);
  useEffect(() => { const sync = () => setCart(readCart()); window.addEventListener('carrtell-cart-updated', sync); return () => window.removeEventListener('carrtell-cart-updated', sync); }, []);

  const root = categories.find((item) => item.slug === ROOT_SLUG);
  const industrialIds = useMemo(() => root?.id ? getCategoryDescendantIds(categories, root.id) : [], [categories, root?.id]);
  const categoryTree = useMemo(() => buildCategoryTree(categories).find((item) => item.slug === ROOT_SLUG), [categories]);
  const industrialProducts = useMemo(() => products.filter((item) => (item.category_ids || []).some((id) => industrialIds.includes(id))), [products, industrialIds]);
  const brands = useMemo(() => Array.from(new Set(industrialProducts.map((item) => item.brand).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'fa')), [industrialProducts]);
  const selectedIds = useMemo(() => selectedCategoryId ? getCategoryDescendantIds(categories, selectedCategoryId) : industrialIds, [categories, selectedCategoryId, industrialIds]);
  const filtered = useMemo(() => industrialProducts.filter((item) => {
    const categoryOk = (item.category_ids || []).some((id) => selectedIds.includes(id));
    const brandOk = brand === 'all' || item.brand === brand;
    const text = `${item.name} ${item.brand || ''} ${item.description || ''} ${item.oil_grade || ''} ${Object.values(item.specifications || {}).join(' ')}`.toLowerCase();
    return categoryOk && brandOk && (!query.trim() || text.includes(query.trim().toLowerCase()));
  }), [industrialProducts, selectedIds, brand, query]);
  const reserved = useMemo(() => Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.quantity])), [cart]);
  function add(product: Product) { addProductToCart(product, 1); setCart(readCart()); }

  return <main dir="rtl" className="min-h-screen bg-slate-50 pb-28 pt-24 text-slate-900">
    <section className="mx-auto max-w-[1240px] px-4">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl md:p-10">
        <Factory className="absolute -left-4 -bottom-5 h-40 w-40 text-white/5" />
        <div className="relative max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-black text-amber-300"><Truck className="h-4 w-4" /> مرکز دیزلی و صنعتی Carrtell</span><h1 className="mt-4 text-2xl font-black leading-10 md:text-4xl">روغن و فیلتر ماشین‌آلات دیزلی و صنعتی</h1><p className="mt-2 text-sm leading-7 text-slate-300">محصولات خودرو سنگین، راه‌سازی، کشاورزی، کارخانه و مصرف‌های حجیم؛ از گالن ۲۰ لیتری تا بشکه صنعتی.</p></div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(categoryTree?.children || []).map((category) => <button key={category.id} onClick={() => setSelectedCategoryId(category.id || '')} className={`rounded-2xl border p-4 text-right shadow-sm transition ${selectedCategoryId === category.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-amber-100 text-xl">{category.image_url ? <img src={category.image_url} alt="" className="h-full w-full object-contain p-1" /> : category.icon_emoji || <Wrench />}</span><b className="mt-3 block text-sm leading-6">{category.title}</b><span className="text-[11px] text-slate-500">مشاهده محصولات</span>
        </button>)}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو در محصولات صنعتی و دیزلی" className="w-full bg-transparent py-3 text-sm outline-none" /></label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="all">همه برندها</option>{brands.map((item) => <option key={item}>{item}</option>)}</select>
        <button onClick={() => { setSelectedCategoryId(''); setBrand('all'); setQuery(''); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white"><Filter className="h-4 w-4" /> پاک‌کردن فیلتر</button>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black">محصولات صنعتی و دیزلی</h2><p className="mt-1 text-xs text-slate-500">{filtered.length.toLocaleString('fa-IR')} محصول</p></div><Link to="/shop" className="text-xs font-black text-amber-700">فروشگاه محصولات سواری</Link></div>
      {loading ? <div className="mt-6 text-center text-sm text-slate-500">در حال دریافت محصولات...</div> : filtered.length ? <div className="mt-4 grid grid-cols-2 justify-items-center gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{filtered.map((product) => <ProductCard key={product.id} product={product} reservedQuantity={reserved[product.id || ''] || 0} onAddToCart={add} compact />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Factory className="mx-auto h-10 w-10 text-slate-300" /><b className="mt-3 block">محصولی در این شاخه ثبت نشده است</b><p className="mt-1 text-xs text-slate-500">محصول را از پنل مدیریت به یکی از زیرشاخه‌های صنعتی متصل کن.</p></div>}
    </section>
  </main>;
}
