import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CarFront,
  ChevronLeft,
  Gift,
  Headphones,
  Percent,
  Sparkles,
  Truck,
} from 'lucide-react';
import { ProductCard } from './ShopPage';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCategoryDestination, getProductCategories, type ProductCategory } from '../admin/services/categoriesApi';
import { addProductToCart, changeCartQuantity, readCart, type CartItem } from '../lib/cart';
import { defaultMegaMenuPromotion, defaultMegaMenuTiles, getMegaMenuPromotion, getMegaMenuTiles, type MegaMenuPromotion, type MegaMenuTile } from '../admin/services/homeContentApi';


export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [promoTiles, setPromoTiles] = useState<MegaMenuTile[]>(defaultMegaMenuTiles);
  const [industrialPromo, setIndustrialPromo] = useState<MegaMenuPromotion>(defaultMegaMenuPromotion);
  const [cart, setCart] = useState<Record<string, CartItem>>(() => readCart());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [productRows, categoryRows, promoTileRows, industrialRow] = await Promise.all([
          getProducts(),
          getProductCategories(),
          getMegaMenuTiles(),
          getMegaMenuPromotion(),
        ]);
        if (!active) return;
        setProducts(productRows.filter((product) => product.is_active !== false));
        setCategories(categoryRows.filter((category) => category.is_active !== false));
        setPromoTiles(promoTileRows);
        setIndustrialPromo(industrialRow);
      } catch (error) {
        console.error('Homepage load error:', error);
      } finally {
        // Home keeps lightweight discovery state; catalog loading belongs to /shop.
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const sync = () => setCart(readCart());
    window.addEventListener('carrtell-cart-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('carrtell-cart-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const activeProducts = useMemo(
    () => products.filter((product) => !product.is_out_of_stock && Number(product.stock || 0) > 0),
    [products],
  );
  const amazingProducts = useMemo(
    () => activeProducts.filter((product) => product.is_featured).slice(0, 6),
    [activeProducts],
  );
  const activePromoTiles = useMemo(
    () => promoTiles.filter((tile) => tile.is_active !== false).sort((a, b) => a.sort_order - b.sort_order).slice(0, 4),
    [promoTiles],
  );
  const reserved = useMemo(
    () => Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.quantity])),
    [cart],
  );

  function handleAdd(product: Product) {
    addProductToCart(product, 1);
    setCart(readCart());
  }

  function handleQuantity(product: Product, delta: number) {
    changeCartQuantity(product, delta);
    setCart(readCart());
  }

  const quickActions = [
    { title: 'محصولات مرتبط با خودروی شما', icon: CarFront, to: '/my-car/products', tone: 'car' },
    { title: 'پیشنهادشده‌ها', icon: Sparkles, to: '/shop/special-offers', tone: 'brands' },
    { title: 'تخفیف‌ها', icon: Percent, to: '/shop/special-offers', tone: 'discounts' },
    { title: 'پکیج‌های خودرویی', icon: Gift, to: '/shop/packages', tone: 'packages' },
    { title: 'مشاوره آنلاین', icon: Headphones, to: '/profile/support', tone: 'support' },
  ];

  return (
    <main dir="rtl" className="ct-reference-home min-h-screen bg-[#030910] text-white pt-28">
      <section className="ct-reference-home-inner mx-auto max-w-[1240px] px-4 pt-4">
        <div className="ct-home-desktop-legacy-hero">
          <div className="ct-home-desktop-legacy-main">
            <div className="relative z-10 max-w-xl">
              <span><Sparkles /> سرویس و فروش تخصصی خودرو</span>
              <h1>فروشگاه تخصصی Carrtell</h1>
              <p>محصول مناسب خودرو را پیدا کن، آنلاین سفارش بده یا سرویس در محل رزرو کن.</p>
              <div><Link to="/shop">مشاهده فروشگاه</Link><Link to="/book">رزرو سرویس</Link></div>
            </div>
          </div>
          <aside className="ct-home-desktop-journey-panel" aria-label="مسیر سریع خرید و سرویس">
            <div className="ct-home-desktop-journey-head">
              <span><CarFront /></span>
              <div>
                <small>خرید دقیق‌تر، بدون حذف محصول</small>
                <h2>خودروت را انتخاب کن؛ مناسب‌ها اول می‌آیند</h2>
                <p>بعد از انتخاب خودرو، محصولات سازگار با نشان «مناسب خودروی شما» بالاتر نمایش داده می‌شوند و بقیه محصولات همچنان قابل مشاهده‌اند.</p>
              </div>
            </div>
            <div className="ct-home-desktop-journey-actions">
              <Link to="/my-car/products"><Sparkles /> محصولات مناسب من <ArrowLeft /></Link>
              <Link to="/book"><Headphones /> رزرو سرویس <ArrowLeft /></Link>
            </div>
          </aside>
        </div>

        <div className="ct-reference-quick-actions" aria-label="دسترسی‌های سریع Carrtell">
          {quickActions.map(({ title, icon: Icon, to, tone }) => (
            <Link key={title} to={to} className={`ct-reference-quick-action is-${tone}`}>
              <span><Icon /></span><b>{title}</b>
            </Link>
          ))}
        </div>

        <div className="ct-reference-promo-grid" data-testid="home-hero-promo-tiles" aria-label="بنرهای تبلیغاتی صفحه اصلی">
          {activePromoTiles.map((tile) => (
            <Link key={tile.id || `${tile.title}-${tile.sort_order}`} to={tile.link_url || '/shop'} className="ct-reference-promo-card group">
              {tile.image_url ? <img src={tile.image_url} alt={tile.title} loading="lazy" /> : <div className="ct-reference-promo-fallback" />}
              <div className="ct-reference-promo-shade" />
              <div className="ct-reference-promo-copy">
                {tile.badge && <span>{tile.badge}</span>}
                <h2>{tile.title}</h2>
                {tile.subtitle && <p>{tile.subtitle}</p>}
                <b>مشاهده <ArrowLeft /></b>
              </div>
            </Link>
          ))}
        </div>

        {industrialPromo.is_active !== false && (
          <Link to={industrialPromo.link_url || '/industrial'} className="ct-reference-industrial">
            {industrialPromo.image_url && <img src={industrialPromo.image_url} alt={industrialPromo.title} loading="lazy" />}
            <div className="ct-reference-industrial-shade" />
            <div className="ct-reference-industrial-copy">
              <span>{industrialPromo.badge || 'بخش تخصصی جدید'}</span>
              <h2>{industrialPromo.title || 'روغن و فیلتر دیزلی و صنعتی'}</h2>
              <p>{industrialPromo.subtitle || 'خودرو سنگین، ماشین‌آلات، کارخانه، گالن ۲۰ لیتری و بشکه'}</p>
              <b>{industrialPromo.button_text || 'مشاهده محصولات'} <ArrowLeft /></b>
            </div>
            <Truck className="ct-reference-industrial-icon" />
          </Link>
        )}
      </section>

      <section className="ct-reference-home-inner mx-auto max-w-[1240px] px-4 py-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">دسته‌بندی‌های محبوب</h2>
          <Link to="/shop" className="flex items-center gap-1 text-xs font-bold text-white/75">مشاهده همه <ChevronLeft className="h-4 w-4" /></Link>
        </div>
        <div className="ct-reference-category-grid">
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id || category.slug} to={getCategoryDestination(category, 'journey')} className="ct-reference-category-card">
              <div>{category.image_url ? <img src={category.image_url} alt={category.title} loading="lazy" /> : <CarFront />}</div>
              <b>{category.title}</b>
            </Link>
          ))}
        </div>
      </section>

      {amazingProducts.length > 0 && (
        <section id="amazing-offers" className="ct-reference-home-inner mx-auto max-w-[1240px] px-4 pb-7">
          <div className="rounded-[22px] border border-amber-400/25 bg-[#0b1524] p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-white">
              <h2 className="text-lg font-black text-amber-400">پیشنهاد شگفت‌انگیز</h2>
              <Link to="/shop/special-offers" className="text-xs font-bold">مشاهده همه</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {amazingProducts.map((product) => (
                <ProductCard key={product.id} product={product} reservedQuantity={reserved[product.id || ''] || 0} onAddToCart={handleAdd} onChangeQuantity={handleQuantity} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="ct-reference-home-inner mx-auto max-w-[1240px] px-4 pb-10">
        <div className="ct-home-shop-handoff">
          <div>
            <span>فروشگاه کامل Carrtell</span>
            <h2>برای مقایسه، فیلتر و دیدن همه محصولات وارد فروشگاه شو</h2>
            <p>صفحه اصلی برای کشف سریع پیشنهادهاست؛ فروشگاه برای خرید کامل، فیلتر برند و دسته‌بندی و مرتب‌سازی محصولات.</p>
          </div>
          <Link to="/shop">ورود به فروشگاه <ArrowLeft /></Link>
        </div>
      </section>
    </main>
  );
}
