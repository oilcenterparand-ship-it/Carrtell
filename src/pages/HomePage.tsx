import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  FileCheck,
  Battery,
  ChevronLeft,
  
  Droplets,
  Gauge,
  Headphones,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import StorySlider from '../components/home/StorySlider';

const categories = [
  { title: 'روغن موتور', icon: Droplets },
  { title: 'فیلتر روغن', icon: Gauge },
  { title: 'فیلتر هوا', icon: PackageCheck },
  { title: 'باتری', icon: Battery },
  { title: 'ضدیخ', icon: ShieldCheck },
  { title: 'پک ویژه', icon: Sparkles },
];

const products = [
  { name: 'روغن موتور 10W40', price: '۱,۸۵۰,۰۰۰', tag: 'پرفروش' },
  { name: 'فیلتر روغن پژو 206', price: '۱۸۵,۰۰۰', tag: 'موجود' },
  { name: 'فیلتر هوا پراید', price: '۱۴۵,۰۰۰', tag: 'اقتصادی' },
  { name: 'پک سرویس 206', price: '۲,۲۵۰,۰۰۰', tag: 'پیشنهادی' },
];

export default function HomePage() {
  return (
    <main className="bg-neutral-50 text-neutral-950 pt-32">
      <section className="relative min-h-[620px] overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Carrtell oil service"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-neutral-950 via-neutral-950/80 to-neutral-950/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl mr-auto text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-yellow-400 font-bold text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              اولین سرویس تعویض روغن سیار ایران
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight text-white mb-6">
              تعویض روغن
              <br />
              <span className="text-yellow-400">در محل شما</span>
            </h1>

            <p className="text-lg md:text-2xl text-white/75 leading-9 mb-8">
              خودروی خود را انتخاب کنید، محصول مناسب را ببینید و سرویس را در محل خودتان رزرو کنید.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/book"
                className="inline-flex items-center gap-3 rounded-2xl bg-yellow-400 px-7 py-4 font-black text-neutral-950 hover:bg-yellow-300 transition"
              >
                رزرو تعویض روغن
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <Link
                to="/shop"
                className="inline-flex items-center gap-3 rounded-2xl border border-yellow-400/60 px-7 py-4 font-black text-yellow-400 hover:bg-yellow-400/10 transition"
              >
                مشاهده فروشگاه
                <ShoppingBag className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-3 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
            {[
  { title: 'تکنسین متخصص', desc: 'آموزش دیده و حرفه‌ای', Icon: Award },
  { title: 'محصولات اورجینال', desc: 'ضمانت اصالت کالا', Icon: FileCheck },
  { title: 'سرعت در خدمات', desc: 'در کمترین زمان ممکن', Icon: Zap },
  { title: 'قیمت شفاف', desc: 'بدون هزینه پنهان', Icon: ShieldCheck },
  { title: 'پشتیبانی', desc: 'همیشه کنار شما', Icon: Headphones },
].map(({ title, desc, Icon }) => (
              <div key={String(title)} className="flex items-center gap-3 p-3 text-white">
                <div className="w-11 h-11 rounded-2xl bg-yellow-400/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="font-black text-sm">{title}</div>
                  <div className="text-xs text-white/55 mt-1">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StorySlider />

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-black">دسته‌بندی‌های محبوب</h2>
            <button className="text-sm font-bold text-neutral-500 flex items-center gap-1">
              مشاهده همه
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div key={cat.title} className="bg-white rounded-3xl p-5 text-center border border-neutral-100 shadow-sm hover:shadow-lg transition">
                <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400/10 border border-yellow-400/40 flex items-center justify-center mb-4">
                  <cat.icon className="w-9 h-9 text-neutral-950" />
                </div>
                <div className="font-black">{cat.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-5">
          {['پک سرویس پژو 206', 'تخفیف روغن‌های پرفروش', 'سرویس در محل', 'محصولات اورجینال'].map((banner) => (
            <div key={banner} className="h-40 rounded-3xl bg-gradient-to-br from-neutral-950 to-neutral-800 p-6 text-white flex items-end shadow-lg">
              <div>
                <div className="text-xl font-black mb-2">{banner}</div>
                <div className="text-sm text-yellow-400">قابل تغییر از پنل مدیریت</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-500 rounded-3xl p-5 md:p-7">
            <div className="flex items-center justify-between mb-5 text-white">
              <h2 className="text-2xl md:text-3xl font-black">پیشنهاد شگفت‌انگیز</h2>
              <div className="font-black bg-white text-red-500 rounded-xl px-4 py-2">۱۹ : ۴۷ : ۲۰</div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div key={p.name} className="bg-white rounded-2xl p-4">
                  <div className="h-36 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                    <Droplets className="w-14 h-14 text-neutral-300" />
                  </div>
                  <div className="font-black text-sm mb-2">{p.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-red-100 text-red-600 rounded-full px-3 py-1 font-black">{p.tag}</span>
                    <span className="font-black">{p.price} تومان</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white p-7 border border-neutral-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-black">سرویس در محل</h2>
            </div>
            <p className="text-neutral-600 leading-8 mb-5">
              Carrtell در محل شما حاضر می‌شود و سرویس خودرو را با محصولات اصلی انجام می‌دهد.
            </p>
            <Link to="/book" className="inline-flex rounded-2xl bg-neutral-950 text-white px-6 py-3 font-black">
              ثبت رزرو
            </Link>
          </div>

          <div className="rounded-3xl bg-neutral-950 p-7 text-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-black">مشاور هوشمند Carrtell</h2>
            </div>
            <p className="text-white/65 leading-8 mb-5">
              بعداً این بخش فقط بر اساس موجودی واقعی انبار، روغن و پک مناسب خودرو را پیشنهاد می‌دهد.
            </p>
            <button className="rounded-2xl bg-yellow-400 text-neutral-950 px-6 py-3 font-black">
              شروع مشاوره
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}