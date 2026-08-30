import { useEffect, useMemo, useState } from 'react';
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
