import { brandConfig } from '../config/brand';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Instagram, MessageCircle, Star, Quote, ShieldCheck } from 'lucide-react';
import { getApprovedCustomerReviews, type CustomerReview } from '../admin/services/customerReviewsApi';

const quickLinks = [
  { to: '/shop', label: 'فروشگاه' },
  { to: '/book', label: 'رزرو سرویس' },
  { to: '/dashboard', label: 'پنل کاربری' },
  { to: '/investor', label: 'سرمایه‌گذاری' },
  { to: '/download', label: 'دانلود اپ' },
];

const services = ['روغن موتور', 'فیلتر روغن', 'فیلتر هوا', 'ضدیخ', 'روغن گیربکس'];

export default function Footer() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    let active = true;
    getApprovedCustomerReviews(12).then((rows) => {
      if (!active) return;
      const shuffled = [...rows].sort(() => Math.random() - 0.5);
      setReviews(shuffled);
      setReviewIndex(0);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return;
    const timer = window.setInterval(() => setReviewIndex((current) => (current + 1) % reviews.length), 6500);
    return () => window.clearInterval(timer);
  }, [reviews.length]);

  const activeReview = reviews[reviewIndex];

  return (
    <footer className="ct-site-footer border-t border-white/10 bg-neutral-950 text-white">
      <div className="ct-site-footer-inner mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ct-footer-brand-row">
          <Link to="/" className="ct-footer-brand" aria-label="صفحه اصلی Carrtell">
            <img src={brandConfig.logo} alt={brandConfig.name} />
            <span><b>{brandConfig.name}</b><small>{brandConfig.persianName}</small></span>
          </Link>
          <p>{brandConfig.name}؛ فروش محصولات خودرو و رزرو سرویس در محل.</p>
          <div className="ct-footer-trust-placeholder" data-testid="enamad-slot" title="محل نمایش نماد اعتماد الکترونیکی پس از اتصال کد رسمی">
            <ShieldCheck />
            <span><b>خرید مطمئن</b><small>محل نماد اعتماد</small></span>
          </div>
        </div>

        <div className="ct-footer-mobile-columns">
          <section>
            <h3>دسترسی سریع</h3>
            <ul>{quickLinks.map((link) => <li key={link.to}><Link to={link.to}>{link.label}</Link></li>)}</ul>
          </section>
          <section>
            <h3>خدمات</h3>
            <ul>{services.map((service) => <li key={service}><span>{service}</span></li>)}</ul>
          </section>
        </div>

        <div className="ct-footer-contact-row">
          <div><MapPin /><span>تهران، ایران</span></div>
          <a href={`tel:${brandConfig.phone}`}><Phone /><span>{brandConfig.phone}</span></a>
          <a href={`mailto:${brandConfig.email}`}><Mail /><span>{brandConfig.email}</span></a>
          <div className="ct-footer-socials">
            <a href="#" aria-label="اینستاگرام"><Instagram /></a>
            <a href="#" aria-label="واتساپ"><MessageCircle /></a>
          </div>
        </div>

        {activeReview && (
          <section className="ct-footer-review ct-footer-review-compact" aria-label="نظر مشتریان Carrtell">
            <div key={activeReview.id}>
              <Quote />
              <div>
                <div><b>{activeReview.customer_name || 'مشتری Carrtell'}</b><span>{Array.from({ length: Math.max(1, Number(activeReview.rating || 5)) }).map((_, index) => <Star key={index} />)}</span></div>
                <p>{activeReview.comment}</p>
              </div>
            </div>
          </section>
        )}

        <div className="ct-footer-bottom">
          <p>۱۴۰۴ {brandConfig.name}. تمامی حقوق محفوظ است.</p>
          <div><span>قوانین و مقررات</span><span>حریم خصوصی</span></div>
        </div>
      </div>
    </footer>
  );
}
