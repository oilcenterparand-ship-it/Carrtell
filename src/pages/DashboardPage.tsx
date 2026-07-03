import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Droplets, Award,
  FileText, Bell, MapPin, ChevronLeft, Plus,
  Settings, LogOut, CreditCard, Gift, TrendingUp,
  CheckCircle2, AlertCircle, Wrench
} from 'lucide-react';
import { formatPrice } from '../data/products';

type Tab = 'orders' | 'vehicles' | 'reminders' | 'loyalty' | 'invoices';

const mockOrders = [
  { id: 'AV-1404-001', vehicle: 'پژو ۲۰۶', oil: 'کاسترول ۵W-40', filter: 'ماندو', date: '۱۴۰۴/۰۳/۱۵', time: '۱۰:۳۰', status: 'completed', price: 2370000 },
  { id: 'AV-1404-002', vehicle: 'ساینا', oil: 'شل هلکس ۵W-30', filter: 'ایرکleen', date: '۱۴۰۴/۰۲/۲۰', time: '۱۴:۰۰', status: 'completed', price: 2830000 },
  { id: 'AV-1404-003', vehicle: 'پژو ۲۰۶', oil: 'کاسترول ۵W-40', filter: '-', date: '۱۴۰۴/۰۴/۰۱', time: '۰۹:۰۰', status: 'upcoming', price: 1850000 },
];

const mockVehicles = [
  { id: '1', brand: 'ایران‌خودرو', model: 'پژو ۲۰۶', year: 1402, color: 'سفید', lastService: '۱۴۰۴/۰۳/۱۵', nextService: '۱۴۰۴/۰۶/۱۵', mileage: 45000 },
  { id: '2', brand: 'ایران‌خودرو', model: 'ساینا', year: 1401, color: 'مشکی', lastService: '۱۴۰۴/۰۲/۲۰', nextService: '۱۴۰۴/۰۵/۲۰', mileage: 62000 },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'orders', icon: FileText, label: 'سفارش‌ها' },
    { id: 'vehicles', icon: Car, label: 'خودروها' },
    { id: 'reminders', icon: Bell, label: 'یادآوری‌ها' },
    { id: 'loyalty', icon: Gift, label: 'امتیازها' },
    { id: 'invoices', icon: CreditCard, label: 'فاکتورها' },
  ];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="glass-card mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gold-500/20 border border-gold-500/30 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-extrabold gold-gradient-text">م</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">محمد رضایی</h1>
              <p className="text-white/40 text-sm">عضویت: آذر ۱۴۰۳ | سطح: طلایی</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/book" className="btn-primary !text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              سفارش جدید
            </Link>
            <button className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, value: '۳', label: 'سفارش‌ها', color: 'gold' },
            { icon: Car, value: '۲', label: 'خودروها', color: 'blue' },
            { icon: Gift, value: '۱,۲۵۰', label: 'امتیاز وفاداری', color: 'green' },
            { icon: TrendingUp, value: '۲۵٪', label: 'تخفیف بعدی', color: 'accent' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-5 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${
                stat.color === 'gold' ? 'text-gold-500' :
                stat.color === 'blue' ? 'text-blue-400' :
                stat.color === 'green' ? 'text-green-400' :
                'text-accent-400'
              }`} />
              <div className="text-xl font-extrabold mb-0.5">{stat.value}</div>
              <div className="text-white/40 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <nav className="glass-card !p-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gold-500/10 text-gold-500'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400/60 hover:bg-red-500/5 hover:text-red-400 transition-all">
                <LogOut className="w-5 h-5" />
                خروج
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4">تاریخچه سفارش‌ها</h2>
                {mockOrders.map((order) => (
                  <div key={order.id} className="glass-card !p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{order.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            order.status === 'completed'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-gold-500/10 text-gold-500'
                          }`}>
                            {order.status === 'completed' ? 'تکمیل شده' : 'در انتظار'}
                          </span>
                        </div>
                        <div className="text-white/40 text-xs">{order.date} - ساعت {order.time}</div>
                      </div>
                      <span className="font-extrabold text-sm gold-gradient-text">{formatPrice(order.price)} تومان</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/5">
                      <div>
                        <div className="text-white/30 text-xs mb-1">خودرو</div>
                        <div className="text-sm font-medium flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-gold-500" />
                          {order.vehicle}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/30 text-xs mb-1">روغن</div>
                        <div className="text-sm font-medium flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-gold-500" />
                          {order.oil}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/30 text-xs mb-1">فیلتر</div>
                        <div className="text-sm font-medium flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-gold-500" />
                          {order.filter}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">خودروهای من</h2>
                  <button className="btn-ghost !text-sm flex items-center gap-2 text-gold-500">
                    <Plus className="w-4 h-4" />
                    افزودن خودرو
                  </button>
                </div>
                {mockVehicles.map((v) => (
                  <div key={v.id} className="glass-card !p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center">
                          <Car className="w-6 h-6 text-gold-500" />
                        </div>
                        <div>
                          <div className="font-bold">{v.model}</div>
                          <div className="text-white/40 text-xs">{v.brand} | {v.year} | {v.color}</div>
                        </div>
                      </div>
                      <Link to="/book" className="btn-ghost !text-xs flex items-center gap-1 text-gold-500">
                        رزرو سرویس
                        <ChevronLeft className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/5">
                      <div>
                        <div className="text-white/30 text-xs mb-1">کارکرد</div>
                        <div className="text-sm font-medium">{v.mileage.toLocaleString('fa-IR')} کیلومتر</div>
                      </div>
                      <div>
                        <div className="text-white/30 text-xs mb-1">آخرین سرویس</div>
                        <div className="text-sm font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          {v.lastService}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/30 text-xs mb-1">سرویس بعدی</div>
                        <div className="text-sm font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-gold-500" />
                          {v.nextService}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4">یادآوری‌ها</h2>
                <div className="glass-card !p-5 border-gold-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gold-500/20 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-gold-500" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">تعویض روغن پژو ۲۰۶</div>
                      <div className="text-white/40 text-xs">تاریخ موعد: ۱۴۰۴/۰۶/۱۵</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <MapPin className="w-3 h-3" />
                    <span>حدود ۲ ماه تا سرویس بعدی</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                    <Link to="/book" className="btn-primary !text-xs !px-4 !py-2 flex items-center gap-2">
                      رزرو الان
                      <ChevronLeft className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="glass-card !p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white/30" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">تعویض روغن ساینا</div>
                      <div className="text-white/40 text-xs">تاریخ موعد: ۱۴۰۴/۰۵/۲۰</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === 'loyalty' && (
              <div>
                <h2 className="text-lg font-bold mb-4">برنامه وفاداری</h2>

                <div className="glass-card !p-6 border-gold-500/20 mb-6 text-center">
                  <div className="w-20 h-20 bg-gold-500/20 border-2 border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-10 h-10 text-gold-500" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-1">سطح طلایی</h3>
                  <p className="text-white/40 text-sm mb-4">۱,۲۵۰ امتیاز</p>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                    <div className="bg-gold-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <p className="text-white/30 text-xs">۷۵۰ امتیاز تا سطح پلاتینی</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'تخفیف ۲۵٪ سرویس بعدی', points: '۵۰۰ امتیاز', available: true },
                    { label: 'تعویض رایگان فیلتر هوا', points: '۱,۰۰۰ امتیاز', available: true },
                    { label: 'یک تعویض روغن رایگان', points: '۲,۵۰۰ امتیاز', available: false },
                  ].map((reward) => (
                    <div key={reward.label} className="glass-card !p-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm mb-0.5">{reward.label}</div>
                        <div className="text-white/40 text-xs">{reward.points}</div>
                      </div>
                      <button className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                        reward.available
                          ? 'bg-gold-500/10 text-gold-500 hover:bg-gold-500/20'
                          : 'bg-white/5 text-white/20 cursor-not-allowed'
                      }`}>
                        {reward.available ? 'استفاده' : 'ناکافی'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4">فاکتورها</h2>
                {mockOrders.filter(o => o.status === 'completed').map((order) => (
                  <div key={order.id} className="glass-card !p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gold-500" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{order.id}</div>
                        <div className="text-white/40 text-xs">{order.date}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{formatPrice(order.price)} تومان</div>
                      <div className="text-green-400 text-xs">پرداخت شده</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
