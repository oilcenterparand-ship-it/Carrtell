import { useEffect, useState } from 'react';
import BlogCard from '../components/blog/BlogCard';
import { getPublishedBlogPosts, type BlogPost } from '../admin/services/blogApi';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getPublishedBlogPosts().then(setPosts);
  }, []);

  const filtered = posts.filter((p) => `${p.title} ${p.excerpt} ${(p.tags || []).join(' ')}`.includes(query));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8" dir="rtl">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 p-6 md:p-10">
          <p className="mb-3 text-sm font-bold text-amber-300">مجله آموزشی Carrtell</p>
          <h1 className="text-3xl font-black md:text-5xl">راهنمای تخصصی نگهداری خودرو</h1>
          <p className="mt-4 max-w-2xl leading-8 text-slate-300">
            آموزش‌های کاربردی درباره روغن موتور، فیلترها، ضدیخ، واسکازین و سرویس دوره‌ای خودرو.
          </p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در مقالات..."
            className="mt-6 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => <BlogCard key={post.id} post={post} />)}
        </div>
      </section>
    </main>
  );
}
