import { useEffect } from 'react';
import type { SeoMeta } from '../../admin/services/seoApi';

function setMeta(name: string, content?: string | null, property = false) {
  if (!content) return;
  const attr = property ? 'property' : 'name';
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(url?: string | null) {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function SEOHead({ meta }: { meta?: Partial<SeoMeta> | null }) {
  useEffect(() => {
    if (!meta) return;
    if (meta.title) document.title = meta.title;
    setMeta('description', meta.description);
    setMeta('keywords', meta.keywords);
    setMeta('og:title', meta.og_title || meta.title, true);
    setMeta('og:description', meta.og_description || meta.description, true);
    setMeta('og:image', meta.og_image, true);
    setCanonical(meta.canonical_url);
  }, [meta]);

  return null;
}
