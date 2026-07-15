import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBlogPostBySlug, type BlogPost } from '../admin/services/blogApi';

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    getBlogPostBySlug(slug).then(setPost);
  }, [slug]);

  if (post === undefined) return <div className="min-h-screen bg-slate-950 p-10 text-white" dir="rtl">در حال بارگذاری...</div>;
  if (!post) return <div className="min-h-screen bg-slate-950 p-10 text-white" dir="rtl">مقاله پیدا نشد.</div>;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8" dir="rtl">
      <article className="mx-auto max-w-4xl">
        <Link to="/blog" className="text-sm text-amber-300">← بازگشت به مجله</Link>
        <h1 className="mt-6 text-3xl font-black leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-4 leading-8 text-slate-300">{post.excerpt}</p>
        {post.cover_image_url && <img src={post.cover_image_url} alt={post.title} className="mt-8 rounded-3xl" />}
        <div className="prose prose-invert prose-lg mt-8 max-w-none leading-9 text-slate-100 whitespace-pre-line">
          {post.content}
        </div>
      </article>
    </main>
  );
}
