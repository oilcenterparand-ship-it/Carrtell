import { brandConfig } from '../config/brand';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              
              <img
                src={brandConfig.logo}
                alt={brandConfig.name}
                className="w-14 h-14 object-contain"
              />

              <div>
                <div className="text-2xl font-black">
                  {brandConfig.name}
                </div>

                <div className="text-xs text-white/40">
                  {brandConfig.persianName}
                </div>
              </div>

            </Link>

            <p className="text-white/50 text-sm leading-7">
              {brandConfig.name} پلتفرم هوشمند فروش محصولات خودرو و رزرو سرویس در محل است.
            </p>
          </div>


          <div>
            <h3 className="font-bold mb-4">
              دسترسی سریع
            </h3>

            <ul className="space-y-3">
              {[
                { to: '/shop', label: 'فروشگاه' },
                { to: '/book', label: 'رزرو سرویس' },
                { to: '/dashboard', label: 'پنل کاربری' },
                { to: '/investor', label: 'سرمایه‌گذاری' },
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
            <h3 className="font-bold mb-4">
              خدمات
            </h3>

            <ul className="space-y-3">

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
            <h3 className="font-bold mb-4">
              تماس با ما
            </h3>


            <ul className="space-y-4">

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


            <div className="flex items-center gap-3 mt-6">

              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-gold-500/20 hover:text-gold-500 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>


              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-green-500/20 hover:text-green-400 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>

            </div>

          </div>

        </div>


        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">

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