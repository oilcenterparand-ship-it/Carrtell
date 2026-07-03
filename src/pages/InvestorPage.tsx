import {
  TrendingUp, Users, Target, DollarSign,
  BarChart3, Globe, Truck, Award, ArrowLeft,
  CheckCircle2, Rocket, Handshake, PieChart,
  Zap, Shield, Mail, Phone
} from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

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

export default function InvestorPage() {
  const revenueStreams = [
    { icon: Droplets, title: 'فروش روغن و فیلتر', desc: 'حاشیه سود ۳۰-۴۰٪ روی محصولات مصرفی', percentage: '45%' },
    { icon: Truck, title: 'خدمات سیار', desc: 'هزینه سرویس بر اساس فاصله محاسبه می‌شود', percentage: '25%' },
    { icon: Award, title: 'اشتراک ویژه', desc: 'پلن‌های ماهانه و سالانه با تخفیف‌های ویژه', percentage: '20%' },
    { icon: Handshake, title: 'همکاری با B2B', desc: 'قرارداد با ناوگان‌های شرکتی و دولتی', percentage: '10%' },
  ];

  const milestones = [
    { quarter: 'Q1 1404', title: 'راه‌اندازی در پردیس', status: 'completed', desc: 'راه‌اندازی سرویس در پردیس و شهرک ولیعصر' },
    { quarter: 'Q2 1404', title: 'گسترش در تهران', status: 'current', desc: 'توسعه به تمام مناطق شرق تهران' },
    { quarter: 'Q3 1404', title: 'اپلیکیشن موبایل', status: 'upcoming', desc: 'راه‌اندازی اپ iOS و Android' },
    { quarter: 'Q4 1404', title: '۱۰ ناحیه تحت پوشش', status: 'upcoming', desc: 'پوشش ۱۰ ناحیه اصلی تهران' },
    { quarter: 'Q1 1405', title: 'توسعه به شهرستان‌ها', status: 'upcoming', desc: 'شروع عملیات در اصفهان و شیراز' },
    { quarter: 'Q2 1405', title: 'سراسری', status: 'upcoming', desc: 'پوشش تمام مراکز استان‌ها' },
  ];

  const benefits = [
    { icon: TrendingUp, title: 'بازار رو به رشد', desc: 'بازار ۳۰ هزار میلیارد تومانی با رشد سالانه ۵۰٪' },
    { icon: Zap, title: 'مدل مقیاس‌پذیر', desc: 'هزینه ثابت پایین، قابلیت تکرار در هر شهر' },
    { icon: Shield, title: 'ریسک پایین', desc: 'حاشیه سود بالا و بازگشت سرمایه سریع' },
    { icon: Globe, title: 'پتانسیل ملی', desc: 'بیش از ۲۰ میلیون خودرو در ایران' },
    { icon: Users, title: 'تیم حرفه‌ای', desc: 'تجربه در خودرو، فناوری و بازاریابی' },
    { icon: Target, title: 'مزیت رقابتی', desc: 'اولین سرویس سیار حرفه‌ای تعویض روغن در ایران' },
  ];

  return (
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-accent-500/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-2 text-sm text-gold-500 font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              فرصت سرمایه‌گذاری
            </div>
            <h1 className="section-title !text-4xl md:!text-5xl lg:!text-6xl mb-6">
              شریک رشد
              <br />
              <span className="gold-gradient-text">آویزسرویس</span> باشید
            </h1>
            <p className="text-xl text-white/60 leading-8 max-w-2xl mx-auto mb-8">
              بازار تعویض روغن ایران بیش از ۳۰ هزار میلیارد تومان است.
              با مدل سیار و فناوری‌محور، ما این بازار را متحول می‌کنیم.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="mailto:invest@avizservice.ir" className="btn-primary text-lg flex items-center gap-2">
                تماس با تیم سرمایه‌گذاری
                <ArrowLeft className="w-5 h-5" />
              </a>
              <a href="#pitch-deck" className="btn-secondary text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                دانلود پیچ‌دک
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '+۲۰M', label: 'خودرو در ایران', icon: Users },
              { value: '۳۰T+', label: 'ارزش بازار (تومان)', icon: DollarSign },
              { value: '+۵۰٪', label: 'رشد سالانه بازار', icon: TrendingUp },
              { value: '۵۰K+', label: 'تعویض روغن روزانه', icon: Zap },
            ].map((stat) => (
              <AnimatedSection key={stat.label}>
                <div className="text-center">
                  <stat.icon className="w-8 h-8 text-gold-500 mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-extrabold gold-gradient-text mb-1">{stat.value}</div>
                  <div className="text-white/40 text-sm">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="section-title mb-4">
              مدل <span className="gold-gradient-text">درآمدی</span>
            </h2>
            <p className="section-subtitle mx-auto">
              منابع درآمد متنوع با حاشیه سود بالا
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {revenueStreams.map((stream, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="glass-card group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                        <stream.icon className="w-6 h-6 text-gold-500" />
                      </div>
                      <div>
                        <h3 className="font-bold">{stream.title}</h3>
                        <p className="text-white/40 text-sm">{stream.desc}</p>
                      </div>
                    </div>
                    <span className="text-2xl font-extrabold gold-gradient-text">{stream.percentage}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-gold-500 h-2 rounded-full transition-all duration-1000" style={{ width: stream.percentage }} />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Service Vehicle */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <h2 className="section-title !text-3xl md:!text-4xl mb-4">
                وسیله نقلیه <span className="gold-gradient-text">سیار</span>
              </h2>
              <p className="text-white/60 leading-8 mb-6">
                هر واحد سیار مجهز به تمام ابزار و مواد مصرفی لازم برای تعویض روغن حرفه‌ای است.
                این مدل مقیاس‌پذیر و با هزینه ثابت پایین است.
              </p>
              <ul className="space-y-3">
                {[
                  'مجهز به تمام روغن‌ها و فیلترهای پرفروش',
                  'سیستم جمع‌آوری روغن usado مطابق استانداردها',
                  'ابزار حرفه‌ای و تجهیزات ایمنی',
                  'GPS و سیستم مدیریت مسیر',
                  'پایانه پرداخت و صدور فاکتور آنی',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="glass-card !p-0 overflow-hidden">
                <div className="relative aspect-video bg-navy-800">
                  <img
                    src="https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Mobile service vehicle"
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 right-6 left-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gold-500/20 border border-gold-500/30 rounded-xl flex items-center justify-center">
                        <Truck className="w-7 h-7 text-gold-500" />
                      </div>
                      <div>
                        <div className="font-bold">واحد سیار آویزسرویس</div>
                        <div className="text-white/40 text-sm">مجهز و آماده سرویس</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Growth Roadmap */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="section-title mb-4">
              نقشه <span className="gold-gradient-text">رشد</span>
            </h2>
            <p className="section-subtitle mx-auto">
              مسیر توسعه از پردیس تا سراسر ایران
            </p>
          </AnimatedSection>

          <div className="relative">
            <div className="absolute right-[23px] top-0 bottom-0 w-0.5 bg-white/10" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <AnimatedSection key={i} delay={i * 100}>
                  <div className="flex items-start gap-6 relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10 ${
                      m.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : m.status === 'current'
                        ? 'bg-gold-500 text-navy-950'
                        : 'bg-white/5 border border-white/10 text-white/30'
                    }`}>
                      {m.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : m.status === 'current' ? (
                        <Rocket className="w-6 h-6" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className={`glass-card flex-1 ${m.status === 'current' ? 'border-gold-500/30' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">{m.title}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          m.status === 'completed'
                            ? 'bg-green-500/10 text-green-400'
                            : m.status === 'current'
                            ? 'bg-gold-500/10 text-gold-500'
                            : 'bg-white/5 text-white/30'
                        }`}>{m.quarter}</span>
                      </div>
                      <p className="text-white/40 text-sm">{m.desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Investor Benefits */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="section-title mb-4">
              مزایای <span className="gold-gradient-text">سرمایه‌گذاری</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="glass-card group text-center">
                  <div className="w-14 h-14 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-500/20 transition-colors">
                    <b.icon className="w-7 h-7 text-gold-500" />
                  </div>
                  <h3 className="font-bold mb-2">{b.title}</h3>
                  <p className="text-white/40 text-sm leading-6">{b.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="glass-card border-gold-500/20 text-center">
              <BarChart3 className="w-12 h-12 text-gold-500 mx-auto mb-6" />
              <h2 className="text-2xl font-extrabold mb-4">فرصت‌های مشارکت</h2>
              <p className="text-white/50 leading-7 max-w-xl mx-auto mb-8">
                علاوه بر سرمایه‌گذاری، فرصت‌های مشارکت استراتژیک در زمینه ناوگان، تامین محصولات و بازاریابی وجود دارد.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { title: 'ناوگان شرکتی', desc: 'تخفیف ویژه برای ناوگان‌های بزرگ' },
                  { title: 'تامین محصولات', desc: 'همکاری در زمینه توزیع روغن و فیلتر' },
                  { title: 'فرانچایز', desc: 'مجوز فعالیت در شهرهای دیگر' },
                ].map((p) => (
                  <div key={p.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                    <p className="text-white/40 text-xs">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-accent-500/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="section-title !text-3xl md:!text-4xl mb-4">
              آماده <span className="gold-gradient-text">شروع</span> هستید؟
            </h2>
            <p className="section-subtitle mx-auto mb-8">
              برای دریافت پیچ‌دک و اطلاعات بیشتر با تیم سرمایه‌گذاری ما تماس بگیرید
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <a href="mailto:invest@avizservice.ir" className="btn-primary text-lg flex items-center gap-2">
                <Mail className="w-5 h-5" />
                invest@avizservice.ir
              </a>
              <a href="tel:0219130" className="btn-secondary text-lg flex items-center gap-2">
                <Phone className="w-5 h-5" />
                ۰۲۱-۹۱۳۰
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}

function Droplets(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 16.3c-1.8 1-3 2.8-3 4.7 0 1.6 1.3 3 3 3 1.7 0 3-1.3 3-3 0-1.9-1.2-3.7-3-4.7"/>
      <path d="M12.9 6.6c-2.7 1.5-4.9 4.2-4.9 7.4 0 2.7 2.2 5 5 5 2.7 0 5-2.3 5-5 0-3.2-2.2-5.9-4.9-7.4"/>
      <path d="M18.5 1.8c-4 2.2-7 6-7 10.2 0 3.9 3.1 7 7 7 3.9 0 7-3.1 7-7 0-4.2-3-8-7-10.2"/>
    </svg>
  );
}
