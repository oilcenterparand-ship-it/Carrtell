// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CarFront,
  ChevronDown,
  Droplets,
  Grid3X3,
  Home,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tag,
  User,
  X,
} from 'lucide-react';
import { getProducts, type Product } from '../admin/services/productsApi';
import { getCars, getCarTitle, type Car } from '../admin/services/carsApi';
import { getCategoryLabel, PRODUCT_CATEGORIES } from '../config/productCategories';
import { getCarPackages, type CarPackage } from '../admin/services/packagesApi';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price || 0);
}

type CartItem = {
  product: Product;
  quantity: number;
};

function isProductAvailable(product: Product, reservedQuantity = 0) {
  return !product.is_out_of_stock && product.stock - reservedQuantity > 0;
}

function ProductCard({
  product,
  cars,
  reservedQuantity,
  onAddToCart,
}: {
  product: Product;
  cars: Car[];
  reservedQuantity: number;
  onAddToCart: (product: Product) => void;
}) {
  const remainingStock = Math.max((product.stock || 0) - reservedQuantity, 0);
  const isAvailable = !product.is_out_of_stock && remainingStock > 0;
  const compatibleCars = (product.compatible_car_ids || [])
    .map((id) => cars.find((car) => car.id === id))
    .filter(Boolean) as Car[];

  return (
    <div className="glass-card group !p-0 overflow-hidden min-w-[145px] max-w-[145px] md:min-w-[160px] md:max-w-[160px]">
      <Link to={`/shop/product/${product.id}`} className="relative flex h-28 items-center justify-center bg-navy-800 md:h-32">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <Droplets className="w-8 h-8 text-gold-500/40" />
        )}

        <div className="absolute top-2 right-2 bg-gold-500 text-navy-950 text-[10px] font-bold px-2 py-0.5 rounded-lg">
          {product.brand || 'Carrtell'}
        </div>
        {!isAvailable && (
          <div className="absolute left-2 top-2 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">ناموجود</div>
        )}
        {isAvailable && product.is_featured && (
          <div className="absolute left-2 top-2 rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-navy-950">پیشنهاد ویژه</div>
        )}
        {isAvailable && !product.is_featured && product.is_best_seller && (
          <div className="absolute left-2 top-2 rounded-lg bg-gold-500/90 px-2 py-0.5 text-[10px] font-bold text-navy-950">پرفروش</div>
        )}
      </Link>

      <div className="p-2.5">
        <div className="mb-1 flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-gold-500" />
          <span className="text-white/40 text-[11px]">{getCategoryLabel(product.category)}</span>
        </div>

        <Link to={`/shop/product/${product.id}`} className="mb-1.5 block min-h-[34px] line-clamp-2 text-[11px] font-bold leading-4 transition-colors group-hover:text-gold-500">
          {product.name}
        </Link>

        <div className="mb-1.5 text-[10px] text-white/40">موجودی: {remainingStock}</div>

        {compatibleCars.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {compatibleCars.slice(0, 3).map((car) => (
              <span key={car.id} className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
                {getCarTitle(car)}
              </span>
            ))}
            {compatibleCars.length > 3 && <span className="text-[11px] text-white/30">+{compatibleCars.length - 3}</span>}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="gold-gradient-text text-xs font-extrabold">{formatPrice(product.price)}</span>
            <span className="mr-1 text-[10px] text-white/30">تومان</span>
          </div>

          {isAvailable ? (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10 transition-all hover:bg-gold-500 hover:text-navy-950"
              title="افزودن به سبد پیشنهادی"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button disabled className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white/30">ناموجود</button>
          )}
        </div>
      </div>
    </div>
  );
}

function HorizontalProducts({
  title,
  subtitle,
  icon,
  products,
  cars,
  cart,
  onAddToCart,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  products: Product[];
  cars: Car[];
  cart: Record<string, CartItem>;
  onAddToCart: (product: Product) => void;
}) {
  if (!products.length) return null;

  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 md:p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/15 text-gold-500">{icon}</div>
          <div>
            <h2 className="text-sm font-black text-white">{title}</h2>
            <p className="text-[11px] text-white/40">{subtitle}</p>
          </div>
        </div>
        <ArrowLeft className="h-5 w-5 text-white/30" />
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1.5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cars={cars}
            reservedQuantity={product.id ? cart[product.id]?.quantity || 0 : 0}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}


function PackageCard({
  pkg,
  cars,
  reservedQuantityByProductId,
  onAddPackageToCart,
}: {
  pkg: CarPackage;
  cars: Car[];
  reservedQuantityByProductId: Record<string, number>;
  onAddPackageToCart: (pkg: CarPackage) => void;
}) {
  const items = pkg.items || [];
  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1), 0);
  const salePrice = Number(pkg.sale_price || 0) > 0 ? Number(pkg.sale_price) : total;
  const hasDiscount = salePrice > 0 && salePrice < total;
  const car = pkg.car_id ? cars.find((item) => item.id === pkg.car_id) : null;
  const unavailableItems = items.filter((item) => {
    const product = item.product;
    if (!product?.id) return true;
    const reserved = reservedQuantityByProductId[product.id] || 0;
    return product.is_out_of_stock || (product.stock || 0) - reserved < (item.quantity || 1);
  });
  const isAvailable = items.length > 0 && unavailableItems.length === 0;

  return (
    <div className="min-w-[210px] max-w-[210px] overflow-hidden rounded-2xl border border-gold-500/20 bg-navy-950/70 shadow-xl md:min-w-[225px] md:max-w-[225px]">
      <div className="relative h-24 bg-navy-800 flex items-center justify-center">
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.title} className="h-full w-full object-cover opacity-80" />
        ) : (
          <PackageCheck className="h-9 w-9 text-gold-500/40" />
        )}
        {pkg.badge && <span className="absolute right-2 top-2 rounded-xl bg-gold-500 px-2 py-0.5 text-[10px] font-black text-navy-950">{pkg.badge}</span>}
        {!isAvailable && <span className="absolute left-2 top-2 rounded-xl bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">ناقص / ناموجود</span>}
      </div>

      <div className="p-2.5">
        <div className="mb-1 text-[11px] text-white/40">{car ? getCarTitle(car) : 'مناسب همه خودروها'}</div>
        <h3 className="mb-1.5 line-clamp-2 text-xs font-black text-white">{pkg.title}</h3>
        {pkg.description && <p className="mb-2 line-clamp-1 text-[10px] text-white/45">{pkg.description}</p>}

        <div className="mb-2 space-y-1">
          {items.slice(0, 3).map((item) => (
            <div key={item.id || item.product_id} className="flex items-center justify-between rounded-xl bg-white/5 px-2 py-1.5 text-[11px]">
              <span className="line-clamp-1 text-white/70">{item.product?.name || 'محصول حذف شده'}</span>
              <span className="shrink-0 text-gold-500">× {item.quantity}</span>
            </div>
          ))}
          {items.length > 3 && <p className="text-[10px] text-white/30">+ {items.length - 3} محصول دیگر</p>}
        </div>

        <div className="mb-2 flex items-center justify-between border-t border-white/10 pt-2">
          <span className="text-[11px] text-white/40">قیمت پکیج</span>
          <div className="text-left">
            {hasDiscount && <p className="text-xs text-white/35 line-through">{formatPrice(total)} تومان</p>}
            <b className="gold-gradient-text text-xs">{formatPrice(salePrice)} تومان</b>
          </div>
        </div>

        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => onAddPackageToCart(pkg)}
          className={`w-full rounded-xl px-3 py-2 text-[11px] font-black transition ${
            isAvailable ? 'bg-gold-500 text-navy-950 hover:bg-gold-400' : 'cursor-not-allowed bg-white/5 text-white/25'
          }`}
        >
          افزودن کل پکیج به سبد
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCarId, setActiveCarId] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [packages, setPackages] = useState<CarPackage[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [productsData, carsData, packagesData] = await Promise.all([getProducts(), getCars(), getCarPackages()]);
        setProducts(productsData.filter((p) => p.is_active));
        setCars(carsData.filter((car) => car.is_active !== false));
        setPackages(packagesData.filter((pkg) => pkg.is_active !== false));
      } catch (error) {
        console.error('Shop data load error:', error);
      }
    }

    load();
  }, []);

  const reservedQuantityByProductId = useMemo(() => {
    return Object.fromEntries(Object.entries(cart).map(([productId, item]) => [productId, item.quantity]));
  }, [cart]);

  const availableProducts = useMemo(() => {
    return products.filter((product) => isProductAvailable(product, reservedQuantityByProductId[product.id || ''] || 0));
  }, [products, reservedQuantityByProductId]);

  const bestSellerProducts = useMemo(() => {
    return availableProducts.filter((product) => product.is_best_seller).slice(0, 12);
  }, [availableProducts]);

  const featuredProducts = useMemo(() => {
    return availableProducts.filter((product) => product.is_featured).slice(0, 12);
  }, [availableProducts]);

  const packagesByCategory = useMemo(() => {
    return packages.reduce<Record<string, CarPackage[]>>((groups, pkg) => {
      const key = pkg.category_title || 'پکیج‌های پیشنهادی';
      groups[key] = [...(groups[key] || []), pkg];
      return groups;
    }, {});
  }, [packages]);

  const categories = useMemo(() => {
    const existing = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
    const ordered = PRODUCT_CATEGORIES.map((category) => category.value).filter((value) => existing.includes(value));
    return [...ordered, ...existing.filter((value) => !ordered.includes(value))];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;

    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (activeCarId !== 'all') {
      result = result.filter((p) => (p.compatible_car_ids || []).includes(activeCarId));
    }

    if (search) {
      result = result.filter((p) =>
        `${p.name} ${p.brand || ''} ${getCategoryLabel(p.category)} ${(p.compatible_car_ids || [])
          .map((id) => cars.find((car) => car.id === id))
          .filter(Boolean)
          .map((car) => getCarTitle(car as Car))
          .join(' ')}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'featured':
        return [...result].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
      case 'best-seller':
        return [...result].sort((a, b) => Number(b.is_best_seller) - Number(a.is_best_seller));
      case 'price-asc':
        return [...result].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...result].sort((a, b) => b.price - a.price);
      default:
        return [...result];
    }
  }, [products, cars, search, activeCategory, activeCarId, sortBy]);

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    if (!product.id) return;

    setCart((current) => {
      const currentQuantity = current[product.id!]?.quantity || 0;
      if (!isProductAvailable(product, currentQuantity)) return current;

      return {
        ...current,
        [product.id!]: {
          product,
          quantity: currentQuantity + 1,
        },
      };
    });
  }

  function removeFromCart(productId: string) {
    setCart((current) => {
      const item = current[productId];
      if (!item) return current;
      if (item.quantity <= 1) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return {
        ...current,
        [productId]: { ...item, quantity: item.quantity - 1 },
      };
    });
  }

  function addPackageToCart(pkg: CarPackage) {
    (pkg.items || []).forEach((item) => {
      if (!item.product?.id) return;
      for (let i = 0; i < (item.quantity || 1); i += 1) {
        addToCart(item.product);
      }
    });
  }

  function selectCategory(category: string) {
    setActiveCategory(category);
    setShowCategoryMenu(false);
  }

  return (
    <main className="min-h-screen pb-28 pt-24">
      {showCategoryMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowCategoryMenu(false)}>
          <div className="h-full w-[82%] max-w-sm bg-navy-950 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-white">
                <Grid3X3 className="h-5 w-5 text-gold-500" /> دسته‌بندی‌ها
              </div>
              <button onClick={() => setShowCategoryMenu(false)} className="rounded-xl bg-white/5 p-2 text-white/60">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button onClick={() => selectCategory('all')} className={`w-full rounded-2xl px-4 py-3 text-right text-sm font-bold ${activeCategory === 'all' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-white/70'}`}>همه محصولات</button>
              {categories.map((category) => (
                <button key={category} onClick={() => selectCategory(category)} className={`w-full rounded-2xl px-4 py-3 text-right text-sm font-bold ${activeCategory === category ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-white/70'}`}>
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title !mb-3 !text-3xl md:!text-4xl"><span className="gold-gradient-text">فروشگاه</span> Carrtell</h1>
            <p className="text-lg text-white/50">محصولات فعال، منتخب، پرفروش و پکیج‌های پیشنهادی خودرو</p>
          </div>
          <button onClick={() => setShowCategoryMenu(true)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="جستجوی محصول، برند یا خودرو..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm placeholder:text-white/30 transition-colors focus:border-gold-500/40 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm transition-colors focus:border-gold-500/40 focus:outline-none">
                <option value="popular">پیش‌فرض</option>
                <option value="featured">محصولات منتخب</option>
                <option value="best-seller">پرفروش</option>
                <option value="price-asc">ارزان‌ترین</option>
                <option value="price-desc">گران‌ترین</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            </div>
            <button onClick={() => setShowCategoryMenu(true)} className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/70 hover:bg-white/10 md:hidden">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => selectCategory('all')} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>همه محصولات</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => selectCategory(cat)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeCategory === cat ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>{getCategoryLabel(cat)}</button>
          ))}
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold"><CarFront className="h-4 w-4 text-gold-500" /> فیلتر براساس خودرو</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActiveCarId('all')} className={`shrink-0 rounded-lg px-4 py-2 text-sm ${activeCarId === 'all' ? 'bg-gold-500 text-navy-950' : 'bg-navy-900 text-white/60'}`}>همه خودروها</button>
            {cars.map((car) => (
              <button key={car.id} onClick={() => setActiveCarId(car.id!)} className={`shrink-0 rounded-lg px-4 py-2 text-sm ${activeCarId === car.id ? 'bg-gold-500 text-navy-950' : 'bg-navy-900 text-white/60 hover:text-white'}`}>{getCarTitle(car)}</button>
            ))}
          </div>
        </div>

        <HorizontalProducts
          title="پرفروش‌های Carrtell"
          subtitle="محصولاتی که از پنل با گزینه پرفروش مشخص شده‌اند"
          icon={<Sparkles className="h-5 w-5" />}
          products={bestSellerProducts}
          cars={cars}
          cart={cart}
          onAddToCart={addToCart}
        />

        <HorizontalProducts
          title="محصولات منتخب"
          subtitle="پیشنهادهای ویژه‌ای که در پنل فعال کرده‌ای"
          icon={<Tag className="h-5 w-5" />}
          products={featuredProducts}
          cars={cars}
          cart={cart}
          onAddToCart={addToCart}
        />

        {Object.entries(packagesByCategory).map(([categoryTitle, categoryPackages]) => (
          <section key={categoryTitle} className="mb-4 rounded-2xl border border-gold-500/20 bg-gold-500/[0.06] p-2.5 md:p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/15 text-gold-500"><PackageCheck className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-sm font-black text-white">{categoryTitle}</h2>
                  <p className="text-[11px] text-white/40">پکیج‌های ساخته‌شده در پنل مدیریت</p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 text-white/30" />
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1.5">
              {categoryPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  cars={cars}
                  reservedQuantityByProductId={reservedQuantityByProductId}
                  onAddPackageToCart={addPackageToCart}
                />
              ))}
            </div>
          </section>
        ))}

        {cartItems.length > 0 && (
          <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 md:p-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">سبد پیشنهادی فعلی</h2>
              <span className="text-sm text-gold-500">{cartCount} قلم</span>
            </div>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-navy-950/70 p-3">
                  <div>
                    <p className="text-sm font-bold text-white">{item.product.name}</p>
                    <p className="text-xs text-white/40">{formatPrice(item.product.price)} تومان</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.product.id!)} className="rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="min-w-6 text-center font-bold text-white">{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)} className="rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-white/50">جمع سبد پیشنهادی</span>
              <b className="gold-gradient-text text-sm">{formatPrice(cartTotal)} تومان</b>
            </div>
          </section>
        )}

        <div className="glass-card mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center shrink-0"><Search className="w-6 h-6 text-accent-400" /></div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-0.5">مشاور هوشمند Carrtell</h3>
            <p className="text-white/40 text-xs">AI بعداً فقط از همین محصولات سازگار، فعال و موجود پیشنهاد می‌دهد</p>
          </div>
          <Link to="/book" className="btn-secondary !text-sm !px-5 !py-2 flex items-center gap-2">انتخاب خودرو <ArrowLeft className="w-4 h-4" /></Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cars={cars}
              reservedQuantity={product.id ? reservedQuantityByProductId[product.id] || 0 : 0}
              onAddToCart={addToCart}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Droplets className="mx-auto mb-4 h-16 w-16 text-white/10" />
            <h3 className="mb-2 text-lg font-bold">محصول سازگار موجودی یافت نشد</h3>
            <p className="text-sm text-white/40">از پنل مدیریت، محصول را به خودروهای مناسب وصل کن</p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-navy-950/95 px-4 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2 text-white/60">
          <Link to="/" className="flex flex-col items-center gap-1 rounded-2xl p-2 hover:bg-white/5 hover:text-gold-500"><Home className="h-6 w-6" /><span className="sr-only">خانه</span></Link>
          <button onClick={() => setShowCategoryMenu(true)} className="relative flex flex-col items-center gap-1 rounded-2xl p-2 hover:bg-white/5 hover:text-gold-500"><Grid3X3 className="h-6 w-6" /><span className="sr-only">دسته‌بندی</span></button>
          <button className="relative flex flex-col items-center gap-1 rounded-2xl p-2 hover:bg-white/5 hover:text-gold-500">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && <span className="absolute right-6 top-1 rounded-full bg-gold-500 px-1.5 text-[10px] font-black text-navy-950">{cartCount}</span>}
            <span className="sr-only">سبد خرید</span>
          </button>
          <Link to="/dashboard" className="flex flex-col items-center gap-1 rounded-2xl p-2 hover:bg-white/5 hover:text-gold-500"><User className="h-6 w-6" /><span className="sr-only">پروفایل</span></Link>
        </div>
      </nav>
    </main>
  );
}
