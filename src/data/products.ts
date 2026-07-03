export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  viscosity: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  compatibleVehicles: string[];
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  engineType: string;
  recommendedOil: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  comment: string;
  date: string;
}

export const products: Product[] = [
  { id: '1', name: 'موتورسایکل ۵W-40', brand: 'کاسترول', category: 'engine-oil', viscosity: '5W-40', price: 1850000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8, reviewCount: 234, inStock: true, compatibleVehicles: ['پژو ۲۰۶', 'ساینا', 'شاهین'] },
  { id: '2', name: 'ادج ۱۰W-40', brand: 'توتال', category: 'engine-oil', viscosity: '10W-40', price: 1520000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.6, reviewCount: 189, inStock: true, compatibleVehicles: ['پژو ۴۰۵', 'پارس', 'سمند'] },
  { id: '3', name: 'هلکس ۵W-30', brand: 'شل', category: 'engine-oil', viscosity: '5W-30', price: 2100000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9, reviewCount: 312, inStock: true, compatibleVehicles: ['تیبا', 'پراید', 'دانگ‌فنگ'] },
  { id: '4', name: 'مگناتک ۱۰W-40', brand: 'کاسترول', category: 'engine-oil', viscosity: '10W-40', price: 1780000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.7, reviewCount: 156, inStock: true, compatibleVehicles: ['پژو ۲۰۶', 'پژو ۲۰۷', 'هیوندای'] },
  { id: '5', name: 'کوارتز ۹۰۰۰ ۵W-40', brand: 'توتال', category: 'engine-oil', viscosity: '5W-40', price: 2350000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.9, reviewCount: 278, inStock: true, compatibleVehicles: [' Reno Stepway', 'سانتافه', 'スポ티ج'] },
  { id: '6', name: 'فیلتر روغن پژو', brand: 'ماندو', category: 'oil-filter', viscosity: '-', price: 320000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.5, reviewCount: 98, inStock: true, compatibleVehicles: ['پژو ۲۰۶', 'پژو ۴۰۵', 'پارس'] },
  { id: '7', name: 'فیلتر روغن ساینا', brand: 'ایرکleen', category: 'oil-filter', viscosity: '-', price: 290000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.4, reviewCount: 76, inStock: true, compatibleVehicles: ['ساینا', 'شاهین', 'کیا'] },
  { id: '8', name: 'فیلتر هوا پژو', brand: 'ماندو', category: 'air-filter', viscosity: '-', price: 450000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.3, reviewCount: 54, inStock: true, compatibleVehicles: ['پژو ۲۰۶', 'پژو ۴۰۵'] },
  { id: '9', name: 'فیلتر کابین ساینا', brand: 'ایرکleen', category: 'cabin-filter', viscosity: '-', price: 380000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.2, reviewCount: 43, inStock: true, compatibleVehicles: ['ساینا', 'شاهین'] },
  { id: '10', name: 'روغن گیربکس ۷۵W-90', brand: 'توتال', category: 'gear-oil', viscosity: '75W-90', price: 890000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.6, reviewCount: 67, inStock: true, compatibleVehicles: ['همه خودروها'] },
  { id: '11', name: 'افزودنی روغن موتور', brand: 'لوبرگارد', category: 'additive', viscosity: '-', price: 650000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.1, reviewCount: 32, inStock: true, compatibleVehicles: ['همه خودروها'] },
  { id: '12', name: 'موتورسایکل ۵W-30', brand: 'شل', category: 'engine-oil', viscosity: '5W-30', price: 1950000, image: 'https://images.pexels.com/photos/6285764/pexels-photo-6285764.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.8, reviewCount: 198, inStock: true, compatibleVehicles: ['پژو ۲۰۷', 'تیبا'] },
];

export const vehicles: Vehicle[] = [
  { id: '1', brand: 'ایران‌خودرو', model: 'پژو ۲۰۶', year: 2023, engineType: 'TU5', recommendedOil: '5W-40' },
  { id: '2', brand: 'ایران‌خودرو', model: 'پژو ۴۰۵', year: 2023, engineType: 'XU7', recommendedOil: '10W-40' },
  { id: '3', brand: 'ایران‌خودرو', model: 'پارس', year: 2023, engineType: 'XU7', recommendedOil: '10W-40' },
  { id: '4', brand: 'ایران‌خودرو', model: 'ساینا', year: 2023, engineType: 'EF7', recommendedOil: '5W-40' },
  { id: '5', brand: 'ایران‌خودرو', model: 'شاهین', year: 2023, engineType: 'EF7TC', recommendedOil: '5W-40' },
  { id: '6', brand: 'سایپا', model: 'پراید', year: 2023, engineType: 'XU7', recommendedOil: '5W-30' },
  { id: '7', brand: 'سایپا', model: 'تیبا', year: 2023, engineType: 'XU7', recommendedOil: '5W-30' },
  { id: '8', brand: 'بهمن', model: 'دانگ‌فنگ', year: 2023, engineType: 'N46', recommendedOil: '5W-30' },
  { id: '9', brand: 'بهمن', model: 'MVM ۱۱۰', year: 2023, engineType: 'K14B', recommendedOil: '5W-30' },
  { id: '10', brand: 'سایپا', model: 'کوئیک', year: 2023, engineType: 'M15', recommendedOil: '5W-30' },
  { id: '11', brand: 'ایران‌خودرو', model: 'رانا', year: 2023, engineType: 'EF7', recommendedOil: '5W-40' },
  { id: '12', brand: 'ایران‌خودرو', model: 'دنا', year: 2023, engineType: 'EF7TC', recommendedOil: '5W-40' },
];

export const faqs: FAQ[] = [
  { question: 'تعویض روغن در محل چگونه کار می‌کند؟', answer: 'شما خودرو، روغن و زمان مورد نظر را انتخاب می‌کنید. تیم سیار ما با وسیله نقلیه مجهز به محل شما می‌آید و تعویض روغن را انجام می‌دهد. کل فرآیند کمتر از ۳۰ دقیقه طول می‌کشد.' },
  { question: 'آیا روغن‌ها اصل هستند؟', answer: 'بله، تمام روغن‌ها و فیلترها از نمایندگی‌های معتبر تهیه می‌شوند و دارای هولوگرام اصالت هستند. ما تضمین کیفیت تمام محصولات را داریم.' },
  { question: 'منطقه تحت پوشش شما کجاست؟', answer: 'در حال حاضر خدمات ما در پردیس و شهرک ولیعصر فعال است. به‌زودی در تمام مناطق تهران و سپس سراسر ایران ارائه خواهیم شد.' },
  { question: 'هزینه خدمات چقدر است؟', answer: 'هزینه خدمات بر اساس فاصله از انبار محاسبه می‌شود. قیمت روغن و فیلترها در سایت مشخص است و هزینه سرویس از ۵۰,۰۰۰ تومان شروع می‌شود.' },
  { question: 'آیا گارانتی خدمات وجود دارد؟', answer: 'بله، تمام خدمات ما دارای گارانتی ۳ ماهه است. در صورت بروز هرگونه مشکل، تیم ما رایگان مجدداً بررسی خواهد کرد.' },
  { question: 'چگونه می‌توانم پرداخت کنم؟', answer: 'پرداخت آنلاین از طریق درگاه بانکی، کارت به کارت و پرداخت در محل امکان‌پذیر است.' },
];

export const reviews: Review[] = [
  { id: '1', name: 'محمد رضایی', vehicle: 'پژو ۲۰۶', rating: 5, comment: 'فوق‌العاده بود! فقط ۲۰ دقیقه طول کشید. خیلی راحت و حرفه‌ای.', date: '۱۴۰۴/۰۳/۱۵' },
  { id: '2', name: 'زهرا احمدی', vehicle: 'ساینا', rating: 5, comment: 'دیگر نیازی به رفتن به تعمیرگاه ندارم. روغن اصل و قیمت مناسب.', date: '۱۴۰۴/۰۳/۱۲' },
  { id: '3', name: 'علی محمدی', vehicle: 'پراید', rating: 4, comment: 'خدمت خوبی بود. فقط کاش زودتر رسیدن. ولی کارشون تمیزه.', date: '۱۴۰۴/۰۳/۱۰' },
  { id: '4', name: 'فاطمه کریمی', vehicle: 'پژو ۴۰۵', rating: 5, comment: 'روغن کاسترول اصلی با هولوگرام. قیمت هم از تعمیرگاه خیلی کمتره.', date: '۱۴۰۴/۰۳/۰۸' },
  { id: '5', name: 'حسین نوری', vehicle: 'شاهین', rating: 5, comment: 'سومین باره که سرویس می‌گیرم. همیشه عالی بوده. سیستم یادآوری عالیه!', date: '۱۴۰۴/۰۳/۰۵' },
];

export const categories = [
  { id: 'engine-oil', name: 'روغن موتور', icon: 'Droplets', count: 24 },
  { id: 'oil-filter', name: 'فیلتر روغن', icon: 'Filter', count: 18 },
  { id: 'air-filter', name: 'فیلتر هوا', icon: 'Wind', count: 12 },
  { id: 'cabin-filter', name: 'فیلتر کابین', icon: 'Snowflake', count: 10 },
  { id: 'gear-oil', name: 'روغن گیربکس', icon: 'Settings', count: 8 },
  { id: 'additive', name: 'افزودنی‌ها', icon: 'FlaskConical', count: 6 },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price);
}
