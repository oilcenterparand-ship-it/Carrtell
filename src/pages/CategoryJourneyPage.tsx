import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, FolderTree, PackageSearch } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { buildCategoryTree, getCategoryDestination, getCategoryPath, getProductCategories, type ProductCategory, type ProductCategoryNode } from '../admin/services/categoriesApi';
import { getProducts, type Product } from '../admin/services/productsApi';
import { ProductCard } from './ShopPage';
import { addProductToCart, readCart, type CartItem } from '../lib/cart';

function CategoryIcon({ category }: { category: ProductCategory }) {
  return <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-amber-50 text-3xl">{category.image_url ? <img src={category.image_url} alt="" className="h-full w-full object-contain p-2" /> : category.icon_emoji || '📁'}</span>;
}

export default function CategoryJourneyPage() {
  const { slug } = useParams();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const [categoryRows, productRows] = await Promise.all([getProductCategories(), getProducts()]); setCategories(categoryRows.filter((item) => item.is_active !== false)); setProducts(productRows.filter((item) => item.is_active !== false)); } finally { setLoading(false); } })(); }, []);
  useEffect(() => { const sync = () => setCart(readCart()); window.addEventListener('carrtell-cart-updated', sync); return () => window.removeEventListener('carrtell-cart-updated', sync); }, []);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const current = slug ? categories.find((item) => item.slug === slug) : undefined;
  const children = useMemo(() => {
    if (!current?.id) return tree;
    const find = (nodes: ProductCategoryNode[]): ProductCategoryNode | undefined => { for (const node of nodes) { if (node.id === current.id) return node; const child = find(node.children); if (child) return child; } };
    return find(tree)?.children || [];
  }, [tree, current?.id]);
  const path = useMemo(() => current?.id ? getCategoryPath(categories, current.id) : [], [categories, current?.id]);
  const directProducts = useMemo(() => current?.id ? products.filter((item) => (item.category_ids || []).includes(current.id as string)) : [], [products, current?.id]);
  const reserved = useMemo(() => Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.quantity])), [cart]);
  function add(product: Product) { addProductToCart(product, 1); setCart(readCart()); }

  return <main dir="rtl" className="min-h-screen bg-slate-50 pb-28 pt-24 text-slate-900">
    <div className="mx-auto max-w-[1240px] px-4">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"><Link to="/">خانه</Link><ChevronLeft className="h-3.5 w-3.5" /><Link to="/categories">دسته‌بندی‌ها</Link>{path.map((item) => <span key={item.id} className="flex items-center gap-1.5"><ChevronLeft className="h-3.5 w-3.5" /><Link to={getCategoryDestination(item, 'journey')} className={item.id === current?.id ? 'font-black text-slate-900' : ''}>{item.title}</Link></span>)}</nav>

      <section className="rounded-[26px] bg-gradient-to-l from-slate-950 to-slate-800 p-6 text-white shadow-lg">
        <span className="inline-flex items-center gap-2 text-xs font-black text-amber-300"><FolderTree className="h-4 w-4" /> انتخاب مرحله‌به‌مرحله محصول</span>
        <h1 className="mt-3 text-2xl font-black">{current?.title || 'دسته‌بندی محصولات'}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-300">{current?.description || 'شاخه موردنظر را انتخاب کن تا به محصول نهایی برسی.'}</p>
      </section>

      {children.length > 0 && <section className="mt-6"><h2 className="mb-3 text-lg font-black">{current ? 'مرحله بعد را انتخاب کن' : 'یک دسته را انتخاب کن'}</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{children.map((child) => <Link key={child.id} to={getCategoryDestination(child, 'journey')} className="group flex min-h-[145px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg"><CategoryIcon category={child} /><b className="mt-3 text-sm leading-6">{child.title}</b><span className="mt-1 text-[10px] text-slate-400">{child.children.length ? `${child.children.length.toLocaleString('fa-IR')} زیرشاخه` : 'مشاهده محصولات'}</span></Link>)}</div></section>}

      {current && <section className="mt-7"><div className="mb-3"><h2 className="text-lg font-black">محصولات {current.title}</h2><p className="mt-1 text-xs text-slate-500">محصولاتی که مستقیماً به این شاخه متصل شده‌اند</p></div>{loading ? <div className="p-8 text-center text-sm text-slate-500">در حال بارگذاری...</div> : directProducts.length ? <div className="grid grid-cols-2 justify-items-center gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{directProducts.map((product) => <ProductCard key={product.id} product={product} reservedQuantity={reserved[product.id || ''] || 0} onAddToCart={add} compact />)}</div> : !children.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-9 text-center"><PackageSearch className="mx-auto h-10 w-10 text-slate-300" /><b className="mt-3 block">هنوز محصولی به این شاخه متصل نشده است</b><p className="mt-1 text-xs text-slate-500">از پنل مدیریت محصول را به همین شاخه نهایی وصل کن.</p></div>}</section>}
    </div>
  </main>;
}
