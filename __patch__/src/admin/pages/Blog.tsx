import { useEffect, useState } from 'react';
import { deleteBlogPost, getAdminBlogPosts, saveBlogPost, makeSlug, type BlogPost } from '../services/blogApi';

const emptyPost: Partial<BlogPost> = {
  title: '', slug: '', excerpt: '', content: '', status: 'draft', is_featured: false, tags: [],
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<Partial<BlogPost>>(emptyPost);
  const [loading, setLoading] = useState(false);

  const reload = () => getAdminBlogPosts().then(setPosts);
  useEffect(() => { reload(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveBlogPost({ ...form, slug: form.slug || makeSlug(form.title || '') });
      setForm(emptyPost);
      await reload();
    } finally { setLoading(false); }
  }

  return (
    <main className="space-y-6 p-4 text-white md:p-6" dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <h1 className="text-2xl font-black">مدیریت مقالات و محتوای آموزشی</h1>
        <p className="mt-2 text-sm text-slate-300">مقالات آموزشی سایت، مجله Carrtell و محتوای سئو را از اینجا مدیریت کن.</p>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2">
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="عنوان مقاله" value={form.title || ''} onChange={(e)=>setForm({...form,title:e.target.value, slug: form.slug || makeSlug(e.target.value)})} />
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="slug" value={form.slug || ''} onChange={(e)=>setForm({...form,slug:e.target.value})} />
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 md:col-span-2" placeholder="خلاصه" value={form.excerpt || ''} onChange={(e)=>setForm({...form,excerpt:e.target.value})} />
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 md:col-span-2" placeholder="آدرس تصویر کاور" value={form.cover_image_url || ''} onChange={(e)=>setForm({...form,cover_image_url:e.target.value})} />
        <textarea className="min-h-44 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 md:col-span-2" placeholder="متن کامل مقاله" value={form.content || ''} onChange={(e)=>setForm({...form,content:e.target.value})} />
        <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={form.status || 'draft'} onChange={(e)=>setForm({...form,status:e.target.value as any})}>
          <option value="draft">پیش‌نویس</option>
          <option value="published">منتشر شده</option>
        </select>
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
          <input type="checkbox" checked={!!form.is_featured} onChange={(e)=>setForm({...form,is_featured:e.target.checked})} /> مقاله ویژه
        </label>
        <button disabled={loading} className="rounded-2xl bg-amber-400 px-6 py-3 font-black text-slate-950 md:col-span-2">{form.id ? 'ذخیره تغییرات' : 'افزودن مقاله'}</button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
        <table className="w-full text-right text-sm">
          <thead className="bg-white/5 text-slate-300"><tr><th className="p-4">عنوان</th><th>وضعیت</th><th>ویژه</th><th>عملیات</th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="p-4 font-bold">{p.title}</td>
                <td>{p.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</td>
                <td>{p.is_featured ? 'بله' : 'خیر'}</td>
                <td className="space-x-2 space-x-reverse">
                  <button onClick={()=>setForm(p)} className="rounded-xl bg-white/10 px-3 py-2">ویرایش</button>
                  <button onClick={async()=>{ if(confirm('حذف شود؟')) { await deleteBlogPost(p.id); reload(); } }} className="rounded-xl bg-red-500/20 px-3 py-2 text-red-200">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
