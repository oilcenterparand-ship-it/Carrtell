import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Car, Gift, Sparkles, Wrench } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getMyCarRecommendations } from "../../customer/services/recommendationsApi";

const darkCard = "rounded-3xl border border-white/10 bg-slate-950/75 shadow-xl shadow-black/20 backdrop-blur";
const inputButton = "rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white transition hover:border-amber-400/50 hover:bg-slate-800";

type SelectedCar = {
  id: string;
  name?: string | null;
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  engine?: string | null;
  gearbox?: string | null;
  current_km?: number | null;
  last_service_km?: number | null;
  next_service_km?: number | null;
};

type Product = {
  id: string;
  name?: string | null;
  title?: string | null;
  image_url?: string | null;
  price?: number | null;
  sale_price?: number | null;
  stock?: number | null;
  category_name?: string | null;
};

type PackageItem = {
  id: string;
  name?: string | null;
  title?: string | null;
  price?: number | null;
  image_url?: string | null;
};

function formatToman(value?: number | null) {
  if (!value) return "قیمت نامشخص";
  return `${Number(value).toLocaleString("fa-IR")} تومان`;
}

function carLabel(car?: SelectedCar | null) {
  if (!car) return "";
  return [car.brand, car.name || car.title || car.model, car.engine].filter(Boolean).join(" ") || "خودروی شما";
}

async function getSelectedCar(): Promise<SelectedCar | null> {
  const local = localStorage.getItem("carrtell_selected_car");
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed?.id) return parsed;
    } catch {}
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from("customer_vehicles")
    .select("*")
    .eq("user_id", userId)
    .or("is_default.eq.true,is_selected.eq.true")
    .limit(1)
    .maybeSingle();

  return data as SelectedCar | null;
}

async function getReadyPackages(carId?: string | null): Promise<PackageItem[]> {
  let query = supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data, error } = await query;
  if (error || !data) return [];

  // فقط پکیج‌های ساخته‌شده مدیر نمایش داده می‌شوند. اگر جدول فیلد car_id داشته باشد، سمت UI هم فیلتر می‌کنیم.
  return (data as any[])
    .filter((pkg) => !carId || !pkg.car_id || pkg.car_id === carId || pkg.compatible_with_all_cars === true)
    .slice(0, 6) as PackageItem[];
}

export default function SmartCarHomeSections() {
  const [selectedCar, setSelectedCar] = useState<SelectedCar | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        const car = await getSelectedCar();
        if (ignore) return;
        setSelectedCar(car);

        if (car?.id) {
          const [recommended, readyPackages] = await Promise.all([
            getMyCarRecommendations(car as any).then((result) => result.products).catch(() => []),
            getReadyPackages(car.id),
          ]);
          if (ignore) return;
          setProducts((recommended as Product[]).slice(0, 8));
          setPackages(readyPackages);
        } else {
          const readyPackages = await getReadyPackages(null);
          if (ignore) return;
          setProducts([]);
          setPackages(readyPackages.slice(0, 4));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    window.addEventListener("carrtell:selected-car-changed", load);
    window.addEventListener("storage", load);
    return () => {
      ignore = true;
      window.removeEventListener("carrtell:selected-car-changed", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const serviceKmText = useMemo(() => {
    if (!selectedCar) return "برای محاسبه سرویس بعدی، خودرو را انتخاب کن.";
    if (selectedCar.next_service_km) return `سرویس بعدی در کیلومتر ${Number(selectedCar.next_service_km).toLocaleString("fa-IR")}`;
    if (selectedCar.last_service_km) return `آخرین سرویس: ${Number(selectedCar.last_service_km).toLocaleString("fa-IR")} کیلومتر`;
    return "کیلومتر سرویس را در گاراژ ثبت کن تا یادآوری کیلومتری فعال شود.";
  }, [selectedCar]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className={`${darkCard} h-32 animate-pulse`} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 py-6" dir="rtl">
      {/* نوار بزرگ انتخاب خودرو حذف شد؛ انتخاب خودرو از هدر و پروفایل انجام می‌شود. */}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className={`${darkCard} p-5 lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <h3 className="text-lg font-black">محصولات مناسب خودروی شما</h3>
            </div>
            <Link to="/my-car/products" className="flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200">
              همه <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {products.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 transition hover:-translate-y-1 hover:border-amber-300/40">
                  <div className="aspect-square overflow-hidden rounded-xl bg-slate-800">
                    {product.image_url ? <img src={product.image_url} alt={product.name || product.title || "محصول"} className="h-full w-full object-contain" /> : null}
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm font-bold text-white">{product.name || product.title}</p>
                  <p className="mt-2 text-sm font-black text-amber-300">{formatToman(product.sale_price || product.price)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-amber-300/30 bg-amber-400/10 p-5 text-sm leading-7 text-slate-200">
              {selectedCar ? "فعلاً محصول سازگارِ موجود برای این خودرو پیدا نشد. از پنل مدیریت سازگاری محصول با خودرو را بررسی کن." : "برای نمایش محصولات دقیق، ابتدا خودروی خود را انتخاب کن."}
            </div>
          )}
        </div>

        <div className={`${darkCard} p-5`}>
          <div className="flex items-center gap-2 text-white">
            <Wrench className="h-5 w-5 text-emerald-300" />
            <h3 className="text-lg font-black">سرویس بعدی شما</h3>
          </div>
          <p className="mt-4 rounded-2xl bg-slate-900/80 p-4 text-sm leading-7 text-slate-200">{serviceKmText}</p>
          <Link to="/book" className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400">
            رزرو سرویس در محل
          </Link>
        </div>
      </div>

      <div className={`${darkCard} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-pink-300" />
            <h3 className="text-lg font-black">پکیج‌های آماده برای خودروی شما</h3>
          </div>
          <Link to="/packages" className="text-sm text-amber-300 hover:text-amber-200">مشاهده پکیج‌ها</Link>
        </div>

        {packages.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {packages.slice(0, 4).map((pkg) => (
              <Link key={pkg.id} to={`/packages/${pkg.id}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-pink-300/40">
                <p className="text-base font-black text-white">{pkg.name || pkg.title}</p>
                <p className="mt-3 text-sm font-bold text-pink-200">{formatToman(pkg.price)}</p>
                <p className="mt-3 text-xs text-slate-400">پکیج ساخته‌شده توسط مدیر</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-5 text-sm text-slate-300">هنوز پکیج آماده‌ای برای نمایش وجود ندارد.</div>
        )}
      </div>
    </section>
  );
}
