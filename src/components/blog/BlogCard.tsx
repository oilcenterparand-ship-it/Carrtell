import { Link } from 'react-router-dom';
import type { BlogPost } from '../../admin/services/blogApi';

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-amber-400/40"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-slate-800 to-slate-950">
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🛢️</div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="text-xs text-amber-300">{post.category?.title || 'آموزش کارتل'}</div>
        <h3 className="line-clamp-2 text-lg font-black text-white group-hover:text-amber-200">{post.title}</h3>
        <p className="line-clamp-2 text-sm leading-7 text-slate-300">{post.excerpt}</p>
      </div>
    </Link>
  );
}
