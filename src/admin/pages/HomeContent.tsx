import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppWindow, Grid2X2, Image as ImageIcon, Layers3, Link2, Monitor, Smartphone, Sparkles } from 'lucide-react';
import {
  createHomeBanner,
  createHomeSection,
  deleteHomeBanner,
  deleteHomeSection,
  getHomeBanners,
  getHomeSections,
  updateHomeBanner,
  updateHomeSection,
  getTodayShoppingSettings,
  getMegaMenuPromotion,
  getMegaMenuTiles,
  saveMegaMenuPromotion,
  createMegaMenuTile,
  updateMegaMenuTile,
  deleteMegaMenuTile,
  defaultMegaMenuPromotion,
  updateTodayShoppingSettings,
  type HomeBanner,
  type HomeSection,
  type HomeSectionSource,
  type TodayShoppingSettings,
  type MegaMenuPromotion,
  type MegaMenuTile,
} from '../services/homeContentApi';
import { getProductCategories, type ProductCategory } from '../services/categoriesApi';
import ImageUploader from '../components/ImageUploader';
import FieldHelp from '../components/FieldHelp';

type ContentTab = 'hero' | 'tiles' | 'mega' | 'sections';

const inputClass = 'h-10 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400';
const panelClass = 'rounded-2xl border border-slate-700/80 bg-slate-900/80 p-3.5 shadow-xl shadow-black/10 md:p-4';

function AdminField({ title, help, children, wide = false }: { title: string; help: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? 'md:col-span-2' : ''}><FieldHelp title={title}>{help}</FieldHelp>{children}</label>;
}

function ActiveToggle({ checked, onChange, label = 'نمایش در سایت' }: { checked: boolean; onChange: (value: boolean) => void; label?: string }) {
  return <label className="flex h-10 cursor-pointer items-center justify-between rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-xs font-bold text-slate-200"><span>{label}</span><span className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-600'}`}><input className="sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? 'right-[18px]' : 'right-0.5'}`} /></span></label>;
}

const emptyBanner: HomeBanner = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '/shop',
  badge: '',
  sort_order: 0,
  is_active: true,
};

const emptyTodayShopping: TodayShoppingSettings = {
  title: 'امروز چی بخریم؟',
  subtitle: 'دسته‌های پیشنهادی برای خرید سریع‌تر',
};

const emptySection: HomeSection = {
  title: '',
  subtitle: '',
  slug: '',
  source_type: 'category',
  category_slug: '',
  badge: '',
  show_timer: false,
  ends_at: '',
  sort_order: 0,
  is_active: true,
};

const emptyMegaMenuTile: MegaMenuTile = {
  title: '',
  subtitle: '',
  badge: '',
  image_url: '',
  link_url: '/shop',
  sort_order: 0,
  is_active: true,
};

function makeSlug(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-آ-ی]/gi, '') || `section-${Date.now()}`;
}

function HomeContent() {
  const [activeTab, setActiveTab] = useState<ContentTab>('hero');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [bannerForm, setBannerForm] = useState<HomeBanner>(emptyBanner);
  const [sectionForm, setSectionForm] = useState<HomeSection>(emptySection);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [todayShopping, setTodayShopping] = useState<TodayShoppingSettings>(emptyTodayShopping);
  const [megaPromotion, setMegaPromotion] = useState<MegaMenuPromotion>(defaultMegaMenuPromotion);
  const [megaMenuTiles, setMegaMenuTiles] = useState<MegaMenuTile[]>([]);
  const [megaMenuTileForm, setMegaMenuTileForm] = useState<MegaMenuTile>(emptyMegaMenuTile);
  const [editingMegaMenuTileId, setEditingMegaMenuTileId] = useState<string | null>(null);

  const activeCategories = useMemo(() => categories.filter((category) => category.is_active !== false), [categories]);

  async function loadData() {
    const [bannerData, sectionData, categoryData, todayShoppingData, megaPromotionData, megaMenuTileData] = await Promise.all([getHomeBanners(), getHomeSections(), getProductCategories(), getTodayShoppingSettings(), getMegaMenuPromotion(), getMegaMenuTiles()]);
    setBanners(bannerData);
    setSections(sectionData);
    setCategories(categoryData);
    setTodayShopping({ ...emptyTodayShopping, ...todayShoppingData });
    setMegaPromotion({ ...defaultMegaMenuPromotion, ...megaPromotionData });
    setMegaMenuTiles(megaMenuTileData);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetBanner() {
    setBannerForm(emptyBanner);
    setEditingBannerId(null);
  }

  function resetSection() {
    setSectionForm(emptySection);
    setEditingSectionId(null);
  }

  async function saveBanner() {
    if (!bannerForm.title.trim()) {
      alert('عنوان بنر الزامی است');
      return;
    }

    try {
      if (editingBannerId) {
        await updateHomeBanner(editingBannerId, bannerForm);
        alert('بنر ویرایش شد ✅');
      } else {
        await createHomeBanner(bannerForm);
        alert('بنر ساخته شد ✅');
      }
      resetBanner();
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ذخیره بنر انجام نشد. Console را بررسی کن.');
    }
  }

  async function removeBanner(id: string) {
    if (!confirm('این بنر حذف شود؟')) return;
    await deleteHomeBanner(id);
    if (editingBannerId === id) resetBanner();
    await loadData();
  }



  async function saveTodayShopping() {
    if (!todayShopping.title.trim()) {
      alert('عنوان این بخش الزامی است');
      return;
    }

    try {
      await updateTodayShoppingSettings(todayShopping);
      alert('تنظیمات امروز چی بخریم ذخیره شد ✅');
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ذخیره تنظیمات انجام نشد. Console را بررسی کن.');
    }
  }

  async function saveMegaPromotion() {
    if (!megaPromotion.title.trim()) return alert('عنوان تبلیغ منوی دسته‌بندی الزامی است');
    try {
      const saved = await saveMegaMenuPromotion(megaPromotion);
      setMegaPromotion({ ...defaultMegaMenuPromotion, ...saved });
      alert('تبلیغ منوی دسته‌بندی ذخیره شد ✅');
    } catch (error) {
      console.error(error);
      alert('ذخیره تبلیغ انجام نشد؛ ابتدا Migration این Sprint را اجرا کن.');
    }
  }

  function resetMegaMenuTile() {
    setMegaMenuTileForm(emptyMegaMenuTile);
    setEditingMegaMenuTileId(null);
  }

  async function saveMegaMenuTile() {
    if (!megaMenuTileForm.title.trim()) return alert('عنوان بنر کوچک الزامی است');
    if (!megaMenuTileForm.link_url.trim()) return alert('لینک مقصد بنر کوچک الزامی است');
    try {
      if (editingMegaMenuTileId) await updateMegaMenuTile(editingMegaMenuTileId, megaMenuTileForm);
      else await createMegaMenuTile(megaMenuTileForm);
      alert(editingMegaMenuTileId ? 'بنر کوچک ویرایش شد ✅' : 'بنر کوچک ساخته شد ✅');
      resetMegaMenuTile();
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ذخیره بنر کوچک انجام نشد؛ ابتدا Migration این Sprint را اجرا کن.');
    }
  }

  async function removeMegaMenuTile(id: string) {
    if (!confirm('این بنر کوچک حذف شود؟')) return;
    try {
      await deleteMegaMenuTile(id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert('حذف بنر کوچک انجام نشد.');
    }
  }

  async function saveSection() {
    if (!sectionForm.title.trim()) {
      alert('عنوان سکشن الزامی است');
      return;
    }

    const payload = {
      ...sectionForm,
      slug: sectionForm.slug.trim() || makeSlug(sectionForm.title),
      category_slug: sectionForm.source_type === 'category' ? sectionForm.category_slug : '',
    };

    try {
      if (editingSectionId) {
        await updateHomeSection(editingSectionId, payload);
        alert('سکشن ویرایش شد ✅');
      } else {
        await createHomeSection(payload);
        alert('سکشن ساخته شد ✅');
      }
      resetSection();
      await loadData();
    } catch (error) {
      console.error(error);
      alert('ذخیره سکشن انجام نشد. Console را بررسی کن.');
    }
  }


  async function removeSection(id: string) {
    if (!confirm('این بخش از صفحه اصلی حذف شود؟')) return;
    await deleteHomeSection(id);
    if (editingSectionId === id) resetSection();
    await loadData();
  }

  const tabs: Array<{ id: ContentTab; label: string; hint: string; icon: typeof ImageIcon }> = [
    { id: 'hero', label: 'بنر اصلی', hint: 'اسلایدر فروشگاه', icon: ImageIcon },
    { id: 'tiles', label: 'بنرهای کوچک', hint: 'کارت‌های تبلیغاتی', icon: Grid2X2 },
    { id: 'mega', label: 'تبلیغ مگامنو', hint: 'داخل دسته‌بندی', icon: AppWindow },
    { id: 'sections', label: 'بخش‌ها و آیکون‌ها', hint: 'چیدمان صفحه', icon: Layers3 },
  ];

  const bannerPreview = bannerForm.image_url || banners.find((banner) => banner.is_active)?.image_url || '';

  return (
    <div className="space-y-3" data-testid="admin-media-manager">
      <header className="flex flex-col gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-amber-300" /><h1 className="text-lg font-black text-white md:text-xl">مدیریت تصاویر و بنرها</h1></div><p className="mt-1 text-[11px] leading-5 text-slate-400">تصویر، متن، لینک و ترتیب نمایش بخش‌های تبلیغاتی سایت را از یک صفحه کنترل کن.</p></div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-200"><Sparkles className="h-4 w-4" />آپلودها خودکار WebP و کم‌حجم می‌شوند</div>
      </header>

      <nav className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-700/70 bg-slate-900/80 p-1.5 lg:grid-cols-4" aria-label="بخش‌های مدیریت تصاویر">
        {tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-right transition ${active ? 'border border-amber-400/50 bg-amber-400/10 text-amber-200' : 'border border-transparent text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4 shrink-0" /><span><b className="block text-xs">{tab.label}</b><small className="mt-0.5 block text-[9px] text-slate-500">{tab.hint}</small></span></button>; })}
      </nav>

      {activeTab === 'hero' && <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]" data-testid="admin-home-slider-banners-section">
        <section className={panelClass}>
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-black text-white">{editingBannerId ? 'ویرایش بنر اسلایدی' : 'بنر اسلایدی جدید'}</h2><p className="mt-1 text-[10px] text-slate-500">بنر بزرگ فروشگاه؛ در اسلایدر بالای محصولات نمایش داده می‌شود.</p></div>{editingBannerId && <button type="button" onClick={resetBanner} className="rounded-lg border border-slate-600 px-3 py-1.5 text-[10px] text-slate-300">لغو ویرایش</button>}</div>
          <div className="grid gap-2.5 md:grid-cols-2" data-testid="admin-home-slider-banner-form">
            <AdminField title="عنوان بنر" help="متن اصلی و برجسته‌ای که مشتری روی بنر می‌بیند."><input className={inputClass} value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} placeholder="مثلاً فروش ویژه روغن موتور" /></AdminField>
            <AdminField title="زیرعنوان" help="توضیح کوتاه زیر عنوان؛ اختیاری است."><input className={inputClass} value={bannerForm.subtitle || ''} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} placeholder="خلاصه پیشنهاد" /></AdminField>
            <div className="md:col-span-2"><ImageUploader compact label="تصویر بنر" help="عکس افقی انتخاب کن؛ فایل خودکار به WebP سبک تبدیل و فقط یک‌بار آپلود می‌شود." folder="banners" value={bannerForm.image_url || ''} onChange={(image_url) => setBannerForm({ ...bannerForm, image_url })} /></div>
            <AdminField title="لینک مقصد" help="با کلیک روی بنر، مشتری به این صفحه می‌رود؛ مثل /shop یا /industrial."><div className="relative"><Link2 className="absolute right-3 top-3 h-4 w-4 text-slate-500" /><input dir="ltr" className={`${inputClass} pr-9 text-left`} value={bannerForm.link_url || ''} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })} placeholder="/shop?category=engine-oil" /></div></AdminField>
            <AdminField title="برچسب روی بنر" help="عبارت کوتاه جلب‌توجه؛ مثل «تا ۲۰٪ تخفیف»."><input className={inputClass} value={bannerForm.badge || ''} onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })} placeholder="اختیاری" /></AdminField>
            <AdminField title="ترتیب نمایش" help="عدد کمتر زودتر نمایش داده می‌شود؛ ۱ قبل از ۲."><input className={inputClass} type="number" min="0" value={bannerForm.sort_order} onChange={(e) => setBannerForm({ ...bannerForm, sort_order: Number(e.target.value) })} /></AdminField>
            <AdminField title="وضعیت نمایش" help="با خاموش‌کردن، بنر حذف نمی‌شود و فقط از سایت پنهان می‌ماند."><ActiveToggle checked={bannerForm.is_active} onChange={(is_active) => setBannerForm({ ...bannerForm, is_active })} /></AdminField>
            <button type="button" onClick={saveBanner} className="h-10 rounded-xl bg-amber-400 px-4 text-sm font-black text-slate-950 hover:bg-amber-300 md:col-span-2">{editingBannerId ? 'ذخیره تغییرات بنر' : 'افزودن بنر'}</button>
          </div>
        </section>

        <aside className="space-y-3">
          <section className={panelClass}>
            <div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-black text-white">پیش‌نمایش زنده</h2><div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5"><button type="button" onClick={() => setPreviewMode('desktop')} className={`grid h-7 w-9 place-items-center rounded-md ${previewMode === 'desktop' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`} title="دسکتاپ"><Monitor className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setPreviewMode('mobile')} className={`grid h-7 w-9 place-items-center rounded-md ${previewMode === 'mobile' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`} title="موبایل"><Smartphone className="h-3.5 w-3.5" /></button></div></div>
            <div className={`mx-auto overflow-hidden rounded-xl border border-slate-700 bg-slate-950 ${previewMode === 'mobile' ? 'max-w-[230px]' : 'w-full'}`}><div className={`${previewMode === 'mobile' ? 'aspect-[4/3]' : 'aspect-[16/6]'} relative bg-gradient-to-l from-slate-950 to-slate-800`}>{bannerPreview && <img src={bannerPreview} alt="پیش‌نمایش بنر" className="absolute inset-0 h-full w-full object-cover opacity-65" />}<div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/30 to-transparent" /><div className="absolute inset-y-0 right-0 flex max-w-[72%] flex-col justify-center p-3 text-right"><span className="mb-1 w-fit rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-black text-slate-950">{bannerForm.badge || 'برچسب بنر'}</span><b className="text-sm text-white">{bannerForm.title || 'عنوان بنر اینجا دیده می‌شود'}</b><small className="mt-1 text-[9px] text-slate-300">{bannerForm.subtitle || 'زیرعنوان کوتاه بنر'}</small></div></div></div>
          </section>
          <section className={panelClass}>
            <div className="mb-2 flex items-center justify-between"><div><h2 className="text-xs font-black text-white">بنرهای ثبت‌شده</h2><p className="mt-0.5 text-[9px] text-slate-500">{banners.length.toLocaleString('fa-IR')} بنر</p></div><button type="button" onClick={resetBanner} className="rounded-lg border border-amber-400/30 px-2.5 py-1.5 text-[10px] font-bold text-amber-200">+ بنر جدید</button></div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto pl-1">{banners.map((banner) => <article key={banner.id || banner.title} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/60 p-2"><div className="h-9 w-11 overflow-hidden rounded-lg bg-slate-800">{banner.image_url ? <img src={banner.image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="m-auto mt-2.5 h-4 w-4 text-slate-600" />}</div><div className="min-w-0"><b className="block truncate text-[11px] text-white">{banner.title}</b><span className={`text-[9px] ${banner.is_active ? 'text-emerald-300' : 'text-slate-500'}`}>{banner.is_active ? 'فعال' : 'پنهان'} · ترتیب {banner.sort_order.toLocaleString('fa-IR')}</span></div><div className="flex gap-1"><button type="button" onClick={() => { setBannerForm({ ...emptyBanner, ...banner }); setEditingBannerId(banner.id || null); }} className="rounded-md bg-sky-500/15 px-2 py-1 text-[9px] text-sky-200">ویرایش</button>{banner.id && <button type="button" onClick={() => removeBanner(banner.id!)} className="rounded-md bg-red-500/10 px-2 py-1 text-[9px] text-red-300">حذف</button>}</div></article>)}</div>
          </section>
        </aside>
      </div>}

      {activeTab === 'tiles' && <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.8fr)]" data-testid="admin-home-hero-promo-tiles-section">
        <section className={panelClass}><div className="mb-3"><h2 className="text-sm font-black text-white">{editingMegaMenuTileId ? 'ویرایش بنر کوچک' : 'بنر کوچک جدید'}</h2><p className="mt-1 text-[10px] text-slate-500">کارت‌های تصویری صفحه خانه؛ عنوان، عکس و مقصد هر کارت را جدا کنترل کن.</p></div><div className="grid gap-2.5 md:grid-cols-2" data-testid="admin-home-hero-promo-tile-form">
          <AdminField title="عنوان کارت" help="متن اصلی روی کارت تبلیغاتی."><input className={inputClass} value={megaMenuTileForm.title} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, title: e.target.value })} placeholder="مثلاً محصولات نظافت خودرو" /></AdminField>
          <AdminField title="نشان کوتاه" help="برچسب بالای کارت؛ مثل تمیزی یا اقتصادی."><input className={inputClass} value={megaMenuTileForm.badge || ''} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, badge: e.target.value })} placeholder="اختیاری" /></AdminField>
          <AdminField title="توضیح کوتاه" help="یک جمله کوتاه برای توضیح پیشنهاد."><input className={inputClass} value={megaMenuTileForm.subtitle || ''} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, subtitle: e.target.value })} /></AdminField>
          <AdminField title="لینک مقصد" help="صفحه‌ای که با لمس کارت باز می‌شود."><input dir="ltr" className={`${inputClass} text-left`} value={megaMenuTileForm.link_url} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, link_url: e.target.value })} placeholder="/shop?q=نظافت" /></AdminField>
          <div className="md:col-span-2"><ImageUploader compact label="تصویر بنر کوچک" folder="banners" value={megaMenuTileForm.image_url || ''} onChange={(image_url) => setMegaMenuTileForm({ ...megaMenuTileForm, image_url })} /></div>
          <AdminField title="ترتیب نمایش" help="عدد کمتر، جایگاه زودتر."><input className={inputClass} type="number" min="0" value={megaMenuTileForm.sort_order} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, sort_order: Number(e.target.value) })} /></AdminField>
          <AdminField title="وضعیت" help="بنر را بدون حذف‌کردن مخفی یا فعال کن."><ActiveToggle checked={megaMenuTileForm.is_active} onChange={(is_active) => setMegaMenuTileForm({ ...megaMenuTileForm, is_active })} /></AdminField>
          <div className="flex gap-2 md:col-span-2"><button type="button" onClick={saveMegaMenuTile} className="h-10 flex-1 rounded-xl bg-amber-400 text-sm font-black text-slate-950">{editingMegaMenuTileId ? 'ذخیره تغییرات' : 'افزودن بنر کوچک'}</button>{editingMegaMenuTileId && <button type="button" onClick={resetMegaMenuTile} className="rounded-xl border border-slate-600 px-5 text-xs text-white">لغو</button>}</div>
        </div></section>
        <section className={panelClass}><h2 className="mb-2 text-xs font-black text-white">بنرهای کوچک ثبت‌شده</h2><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{megaMenuTiles.map((tile) => <article key={tile.id || tile.title} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-2"><div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-800">{tile.image_url && <img src={tile.image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><b className="block truncate text-[11px] text-white">{tile.title}</b><small className="text-[9px] text-slate-500">ترتیب {tile.sort_order.toLocaleString('fa-IR')} · {tile.is_active ? 'فعال' : 'پنهان'}</small></div><button type="button" onClick={() => { setMegaMenuTileForm({ ...emptyMegaMenuTile, ...tile }); setEditingMegaMenuTileId(tile.id || null); }} className="text-[9px] text-sky-300">ویرایش</button>{tile.id && <button type="button" onClick={() => removeMegaMenuTile(tile.id!)} className="text-[9px] text-red-300">حذف</button>}</article>)}</div></section>
      </div>}

      {activeTab === 'mega' && <section className={`${panelClass} mx-auto max-w-5xl`} data-testid="admin-mega-menu-promotion-form"><div className="mb-3"><h2 className="text-sm font-black text-white">تبلیغ داخل منوی دسته‌بندی</h2><p className="mt-1 text-[10px] text-slate-500">کارت تبلیغاتی بزرگ داخل Mega Menu فروشگاه؛ مناسب بخش صنعتی یا یک پیشنهاد ویژه.</p></div><div className="grid gap-2.5 md:grid-cols-2">
        <AdminField title="عنوان تبلیغ" help="تیتر اصلی کارت داخل منوی دسته‌بندی."><input className={inputClass} value={megaPromotion.title} onChange={(e) => setMegaPromotion({ ...megaPromotion, title: e.target.value })} /></AdminField>
        <AdminField title="نشان تبلیغ" help="عبارت کوتاه بالای کارت؛ مثل فروش عمده."><input className={inputClass} value={megaPromotion.badge || ''} onChange={(e) => setMegaPromotion({ ...megaPromotion, badge: e.target.value })} /></AdminField>
        <AdminField title="توضیح کوتاه" help="شرح یک‌خطی زیر عنوان."><input className={inputClass} value={megaPromotion.subtitle || ''} onChange={(e) => setMegaPromotion({ ...megaPromotion, subtitle: e.target.value })} /></AdminField>
        <AdminField title="متن دکمه" help="عبارتی که روی دکمه فراخوان نمایش داده می‌شود."><input className={inputClass} value={megaPromotion.button_text} onChange={(e) => setMegaPromotion({ ...megaPromotion, button_text: e.target.value })} /></AdminField>
        <AdminField title="لینک مقصد" help="مقصد دکمه این تبلیغ؛ مثل /industrial." wide><input dir="ltr" className={`${inputClass} text-left`} value={megaPromotion.link_url} onChange={(e) => setMegaPromotion({ ...megaPromotion, link_url: e.target.value })} /></AdminField>
        <div className="md:col-span-2"><ImageUploader compact label="تصویر تبلیغ مگامنو" folder="banners" value={megaPromotion.image_url || ''} onChange={(image_url) => setMegaPromotion({ ...megaPromotion, image_url })} /></div>
        <AdminField title="وضعیت نمایش" help="با خاموش‌شدن، تبلیغ داخل منو پنهان می‌شود." wide><ActiveToggle checked={megaPromotion.is_active} onChange={(is_active) => setMegaPromotion({ ...megaPromotion, is_active })} /></AdminField>
        <button type="button" onClick={saveMegaPromotion} className="h-10 rounded-xl bg-amber-400 text-sm font-black text-slate-950 md:col-span-2">ذخیره تبلیغ مگامنو</button>
      </div></section>}

      {activeTab === 'sections' && <div className="grid gap-3 xl:grid-cols-2">
        <section className={panelClass}><div className="mb-3"><h2 className="text-sm font-black text-white">عنوان بخش پیشنهادهای صفحه خانه</h2><p className="mt-1 text-[10px] text-slate-500">عنوانی که بالای دسته‌های خرید سریع دیده می‌شود.</p></div><div className="grid gap-2.5 md:grid-cols-2"><AdminField title="عنوان اصلی" help="مثلاً امروز چی بخریم؟"><input className={inputClass} value={todayShopping.title} onChange={(e) => setTodayShopping({ ...todayShopping, title: e.target.value })} /></AdminField><AdminField title="زیرعنوان" help="توضیح کوتاه زیر عنوان؛ اختیاری."><input className={inputClass} value={todayShopping.subtitle || ''} onChange={(e) => setTodayShopping({ ...todayShopping, subtitle: e.target.value })} /></AdminField><button type="button" onClick={saveTodayShopping} className="h-10 rounded-xl bg-amber-400 text-xs font-black text-slate-950 md:col-span-2">ذخیره عنوان</button></div></section>
        <section className={panelClass}><div className="mb-3"><h2 className="text-sm font-black text-white">مدیریت آیکون‌ها و تصاویر</h2><p className="mt-1 text-[10px] leading-5 text-slate-500">هر آیکون کنار همان محتوایی مدیریت می‌شود که به آن تعلق دارد؛ همه آپلودها خودکار کم‌حجم می‌شوند.</p></div><div className="grid gap-2 sm:grid-cols-3"><a href="/admin/categories" className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-center hover:border-amber-400"><Grid2X2 className="mx-auto h-5 w-5 text-amber-300" /><b className="mt-2 block text-xs text-white">آیکون دسته‌بندی‌ها</b><small className="mt-1 block text-[9px] text-slate-500">کارت و مگامنو</small></a><a href="/admin/brands" className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-center hover:border-amber-400"><Sparkles className="mx-auto h-5 w-5 text-amber-300" /><b className="mt-2 block text-xs text-white">لوگو و بنر برندها</b><small className="mt-1 block text-[9px] text-slate-500">صفحه برند</small></a><a href="/admin/service-booking-settings" className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-center hover:border-amber-400"><AppWindow className="mx-auto h-5 w-5 text-amber-300" /><b className="mt-2 block text-xs text-white">آیکون خدمات</b><small className="mt-1 block text-[9px] text-slate-500">فرم رزرو</small></a></div></section>
        <section className={`${panelClass} xl:col-span-2`}><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-black text-white">{editingSectionId ? 'ویرایش سکشن داینامیک' : 'سکشن داینامیک جدید'}</h2><p className="mt-1 text-[10px] text-slate-500">ردیف‌های محصول صفحه اصلی را از دسته‌بندی، جدیدترین‌ها یا پرفروش‌ها بساز.</p></div>{editingSectionId && <button type="button" onClick={resetSection} className="text-[10px] text-slate-400">لغو</button>}</div><div className="grid gap-2.5 md:grid-cols-3">
          <AdminField title="عنوان سکشن" help="تیتر بالای ردیف محصولات."><input className={inputClass} value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value, slug: sectionForm.slug || makeSlug(e.target.value) })} /></AdminField>
          <AdminField title="شناسه فنی" help="شناسه یکتا برای لینک و ذخیره؛ انگلیسی بهتر است."><input dir="ltr" className={`${inputClass} text-left`} value={sectionForm.slug} onChange={(e) => setSectionForm({ ...sectionForm, slug: e.target.value })} /></AdminField>
          <AdminField title="منبع محصولات" help="مشخص می‌کند محصولات این ردیف از کجا انتخاب شوند."><select className={inputClass} value={sectionForm.source_type} onChange={(e) => setSectionForm({ ...sectionForm, source_type: e.target.value as HomeSectionSource })}><option value="category">یک دسته‌بندی</option><option value="featured">منتخب</option><option value="best_seller">پرفروش</option><option value="latest">جدیدترین</option></select></AdminField>
          <AdminField title="دسته محصول" help="فقط وقتی منبع روی دسته‌بندی است استفاده می‌شود."><select className={inputClass} disabled={sectionForm.source_type !== 'category'} value={sectionForm.category_slug || ''} onChange={(e) => setSectionForm({ ...sectionForm, category_slug: e.target.value })}><option value="">انتخاب دسته</option>{activeCategories.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}</select></AdminField>
          <AdminField title="زیرعنوان" help="توضیح کوتاه زیر تیتر سکشن."><input className={inputClass} value={sectionForm.subtitle || ''} onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })} /></AdminField>
          <AdminField title="برچسب" help="مثل محدود یا پیشنهاد ویژه."><input className={inputClass} value={sectionForm.badge || ''} onChange={(e) => setSectionForm({ ...sectionForm, badge: e.target.value })} /></AdminField>
          <AdminField title="ترتیب نمایش" help="عدد کمتر بالاتر دیده می‌شود."><input className={inputClass} type="number" min="0" value={sectionForm.sort_order} onChange={(e) => setSectionForm({ ...sectionForm, sort_order: Number(e.target.value) })} /></AdminField>
          <AdminField title="تایمر فروش" help="برای پیشنهادهای زمان‌دار فعال کن."><ActiveToggle label="تایمر فعال باشد" checked={sectionForm.show_timer === true} onChange={(show_timer) => setSectionForm({ ...sectionForm, show_timer, ends_at: show_timer ? sectionForm.ends_at : '' })} /></AdminField>
          <AdminField title="نمایش سکشن" help="بدون حذف، سکشن را از سایت پنهان کن."><ActiveToggle checked={sectionForm.is_active} onChange={(is_active) => setSectionForm({ ...sectionForm, is_active })} /></AdminField>
          {sectionForm.show_timer && <AdminField title="پایان تایمر" help="زمان پایان خودکار پیشنهاد."><input className={inputClass} type="datetime-local" value={sectionForm.ends_at || ''} onChange={(e) => setSectionForm({ ...sectionForm, ends_at: e.target.value })} /></AdminField>}
          <button type="button" onClick={saveSection} className="h-10 rounded-xl bg-amber-400 text-xs font-black text-slate-950 md:col-span-3">{editingSectionId ? 'ذخیره تغییرات سکشن' : 'افزودن سکشن'}</button>
        </div><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{sections.map((section) => <article key={section.id || section.slug} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-2.5"><div className="min-w-0 flex-1"><b className="block truncate text-[11px] text-white">{section.title}</b><small className="text-[9px] text-slate-500">{section.source_type} · ترتیب {section.sort_order.toLocaleString('fa-IR')}</small></div><button type="button" onClick={() => { setSectionForm({ ...emptySection, ...section }); setEditingSectionId(section.id || null); }} className="text-[9px] text-sky-300">ویرایش</button>{section.id && <button type="button" onClick={() => removeSection(section.id!)} className="text-[9px] text-red-300">حذف</button>}</article>)}</div></section>
      </div>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">صفحه اصلی فروشگاه</h1>
        <p className="mt-2 text-sm text-slate-400">
          بنرهای اسلایدی، پیشنهاد شگفت‌انگیز و بخش «امروز چی بخریم؟» را از اینجا مدیریت کن.
        </p>
      </div>

      <section className="rounded-2xl bg-slate-900 p-5">
        <div className="mb-4"><h2 className="text-lg font-black text-white">تبلیغ داخل منوی دسته‌بندی</h2><p className="mt-1 text-xs leading-6 text-slate-400">کارت تبلیغاتی سمت چپ Mega Menu فروشگاه را از اینجا تغییر بده.</p></div>
        <div className="grid gap-3 md:grid-cols-2" data-testid="admin-mega-menu-promotion-form">
          <input placeholder="عنوان تبلیغ" value={megaPromotion.title} onChange={(e) => setMegaPromotion({ ...megaPromotion, title: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="نشان؛ مثال: فروش عمده" value={megaPromotion.badge || ''} onChange={(e) => setMegaPromotion({ ...megaPromotion, badge: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="متن کوتاه تبلیغ" value={megaPromotion.subtitle || ''} onChange={(e) => setMegaPromotion({ ...megaPromotion, subtitle: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="متن دکمه" value={megaPromotion.button_text} onChange={(e) => setMegaPromotion({ ...megaPromotion, button_text: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="لینک مقصد" value={megaPromotion.link_url} onChange={(e) => setMegaPromotion({ ...megaPromotion, link_url: e.target.value })} className="rounded bg-slate-800 p-3 text-white md:col-span-2" />
          <div className="md:col-span-2"><ImageUploader label="تصویر تبلیغ منوی دسته‌بندی" folder="banners" value={megaPromotion.image_url || ''} onChange={(image_url) => setMegaPromotion({ ...megaPromotion, image_url })} /></div>
          <label className="flex items-center gap-2 rounded bg-slate-800 p-3 text-white md:col-span-2"><input type="checkbox" checked={megaPromotion.is_active} onChange={(e) => setMegaPromotion({ ...megaPromotion, is_active: e.target.checked })} /> تبلیغ داخل منو فعال باشد</label>
          <button type="button" onClick={saveMegaPromotion} className="rounded bg-yellow-400 p-3 font-bold text-slate-950 md:col-span-2">ذخیره تبلیغ Mega Menu</button>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 p-5" data-testid="admin-home-hero-promo-tiles-section">
        <div className="mb-4">
          <h2 className="text-lg font-black text-white">چهار بنر کنار بنر اصلی صفحه خانه</h2>
          <p className="mt-1 text-xs leading-6 text-slate-400">این بنرها جایگزین باکس‌های قدیمی ارسال سریع، ضمانت اصالت، بسته‌بندی امن و پشتیبانی شده‌اند. تصویر، متن، لینک، ترتیب و وضعیت هر بنر را مدیریت کن.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2" data-testid="admin-home-hero-promo-tile-form">
          <input placeholder="عنوان بنر کوچک" value={megaMenuTileForm.title} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, title: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="نشان؛ مثال: فروش ویژه" value={megaMenuTileForm.badge || ''} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, badge: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="توضیح کوتاه" value={megaMenuTileForm.subtitle || ''} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, subtitle: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="لینک مقصد؛ مثال: /shop?q=نظافت" value={megaMenuTileForm.link_url} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, link_url: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input type="number" placeholder="ترتیب نمایش" value={megaMenuTileForm.sort_order} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, sort_order: Number(e.target.value) })} className="rounded bg-slate-800 p-3 text-white" />
          <label className="flex items-center gap-2 rounded bg-slate-800 p-3 text-white"><input type="checkbox" checked={megaMenuTileForm.is_active} onChange={(e) => setMegaMenuTileForm({ ...megaMenuTileForm, is_active: e.target.checked })} /> فعال باشد</label>
          <div className="md:col-span-2"><ImageUploader label="تصویر بنر کوچک" folder="banners" value={megaMenuTileForm.image_url || ''} onChange={(image_url) => setMegaMenuTileForm({ ...megaMenuTileForm, image_url })} /></div>
          <div className="flex gap-2 md:col-span-2">
            <button type="button" onClick={saveMegaMenuTile} className="flex-1 rounded bg-yellow-400 p-3 font-bold text-slate-950">{editingMegaMenuTileId ? 'ذخیره تغییرات بنر کوچک' : 'افزودن بنر کوچک'}</button>
            {editingMegaMenuTileId && <button type="button" onClick={resetMegaMenuTile} className="rounded bg-slate-700 px-6 py-3 font-bold text-white">لغو</button>}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {megaMenuTiles.map((tile) => (
            <article key={tile.id || `${tile.title}-${tile.sort_order}`} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3 text-white">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-950">{tile.image_url ? <img src={tile.image_url} alt={tile.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-slate-500">بدون تصویر</div>}</div>
              <div className="min-w-0 flex-1"><b className="line-clamp-1">{tile.title}</b><p className="mt-1 truncate text-xs text-slate-400">{tile.link_url}</p><p className="mt-1 text-[10px] text-slate-500">ترتیب: {tile.sort_order} · {tile.is_active ? 'فعال' : 'غیرفعال'}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { setMegaMenuTileForm({ ...emptyMegaMenuTile, ...tile }); setEditingMegaMenuTileId(tile.id || null); }} className="rounded bg-blue-500 px-3 py-1.5 text-xs font-bold">ویرایش</button>{tile.id && <button type="button" onClick={() => removeMegaMenuTile(tile.id!)} className="rounded px-2 py-1.5 text-xs font-bold text-red-400">حذف</button>}</div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 p-5" data-testid="admin-home-slider-banners-section">
        <h2 className="mb-4 text-lg font-black text-white">بنرهای تبلیغاتی اسلایدی</h2>
        <div className="grid gap-3 md:grid-cols-2" data-testid="admin-home-slider-banner-form">
          <input placeholder="عنوان بنر" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="زیرعنوان" value={bannerForm.subtitle || ''} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <div className="md:col-span-2"><ImageUploader label="تصویر بنر اسلایدی" folder="banners" value={bannerForm.image_url || ''} onChange={(image_url) => setBannerForm({ ...bannerForm, image_url })} /></div>
          <input placeholder="لینک مقصد؛ مثال: /shop?category=engine-oil" value={bannerForm.link_url || ''} onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="برچسب کوچک؛ مثال: تا ۲۰٪ تخفیف" value={bannerForm.badge || ''} onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input type="number" placeholder="ترتیب نمایش" value={bannerForm.sort_order} onChange={(e) => setBannerForm({ ...bannerForm, sort_order: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <label className="flex items-center gap-2 rounded bg-slate-800 p-3 text-white md:col-span-2">
            <input type="checkbox" checked={bannerForm.is_active} onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })} />
            فعال باشد
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button onClick={saveBanner} className="flex-1 rounded bg-yellow-400 p-3 font-bold text-slate-950">{editingBannerId ? 'ذخیره تغییرات بنر' : 'افزودن بنر'}</button>
            {editingBannerId && <button onClick={resetBanner} className="rounded bg-slate-700 px-6 py-3 font-bold text-white">لغو</button>}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {banners.map((banner) => (
            <div key={banner.id || banner.title} className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <b>{banner.title}</b>
                <p className="text-sm text-slate-400">{banner.link_url || '-'} | ترتیب: {banner.sort_order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setBannerForm({ ...emptyBanner, ...banner }); setEditingBannerId(banner.id || null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white">ویرایش</button>
                {banner.id && <button onClick={() => deleteHomeBanner(banner.id!).then(loadData)} className="px-3 py-2 text-sm text-red-400">حذف</button>}
              </div>
            </div>
          ))}
        </div>
      </section>



      <section className="rounded-2xl bg-slate-900 p-5">
        <h2 className="mb-2 text-lg font-black text-white">تنظیم عنوان بخش «امروز چی بخریم؟»</h2>
        <p className="mb-4 text-sm text-slate-400">دسته‌های این قسمت از همین سکشن‌های داینامیک پایین ساخته می‌شوند. هر سکشن فعال و بدون تایمر به عنوان یک تب جدا نمایش داده می‌شود.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="عنوان اصلی؛ مثال: امروز چی بخریم؟"
            value={todayShopping.title}
            onChange={(e) => setTodayShopping({ ...todayShopping, title: e.target.value })}
            className="rounded bg-slate-800 p-3 text-white"
          />
          <input
            placeholder="زیرعنوان اختیاری"
            value={todayShopping.subtitle || ''}
            onChange={(e) => setTodayShopping({ ...todayShopping, subtitle: e.target.value })}
            className="rounded bg-slate-800 p-3 text-white"
          />
          <button onClick={saveTodayShopping} className="rounded bg-yellow-400 p-3 font-bold text-slate-950 md:col-span-2">ذخیره عنوان این بخش</button>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-black text-white">سکشن‌های داینامیک صفحه اصلی</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder="عنوان؛ مثال: مکمل و تقویتی" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value, slug: sectionForm.slug || makeSlug(e.target.value) })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="شناسه؛ مثال: supplements" value={sectionForm.slug} onChange={(e) => setSectionForm({ ...sectionForm, slug: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <select value={sectionForm.source_type} onChange={(e) => setSectionForm({ ...sectionForm, source_type: e.target.value as HomeSectionSource })} className="rounded bg-slate-800 p-3 text-white">
            <option value="category">از یک دسته‌بندی محصول</option>
            <option value="featured">محصولات منتخب</option>
            <option value="best_seller">پرفروش‌ها</option>
            <option value="latest">جدیدترین‌ها</option>
          </select>
          <select value={sectionForm.category_slug || ''} onChange={(e) => setSectionForm({ ...sectionForm, category_slug: e.target.value })} disabled={sectionForm.source_type !== 'category'} className="rounded bg-slate-800 p-3 text-white disabled:opacity-50">
            <option value="">انتخاب دسته محصول</option>
            {activeCategories.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}
          </select>
          <input placeholder="زیرعنوان" value={sectionForm.subtitle || ''} onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="برچسب؛ مثال: محدود" value={sectionForm.badge || ''} onChange={(e) => setSectionForm({ ...sectionForm, badge: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <label className="space-y-1">
            <span className="block text-xs text-slate-400">زمان پایان تایمر سکشن؛ فقط وقتی تایمر فعال است پر شود</span>
            <input
              type="datetime-local"
              value={sectionForm.ends_at || ''}
              disabled={sectionForm.show_timer !== true}
              onChange={(e) => setSectionForm({ ...sectionForm, ends_at: e.target.value })}
              className="w-full rounded bg-slate-800 p-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
            />
          </label>
          <input type="number" placeholder="ترتیب نمایش" value={sectionForm.sort_order} onChange={(e) => setSectionForm({ ...sectionForm, sort_order: +e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <label className="flex items-center gap-2 rounded bg-slate-800 p-3 text-white">
            <input type="checkbox" checked={sectionForm.show_timer === true} onChange={(e) => setSectionForm({ ...sectionForm, show_timer: e.target.checked, ends_at: e.target.checked ? sectionForm.ends_at : '' })} />
            تایمر داشته باشد
          </label>
          <label className="flex items-center gap-2 rounded bg-slate-800 p-3 text-white">
            <input type="checkbox" checked={sectionForm.is_active} onChange={(e) => setSectionForm({ ...sectionForm, is_active: e.target.checked })} />
            فعال باشد
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button onClick={saveSection} className="flex-1 rounded bg-yellow-400 p-3 font-bold text-slate-950">{editingSectionId ? 'ذخیره تغییرات سکشن' : 'افزودن سکشن'}</button>
            {editingSectionId && <button onClick={resetSection} className="rounded bg-slate-700 px-6 py-3 font-bold text-white">لغو</button>}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {sections.map((section) => (
            <div key={section.id || section.slug} className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <b>{section.title}</b>
                <p className="text-sm text-slate-400">{section.source_type} {section.category_slug ? `| ${section.category_slug}` : ''} | ترتیب: {section.sort_order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSectionForm({ ...emptySection, ...section }); setEditingSectionId(section.id || null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white">ویرایش</button>
                {section.id && <button onClick={() => deleteHomeSection(section.id!).then(loadData)} className="px-3 py-2 text-sm text-red-400">حذف</button>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomeContent;
