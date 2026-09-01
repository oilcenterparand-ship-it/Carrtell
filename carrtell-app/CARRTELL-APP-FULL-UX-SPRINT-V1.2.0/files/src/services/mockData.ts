import type { Product, Vehicle } from '../types/models';

export const defaultVehicle: Vehicle = {
  id: 'peugeot-405',
  title: 'پژو 405 GLX',
  subtitle: 'بنزینی • دنده دستی',
  oilGrade: '20W-50',
  oilVolume: '4.5 لیتر',
  filterCount: 8,
};

export const products: Product[] = [
  {
    id: 'pars-super-paya-20w50',
    brand: 'نفت پارس',
    title: 'پارس سوپر پایا 20W-50',
    grade: 'API SL',
    price: 595000,
    oldPrice: 630000,
    category: 'روغن موتور',
    compatible: true,
    badge: 'پیشنهاد ویژه',
  },
  {
    id: 'pars-super-paya-10w40',
    brand: 'نفت پارس',
    title: 'پارس سوپر پایا 10W-40',
    grade: 'API SL',
    price: 645000,
    category: 'روغن موتور',
    compatible: false,
  },
  {
    id: 'serkan-oil-filter',
    brand: 'سرکان',
    title: 'فیلتر روغن سازگار',
    grade: 'پژو 405',
    price: 185000,
    category: 'فیلترها',
    compatible: true,
    badge: 'سازگار با خودرو',
  },
  {
    id: 'pars-antifreeze',
    brand: 'نفت پارس',
    title: 'ضدیخ و ضدجوش پارس',
    grade: '1 لیتری',
    price: 295000,
    category: 'ضدیخ',
    compatible: true,
  },
  {
    id: 'pars-madous-85w90',
    brand: 'نفت پارس',
    title: 'پارس مدوس 85W-90',
    grade: 'GL-4',
    price: 475000,
    category: 'واسکازین',
    compatible: true,
  },
  {
    id: 'grease-chassis',
    brand: 'نفت پارس',
    title: 'گریس شاسی',
    grade: '5 کیلوگرم',
    price: 1180000,
    category: 'گریس',
    compatible: false,
  },
];

export const categories = ['همه', 'روغن موتور', 'فیلترها', 'ضدیخ', 'واسکازین', 'گریس'];

export const popularBrands = ['نفت پارس', 'بهران', 'ایرانول', 'کاسترول', 'سرکان'];

export const serviceTypes = [
  { id: 'oil', title: 'تعویض روغن', subtitle: 'روغن موتور + کنترل سطح مایعات', price: 180000 },
  { id: 'oil-filter', title: 'روغن + فیلتر', subtitle: 'تعویض روغن و فیلتر روغن', price: 260000 },
  { id: 'full', title: 'سرویس کامل', subtitle: 'روغن، فیلترها و بازدید کامل', price: 390000 },
  { id: 'custom', title: 'سرویس سفارشی', subtitle: 'انتخاب خدمات دلخواه', price: 0 },
];

export const timeSlots = ['09:00', '11:00', '14:00', '16:00', '18:00'];
