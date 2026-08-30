import { BookOpen, X } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const guides: Record<string, Array<[string,string]>> = {
  '/admin/products': [['نام محصول','عنوان کامل قابل نمایش در فروشگاه و فاکتور.'],['قیمت و قیمت ویژه','قیمت عادی و مبلغ موقت فروش ویژه.'],['موجودی','تعداد قابل فروش؛ با رسیدن به صفر محصول ناموجود می‌شود.'],['دسته و برند','محل نمایش محصول و فیلترهای فروشگاه.'],['سازگاری خودرو','خودروهایی که محصول برایشان پیشنهاد داده می‌شود.'],['تصویر','عکس اصلی محصول؛ پیش از آپلود بهینه می‌شود.']],
  '/admin/categories': [['عنوان و شناسه','نام نمایشی و آدرس فنی یکتای دسته.'],['دسته مادر','جایگاه دسته در منوی آبشاری.'],['لینک مقصد','مسیر سفارشی مثل /industrial؛ خالی یعنی صفحه خود دسته.'],['تصویر کارت','تصویر مربع دسته در خانه و منو.'],['ترتیب','عدد کمتر زودتر نمایش داده می‌شود.']],
  '/admin/home-content': [['بنر اسلایدی','تصویر بزرگ فروشگاه با عنوان، لینک و ترتیب.'],['بنرهای کوچک','چهار کارت کنار بنر اصلی خانه.'],['تبلیغ Mega Menu','کارت تبلیغ داخل منوی دسته‌بندی.'],['سکشن داینامیک','ردیف محصول بر اساس دسته، جدیدترین یا پرفروش.']],
  '/admin/discounts': [['نوع و مقدار تخفیف','درصد یا مبلغ ثابت قابل کسر.'],['شروع و پایان شمسی','بازه فعال‌شدن خودکار کمپین.'],['بنر و لینک','تصویر کمپین و مقصد کلیک مشتری.'],['قیمت ویژه محصول','قیمت اختصاصی یک محصول در همان کمپین.']],
  '/admin/service-booking-settings': [['خدمت','عنوان، توضیح، آیکون، اجرت و مدت انجام.'],['بازه زمانی','ساعت شروع و پایان و حداکثر ظرفیت رزرو.'],['کرایه','مبدأ، مبلغ پایه، کیلومتری، شعاع و طرح ترافیک.']],
  '/admin/orders': [['دسته خودکار','تفکیک پرداخت‌شده، پرداخت‌نشده، فعال و تکمیل‌شده.'],['اقلام','کم/زیاد/حذف یا افزودن محصول و محاسبه مجدد.'],['برگشت وجه','کاهش مبلغ سفارش پرداخت‌شده به کیف پول مشتری برمی‌گردد.'],['سرویس‌کار','فقط سرویس‌کار فعال را به سفارش تخصیص می‌دهد.']],
  '/admin/loyalty': [['امتیاز','امتیاز وفاداری برای سطح باشگاه.'],['اعتبار کیف پول','مبلغ تومانی قابل استفاده در پرداخت.'],['تراکنش','ردیابی هر افزایش یا کاهش با دلیل و سفارش مرتبط.']],
  '/admin/technicians': [['نام کاربری','شناسه ورود مستقل سرویس‌کار.'],['رمز','رمز ورود پنل سرویس‌کار.'],['محدوده','ناحیه کاری پیشنهادی برای تخصیص مأموریت.'],['فعال','فقط افراد فعال مأموریت می‌گیرند.']],
};

export default function AdminPageGuide() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const guide = guides[pathname] || [];
  if (!guide.length) return null;
  return <><button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400 px-4 py-3 text-xs font-black text-slate-950 shadow-xl"><BookOpen className="h-4 w-4" /> راهنمای این صفحه</button>{open ? <div className="fixed inset-0 z-[80] bg-black/60 p-4" onClick={() => setOpen(false)}><aside className="mr-auto h-full w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">راهنمای فیلدهای این صفحه</h2><p className="mt-1 text-xs text-slate-400">قبل از ذخیره، کاربرد هر بخش را اینجا ببین.</p></div><button onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-2"><X /></button></div><div className="space-y-3">{guide.map(([title,description]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><b className="text-amber-300">{title}</b><p className="mt-2 text-sm leading-7 text-slate-300">{description}</p></div>)}</div></aside></div> : null}</>;
}
