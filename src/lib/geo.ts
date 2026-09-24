/**
 * Mercator-Projektion, zugeschnitten auf Australien.
 * Kartenkoordinaten: x von 0 bis MAP_WIDTH, y von 0 bis MAP_HEIGHT (oben = Norden).
 * Wird auch von scripts/build-australia-map.ts genutzt – deshalb ohne Imports.
 */
export const BOUNDS = { west: 111, east: 156, north: -8.5, south: -44.5 } as const;
export const MAP_WIDTH = 1000;

const rad = (deg: number) => (deg * Math.PI) / 180;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));

const yTop = mercY(BOUNDS.north);
const yBottom = mercY(BOUNDS.south);
const lngSpan = rad(BOUNDS.east - BOUNDS.west);

export const MAP_HEIGHT = Math.round((MAP_WIDTH * (yTop - yBottom)) / lngSpan);

export interface LatLng {
  lat: number;
  lng: number;
}

export function project({ lat, lng }: LatLng): [x: number, y: number] {
  const x = ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * MAP_WIDTH;
  const y = ((yTop - mercY(lat)) / (yTop - yBottom)) * MAP_HEIGHT;
  return [x, y];
}

export function unproject(x: number, y: number): LatLng {
  const lng = BOUNDS.west + (x / MAP_WIDTH) * (BOUNDS.east - BOUNDS.west);
  const my = yTop - (y / MAP_HEIGHT) * (yTop - yBottom);
  const lat = (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * (180 / Math.PI);
  return { lat, lng };
}

/** Grob: liegt die Position im Kartenausschnitt Australien? */
export function inBounds({ lat, lng }: LatLng): boolean {
  return lng >= BOUNDS.west && lng <= BOUNDS.east && lat <= BOUNDS.north && lat >= BOUNDS.south;
}

/** -16.9186, 145.7781 → '16,92° S, 145,78° O' */
export function formatLatLng({ lat, lng }: LatLng): string {
  const f = (n: number) => Math.abs(n).toFixed(2).replace('.', ',');
  return `${f(lat)}° ${lat < 0 ? 'S' : 'N'}, ${f(lng)}° ${lng < 0 ? 'W' : 'O'}`;
}
