import type { Car } from '../../admin/services/carsApi';
import { getCarTitle } from '../../admin/services/carsApi';

export type SelectedCustomerCar = {
  id: string;
  title: string;
  brand?: string;
  model?: string;
  trim?: string;
  engine?: string;
  transmission_type?: string | null;
};

const SELECTED_CAR_KEY = 'carrtell:selected-customer-car';
const SELECTED_CAR_EVENT = 'carrtell-selected-car-updated';

export function readSelectedCustomerCar(): SelectedCustomerCar | null {
  try {
    const raw = localStorage.getItem(SELECTED_CAR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSelectedCustomerCar(car: Car | SelectedCustomerCar | null) {
  if (!car || !car.id) {
    localStorage.removeItem(SELECTED_CAR_KEY);
  } else {
    const payload: SelectedCustomerCar = {
      id: car.id,
      title: 'title' in car && car.title ? car.title : getCarTitle(car as Car),
      brand: car.brand,
      model: car.model,
      trim: 'trim' in car ? car.trim : undefined,
      engine: car.engine,
      transmission_type: car.transmission_type || null,
    };
    localStorage.setItem(SELECTED_CAR_KEY, JSON.stringify(payload));
  }
  window.dispatchEvent(new CustomEvent(SELECTED_CAR_EVENT));
}

export function onSelectedCustomerCarChange(callback: () => void) {
  window.addEventListener(SELECTED_CAR_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(SELECTED_CAR_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
