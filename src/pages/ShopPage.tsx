import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets, Filter, Wind, Snowflake, Settings, FlaskConical,
  Search, Star, ShoppingCart, SlidersHorizontal, ArrowLeft,
  ChevronDown, Tag
} from 'lucide-react';
import { products, categories, formatPrice, type Product } from '../data/products';

const categoryIcons: Record<string, React.ElementType> = {
  'engine-oil': Droplets,
  'oil-filter': Filter,
  'air-filter': Wind,
  'cabin-filter': Snowflake,
  'gear-oil': Settings,
  'additive': FlaskConical,
};

function ProductCard({ product }: { product: Product }) {
  const Icon = categoryIcons[product.category] || Droplets;
  return (
    <div className="glass-card group !p-0 overflow-hidden">
      <div className="relative aspect-[4/3] bg-navy-800 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute top-3 right-3 bg-gold-500 text-navy-950 text-xs font-bold px-2.5 py-1 rounded-lg">
          {product.brand}
        </div>
        {product.viscosity !== '-' && (
          <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
            {product.viscosity}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-gold-500" />
          <span className="text-white/40 text-xs">
            {categories.find(c => c.id === product.category)?.name}
          </span>
        </div>

        <h3 className="font-bold text-sm mb-2 group-hover:text-gold-500 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-gold-500 text-gold-500' : 'text-white/20'}`}
              />
            ))}
          </div>
          <span className="text-white/30 text-xs">({product.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-extrabold gold-gradient-text">
              {formatPrice(product.price)}
            </span>
            <span className="text-white/30 text-xs mr-1">تومان</span>
          </div>
          <Link
            to="/book"
            className="w-10 h-10 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center hover:bg-gold-500 hover:text-navy-950 transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (search) {
      result = result.filter(p =>
        p.name.includes(search) || p.brand.includes(search) || p.viscosity.includes(search)
      );
    }
    switch (sortBy) {
      case 'price-asc': return [...result].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...result].sort((a, b) => b.price - a.price);
      case 'rating': return [...result].sort((a, b) => b.rating - a.rating);
      default: return [...result].sort((a, b) => b.reviewCount - a.reviewCount);
    }
  }, [search, activeCategory, sortBy]);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="section-title !text-3xl md:!text-4xl mb-3">
            <span className="gold-gradient-text">فروشگاه</span> آویزسرویس
          </h1>
          <p className="text-white/50 text-lg">
            روغن موتور، فیلترها و محصولات با کیفیت اصلی
          </p>
        </div>

        {/* Promotion Banner */}
        <div className="glass-card border-gold-500/20 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6 text-gold-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-0.5">پیشنهاد ویژه تابستانه</h3>
            <p className="text-white/40 text-xs">تخفیف ۱۵٪ روی تمام روغن‌های کاسترول تا پایان تیرماه</p>
          </div>
          <Link to="/book" className="btn-primary !text-sm !px-5 !py-2">
            خرید با تخفیف
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="جستجوی روغن، برند یا ویسکوزیته..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-12 pl-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-gold-500/40 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-gold-500/40 transition-colors cursor-pointer"
              >
                <option value="popular">محبوب‌ترین</option>
                <option value="price-asc">ارزان‌ترین</option>
                <option value="price-desc">گران‌ترین</option>
                <option value="rating">بالاترین امتیاز</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-gold-500 text-navy-950'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            همه محصولات
          </button>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Droplets;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-gold-500 text-navy-950'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Vehicle Recommendation */}
        <div className="glass-card mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Search className="w-6 h-6 text-accent-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-0.5">روغن مناسب خودروی خود را پیدا کنید</h3>
            <p className="text-white/40 text-xs">مدل خودرو را انتخاب کنید تا بهترین روغن را پیشنهاد دهیم</p>
          </div>
          <Link to="/book" className="btn-secondary !text-sm !px-5 !py-2 flex items-center gap-2">
            انتخاب خودرو
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Droplets className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">محصولی یافت نشد</h3>
            <p className="text-white/40 text-sm">فیلتر یا عبارت جستجو را تغییر دهید</p>
          </div>
        )}
      </div>
    </main>
  );
}
