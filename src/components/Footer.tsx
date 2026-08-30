import { brandConfig } from '../config/brand';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Instagram, MessageCircle, Star, Quote } from 'lucide-react';
import { getApprovedCustomerReviews, type CustomerReview } from '../admin/services/customerReviewsApi';

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
    <footer className="bg-neutral-950 text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div>
            <Link to="/" className="flex items-center gap-3 mb-2">
              
              <img
                src={brandConfig.logo}
                alt={brandConfig.name}
                className="w-9 h-9 object-contain"
              />

              <div>
                <div className="text-xl font-black">
                  {brandConfig.name}
                </div>

                <div className="text-xs text-white/40">
                  {brandConfig.persianName}
                </div>
              </div>

            </Link>

            <p className="text-white/50 text-sm leading-6">
              {brandConfig.name} پلتفرم هوشمند فروش محصولات خودرو و رزرو سرویس در محل است.
            </p>
          </div>


          <div>
            <h3 className="font-bold mb-2">
              دسترسی سریع
            </h3>

            <ul className="space-y-2">
              {[
                { to: '/shop', label: 'فروشگاه' },
                { to: '/book', label: 'رزرو سرویس' },
                { to: '/dashboard', label: 'پنل کاربری' },
                { to: '/investor', label: 'سرمایه‌گذاری' },
                { to: '/download', label: 'دانلود اپ Carrtell' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-white/50 text-sm hover:text-gold-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          <div>
            <h3 className="font-bold mb-2">
              خدمات
            </h3>

            <ul className="space-y-2">

              {[
                'روغن موتور',
                'فیلتر روغن',
                'فیلتر هوا',
                'ضدیخ',
                'روغن گیربکس'

              ].map((service) => (

                <li key={service}>
                  <span className="text-white/50 text-sm hover:text-gold-500 transition-colors cursor-pointer">
                    {service}
                  </span>
                </li>

              ))}

            </ul>
          </div>


          <div>
            <h3 className="font-bold mb-2">
              تماس با ما
            </h3>


            <ul className="space-y-3">

              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                <span className="text-white/50 text-sm">
                  تهران، ایران
                </span>
              </li>


              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-500 shrink-0" />

                <a
                  href={`tel:${brandConfig.phone}`}
                  className="text-white/50 text-sm hover:text-gold-500"
                >
                  {brandConfig.phone}
                </a>
              </li>


              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-500 shrink-0" />

                <a
                  href={`mailto:${brandConfig.email}`}
                  className="text-white/50 text-sm hover:text-gold-500"
                >
                  {brandConfig.email}
                </a>

              </li>

            </ul>


            <div className="flex items-center gap-3 mt-4">

              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-gold-500/20 hover:text-gold-500 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>


              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-green-500/20 hover:text-green-400 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>

            </div>

          </div>

        </div>


        {activeReview && (
          <section className="ct-footer-review mt-6 border-t border-white/10 pt-5" aria-label="نظر مشتریان Carrtell">
            <div key={activeReview.id} className="mx-auto grid max-w-3xl grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-amber-400/20 bg-gradient-to-l from-white/[.07] to-white/[.025] px-4 py-3 shadow-lg backdrop-blur">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-400"><Quote className="h-5 w-5" /></div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <b className="text-xs text-white">{activeReview.customer_name || 'مشتری Carrtell'}</b>
                  <span className="flex items-center gap-0.5 text-amber-400">{Array.from({ length: Math.max(1, Number(activeReview.rating || 5)) }).map((_, index) => <Star key={index} className="h-3 w-3 fill-current" />)}</span>
                </div>
                <p className="line-clamp-2 text-[11px] leading-5 text-white/65">{activeReview.comment}</p>
                <span className="mt-1.5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">استفاده‌شده: {activeReview.experience_label}</span>
              </div>
            </div>
          </section>
        )}

        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-white/30 text-sm">
            ۱۴۰۴ {brandConfig.name}. تمامی حقوق محفوظ است.
          </p>


          <div className="flex items-center gap-6 text-white/30 text-sm">
            <span className="hover:text-white/50 cursor-pointer">
              قوانین و مقررات
            </span>

            <span className="hover:text-white/50 cursor-pointer">
              حریم خصوصی
            </span>
          </div>

        </div>

      </div>
    </footer>
  );
}
