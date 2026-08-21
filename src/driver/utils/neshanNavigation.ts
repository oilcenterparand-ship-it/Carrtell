export type Coordinates = { latitude: number; longitude: number };

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function hasCoordinates(latitude?: number | null, longitude?: number | null) {
  return isFiniteCoordinate(latitude) && isFiniteCoordinate(longitude);
}

export function buildNeshanDestinationUrl(destination: Coordinates, origin?: Coordinates | null) {
  const destinationValue = `${destination.latitude},${destination.longitude}`;
  if (origin) {
    return `https://nshn.ir/maps?origin=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}&destination=${encodeURIComponent(destinationValue)}&type=drive`;
  }
  return `https://nshn.ir/?lat=${encodeURIComponent(String(destination.latitude))}&lng=${encodeURIComponent(String(destination.longitude))}`;
}

export function getCurrentCoordinates(timeout = 5500): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 30_000 },
    );
  });
}

export async function openNeshanNavigation(destination: Coordinates) {
  const origin = await getCurrentCoordinates();
  const url = buildNeshanDestinationUrl(destination, origin);
  window.location.assign(url);
}
