import { Link } from 'react-router-dom';
import {
  Droplets, Shield, Clock, MapPin, Star, ChevronDown, ChevronUp,
  Truck, Award, ThumbsUp, Users, TrendingUp, Zap, CheckCircle2,
  ArrowLeft, Wrench, Timer, Navigation, Sparkles, Phone
} from 'lucide-react';
import { useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { reviews, faqs } from '../data/products';

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/80 to-navy-950" />
        <img
          src="https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Oil change service"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-2 text-sm text-gold-500 font-medium">
              <Sparkles className="w-4 h-4" />
              اولین سرویس تعویض روغن سیار ایران
            </div>

            <h1 className="section-title !text-4xl md:!text-5xl lg:!text-6xl">
              تعویض روغن
              <br />
              <span className="gold-gradient-text">در محل شما</span>
            </h1>

            <p className="text-xl text-white/60 leading-8 max-w-xl">
              خودروی خود را انتخاب کنید، روغن و فیلتر مورد نظر را برگزینید و ما به محل شما می‌آییم. ساده، سریع و حرفه‌ای.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/book" className="btn-primary flex items-center gap-2 text-lg">
                رزرو تعویض روغن
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link to="/shop" className="btn-secondary text-lg">
                مشاهده فروشگاه
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 space-x-reverse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-navy-700 border-2 border-navy-950 flex items-center justify-center text-xs font-bold">
                      {['م', 'ز', 'ع', 'ح'][i - 1]}
                    </div>
                  ))}
                </div>
                <span className="text-white/50 text-sm">+۲۰۰۰ مشتری راضی</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
                ))}
                <span className="text-white/50 text-sm mr-1">۴.۸/۵</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10">
                <img
                  src="https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Mobile oil change service"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-4 -right-4 glass-card !p-4 flex items-center gap-3 animate-float">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">زمان سرویس</div>
                  <div className="text-xs text-white/50">کمتر از ۳۰ دقیقه</div>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 glass-card !p-4 flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">گارانتی</div>
                  <div className="text-xs text-white/50">۳ ماهه خدمات</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent" />
    </section>
  );
}

function ProcessSection() {
  const steps = [
    { icon: Wrench, title: 'انتخاب خودرو', desc: 'مدل و سال خودروی خود را انتخاب کنید' },
    { icon: Droplets, title: 'انتخاب روغن', desc: 'روغن و فیلتر مناسب خودرو را برگزینید' },
    { icon: Clock, title: 'زمان و مکان', desc: 'تاریخ، ساعت و آدرس محل را مشخص کنید' },
    { icon: Truck, title: 'سرویس در محل', desc: 'تیم ما به محل شما می‌آید و سرویس انجام می‌شود' },
  ];

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="section-title mb-4">
            چگونه <span className="gold-gradient-text">کار می‌کند</span>؟
          </h2>
          <p className="section-subtitle mx-auto">
            در فقط ۴ مرحله ساده، تعویض روغن خودروی خود را در محل انجام دهید
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-px bg-gradient-to-l from-gold-500/20 via-gold-500/40 to-gold-500/20" />
          {steps.map((step, i) => (
            <AnimatedSection key={i} delay={i * 150}>
              <div className="glass-card text-center relative group">
                <div className="w-16 h-16 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-gold-500/20 transition-colors">
                  <step.icon className="w-8 h-8 text-gold-500" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-navy-950 font-bold text-sm">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-6">{step.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    { icon: Clock, title: 'صرفه‌جویی در زمان', desc: 'نیازی به ترافیک و انتظار در تعمیرگاه نیست' },
    { icon: Shield, title: 'روغن اصل و با کیفیت', desc: 'تمام محصولات دارای هولوگرام اصالت هستند' },
    { icon: Award, title: 'گارانتی خدمات', desc: '۳ ماه گارانتی روی تمام خدمات ارائه شده' },
    { icon: ThumbsUp, title: 'قیمت شفاف', desc: 'قیمت‌ها مشخص و بدون هزینه پنهان' },
    { icon: Navigation, title: 'سرویس در محل', desc: 'ما به محل شما می‌آییم، خانه یا محل کار' },
    { icon: Timer, title: 'یادآوری خودکار', desc: 'پیامک یادآوری برای سرویس بعدی' },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/30 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="section-title mb-4">
            چرا <span className="gold-gradient-text">آویزسرویس</span>؟
          </h2>
          <p className="section-subtitle mx-auto">
            مزایایی که ما را از تعمیرگاه‌های سنتی متمایز می‌کند
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <AnimatedSection key={i} delay={i * 100}>
              <div className="glass-card group flex gap-4">
                <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-gold-500/20 transition-colors">
                  <b.icon className="w-6 h-6 text-gold-500" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{b.title}</h3>
                  <p className="text-white/50 text-sm leading-6">{b.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="section-title mb-4">
            نظرات <span className="gold-gradient-text">مشتریان</span>
          </h2>
          <p className="section-subtitle mx-auto">
            بیش از ۲۰۰۰ مشتری به ما اعتماد کرده‌اند
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <AnimatedSection key={review.id} delay={i * 100}>
              <div className="glass-card h-full flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < review.rating ? 'fill-gold-500 text-gold-500' : 'text-white/20'}`}
                    />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-7 flex-1 mb-4">{review.comment}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <div className="font-bold text-sm">{review.name}</div>
                    <div className="text-white/40 text-xs">{review.vehicle}</div>
                  </div>
                  <div className="text-white/30 text-xs">{review.date}</div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoverageSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <h2 className="section-title mb-4">
              ناحیه تحت <span className="gold-gradient-text">پوشش</span>
            </h2>
            <p className="section-subtitle mb-8">
              در حال حاضر در پردیس و شهرک ولیعصر فعال هستیم و به‌زودی تمام تهران و سپس سراسر ایران را پوشش می‌دهیم.
            </p>
            <div className="space-y-4">
              {[
                { area: 'پردیس', status: 'فعال', color: 'green' },
                { area: 'شهرک ولیعصر', status: 'فعال', color: 'green' },
                { area: 'شهرک هاشمی', status: 'به‌زودی', color: 'gold' },
                { area: 'شمشک', status: 'به‌زودی', color: 'gold' },
                { area: 'تمام تهران', status: '۱۴۰۵', color: 'white/30' },
                { area: 'سراسر ایران', status: '۱۴۰۶', color: 'white/30' },
              ].map((item) => (
                <div key={item.area} className="flex items-center justify-between glass-card !p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-5 h-5 text-${item.color === 'green' ? 'green-400' : item.color === 'gold' ? 'gold-500' : 'white/30'}`} />
                    <span className="font-medium text-sm">{item.area}</span>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    item.color === 'green' ? 'bg-green-500/10 text-green-400' :
                    item.color === 'gold' ? 'bg-gold-500/10 text-gold-500' :
                    'bg-white/5 text-white/30'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="glass-card !p-0 overflow-hidden">
              <div className="relative aspect-square bg-navy-900 rounded-2xl overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/2036869/pexels-photo-2036869.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Service coverage map"
                  className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gold-500/20 border-2 border-gold-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-12 h-12 text-gold-500" />
                    </div>
                    <p className="text-lg font-bold">نقشه پوشش خدمات</p>
                    <p className="text-white/40 text-sm mt-1">پردیس و شهرک ولیعصر</p>
                  </div>
                </div>
                <div className="absolute top-6 right-6 bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-1.5 text-xs text-gold-500">
                  فعلأ فعال
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/30 to-transparent" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="section-title mb-4">
            سوالات <span className="gold-gradient-text">متداول</span>
          </h2>
        </AnimatedSection>

        <AnimatedSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`glass-card !p-0 overflow-hidden transition-all duration-300 ${
                  openIndex === i ? 'border-gold-500/20' : ''
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-right"
                >
                  <span className="font-bold text-sm">{faq.question}</span>
                  {openIndex === i ? (
                    <ChevronUp className="w-5 h-5 text-gold-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/40 shrink-0" />
                  )}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === i ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <p className="px-5 pb-5 text-white/50 text-sm leading-7">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function InvestorSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-accent-500/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="glass-card border-gold-500/20 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-2 text-sm text-gold-500 font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              فرصت سرمایه‌گذاری
            </div>

            <h2 className="section-title !text-3xl md:!text-4xl mb-4">
              شریک رشد <span className="gold-gradient-text">آویزسرویس</span> باشید
            </h2>

            <p className="section-subtitle mx-auto mb-8">
              بازار تعویض روغن ایران بیش از ۳۰ هزار میلیارد تومان است. با مدل سیار، ما این بازار را متحول می‌کنیم.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { value: '+۲۰M', label: 'خودرو در ایران' },
                { value: '+۵۰%', label: 'رشد سالانه بازار' },
                { value: '۳۰B+', label: 'ارزش بازار (تومان)' },
                { value: '+۲۰۰۰', label: 'مشتری فعال' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-2xl font-extrabold gold-gradient-text mb-1">{stat.value}</div>
                  <div className="text-white/40 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            <Link to="/investor" className="btn-primary inline-flex items-center gap-2">
              اطلاعات سرمایه‌گذاری
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function TrustSection() {
  const badges = [
    { icon: Shield, label: 'نماد اعتماد الکترونیکی' },
    { icon: CheckCircle2, label: 'روغن‌های اصل با هولوگرام' },
    { icon: Award, label: 'گارانتی ۳ ماهه خدمات' },
    { icon: Users, label: 'بیش از ۲۰۰۰ مشتری راضی' },
  ];

  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-3 justify-center">
              <badge.icon className="w-8 h-8 text-gold-500/60" />
              <span className="text-white/40 text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection>
          <h2 className="section-title mb-4">
            همین الان <span className="gold-gradient-text">رزرو کنید</span>
          </h2>
          <p className="section-subtitle mx-auto mb-8">
            تعویض روغن حرفه‌ای در محل شما. فقط ۳۰ دقیقه.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/book" className="btn-primary text-lg flex items-center gap-2">
              رزرو تعویض روغن
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <a href="tel:0219130" className="btn-secondary text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              تماس تلفنی
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function StatsBanner() {
  const stats = [
    { icon: Zap, value: '۲۰ دقیقه', label: 'میانگین زمان سرویس' },
    { icon: Droplets, value: '+۵۰۰۰', label: 'تعویض روغن انجام شده' },
    { icon: Star, value: '۴.۸', label: 'امتیاز مشتریان' },
    { icon: MapPin, value: '۲', label: 'ناحیه تحت پوشش' },
  ];

  return (
    <section className="py-12 border-y border-white/5 bg-navy-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <AnimatedSection key={i} delay={i * 100}>
              <div className="text-center">
                <stat.icon className="w-6 h-6 text-gold-500 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-extrabold mb-1">{stat.value}</div>
                <div className="text-white/40 text-sm">{stat.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrustSection />
      <StatsBanner />
      <ProcessSection />
      <BenefitsSection />
      <ReviewsSection />
      <CoverageSection />
      <FAQSection />
      <InvestorSection />
      <CTASection />
    </main>
  );
}
