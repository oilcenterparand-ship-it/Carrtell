export type Vehicle = {
  id: string;
  title: string;
  subtitle: string;
  oilGrade: string;
  oilVolume: string;
  filterCount: number;
};

export type Product = {
  id: string;
  brand: string;
  title: string;
  grade: string;
  price: number;
  oldPrice?: number;
  category: string;
  compatible: boolean;
  badge?: string;
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export type BookingDraft = {
  service: string | null;
  location: string | null;
  date: string | null;
  time: string | null;
};
