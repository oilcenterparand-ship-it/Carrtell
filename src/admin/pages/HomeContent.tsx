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
  updateTodayShoppingSettings,
  type HomeBanner,
  type HomeSection,
  type HomeSectionSource,
  type TodayShoppingSettings,
} from '../services/homeContentApi';
import { getProductCategories, type ProductCategory } from '../services/categoriesApi';

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

  const activeCategories = useMemo(() => categories.filter((category) => category.is_active !== false), [categories]);

  async function loadData() {
    const [bannerData, sectionData, categoryData, todayShoppingData] = await Promise.all([getHomeBanners(), getHomeSections(), getProductCategories(), getTodayShoppingSettings()]);
    setBanners(bannerData);
    setSections(sectionData);
    setCategories(categoryData);
    setTodayShopping({ ...emptyTodayShopping, ...todayShoppingData });
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
        <h2 className="mb-4 text-lg font-black text-white">بنرهای تبلیغاتی اسلایدی</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input placeholder="عنوان بنر" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="زیرعنوان" value={bannerForm.subtitle || ''} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
          <input placeholder="آدرس عکس بنر" value={bannerForm.image_url || ''} onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })} className="rounded bg-slate-800 p-3 text-white" />
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
