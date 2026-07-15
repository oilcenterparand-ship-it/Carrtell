import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoConfig = {
  title: string;
  description: string;
  noIndex?: boolean;
};

const DEFAULT_SEO: SeoConfig = {
  title: 'Carrtell | فروشگاه و خدمات تخصصی خودرو',
  description: 'خرید روغن موتور، فیلتر و محصولات مراقبت خودرو همراه با رزرو سرویس در محل و پرونده سلامت خودرو در Carrtell.',
};

function resolveSeo(pathname: string): SeoConfig {
  if (pathname === '/' || pathname === '/shop') return DEFAULT_SEO;
  if (pathname === '/home') return {
    title: 'Carrtell | خدمات جامع خودرو',
    description: 'فروشگاه تخصصی خودرو، سرویس در محل، باشگاه مشتریان و پرونده سلامت خودرو در Carrtell.',
  };
  if (pathname.startsWith('/shop/product/')) return {
    title: 'جزئیات محصول | Carrtell',
    description: 'مشخصات، قیمت، سازگاری با خودرو و خرید آنلاین محصول از فروشگاه Carrtell.',
  };
  if (pathname.startsWith('/shop/special-offers')) return {
    title: 'پیشنهادهای ویژه | Carrtell',
    description: 'پیشنهادهای ویژه و تخفیف‌های محصولات خودرو در فروشگاه Carrtell.',
  };
  if (pathname.startsWith('/shop/packages')) return {
    title: 'پکیج‌های خودرو | Carrtell',
    description: 'پکیج‌های آماده سرویس و نگهداری خودرو متناسب با مدل خودروی شما.',
  };
  if (pathname === '/book') return {
    title: 'رزرو سرویس در محل | Carrtell',
    description: 'رزرو آنلاین سرویس خودرو در محل، انتخاب زمان، آدرس و خدمات موردنیاز.',
  };
  if (pathname === '/blog') return {
    title: 'مجله خودرو | Carrtell',
    description: 'راهنمای نگهداری خودرو، انتخاب روغن موتور و نکات فنی در مجله Carrtell.',
  };
  if (pathname.startsWith('/blog/')) return {
    title: 'مقاله تخصصی خودرو | Carrtell',
    description: 'مطالب آموزشی و تخصصی نگهداری خودرو در مجله Carrtell.',
  };
  if (pathname === '/authenticity') return {
    title: 'استعلام اصالت کالا | Carrtell',
    description: 'بررسی و استعلام اصالت محصولات خریداری‌شده از Carrtell.',
  };
  if (pathname === '/investor') return {
    title: 'همکاری و سرمایه‌گذاری | Carrtell',
    description: 'اطلاعات همکاری و سرمایه‌گذاری در پلتفرم خدمات خودروی Carrtell.',
  };
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/driver') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/invoice') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/login')
  ) {
    return { ...DEFAULT_SEO, noIndex: true };
  }
  return DEFAULT_SEO;
}

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(property ? 'property' : 'name', name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = resolveSeo(pathname);
    const configuredBase = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');
    const baseUrl = configuredBase || window.location.origin;
    const canonicalUrl = `${baseUrl}${pathname === '/' ? '' : pathname}`;

    document.title = seo.title;
    setMeta('description', seo.description);
    setMeta('robots', seo.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('theme-color', '#ffffff');
    setMeta('og:locale', 'fa_IR', true);
    setMeta('og:type', 'website', true);
    setMeta('og:site_name', 'Carrtell', true);
    setMeta('og:title', seo.title, true);
    setMeta('og:description', seo.description, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', seo.title);
    setMeta('twitter:description', seo.description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [pathname]);

  return null;
}
