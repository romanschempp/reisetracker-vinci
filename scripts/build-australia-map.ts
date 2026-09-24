/**
 * Erzeugt src/features/places/mapData.ts aus Natural Earth 1:10m (public domain):
 * Bundesstaaten/Territorien als Flächen und Orte mit Rang (wichtige zuerst).
 * Einmalig ausführen: `npm run map`. Das Ergebnis wird mit der App ausgeliefert,
 * die Karte braucht also nie Internet.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { project } from '../src/lib/geo.ts';

const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const CACHE = new URL('../.cache/', import.meta.url);

async function load(file: string): Promise<{ features: { properties: Record<string, unknown>; geometry: Geometry }[] }> {
  mkdirSync(CACHE, { recursive: true });
  const path = new URL(file, CACHE);
  if (!existsSync(path)) {
    console.log(`Lade ${file} …`);
    const res = await fetch(BASE + file);
    if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

type Ring = number[][];
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
type Pt = [number, number];

/** Regionen in Kartenreihenfolge; Jervis Bay gehört optisch zum ACT. */
const REGIONS: Record<string, { code: string; name: string }> = {
  'AU-WA': { code: 'WA', name: 'Western Australia' },
  'AU-NT': { code: 'NT', name: 'Northern Territory' },
  'AU-SA': { code: 'SA', name: 'South Australia' },
  'AU-QLD': { code: 'QLD', name: 'Queensland' },
  'AU-NSW': { code: 'NSW', name: 'New South Wales' },
  'AU-VIC': { code: 'VIC', name: 'Victoria' },
  'AU-TAS': { code: 'TAS', name: 'Tasmania' },
  'AU-ACT': { code: 'ACT', name: 'Australian Capital Territory' },
  'AU-X02~': { code: 'ACT', name: 'Australian Capital Territory' },
};

const TOLERANCE = 0.06; // Kartenpixel – bei stärkstem Zoom unter 1 Bildschirmpixel
const MIN_AREA = 0.5; // winzige Inseln weglassen
const r1 = (n: number) => Math.round(n * 10) / 10;

function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a]!;
    const [bx, by] = pts[b]!;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]!;
      const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > max) [max, idx] = [d, i];
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Geschlossener Ring: am weitesten entfernten Punkt teilen, beide Hälften einzeln vereinfachen. */
function simplifyRing(ring: Pt[], tol: number): Pt[] {
  const pts = ring.slice(0, -1); // Endpunkt = Anfangspunkt
  if (pts.length < 4) return pts;
  const [x0, y0] = pts[0]!;
  let far = 1;
  pts.forEach(([x, y], i) => {
    if (Math.hypot(x - x0, y - y0) > Math.hypot(pts[far]![0] - x0, pts[far]![1] - y0)) far = i;
  });
  const first = simplify(pts.slice(0, far + 1), tol);
  const second = simplify([...pts.slice(far), pts[0]!], tol);
  return [...first, ...second.slice(1, -1)];
}

function area(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x2, y2] = pts[(i + 1) % pts.length]!;
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

function centroid(pts: Pt[]): Pt {
  let cx = 0;
  let cy = 0;
  const a = area(pts);
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x2, y2] = pts[(i + 1) % pts.length]!;
    const f = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  return [cx / (6 * a), cy / (6 * a)];
}

const admin1 = await load('ne_10m_admin_1_states_provinces.geojson');
const regions = new Map<string, { code: string; name: string; path: string; largest: Pt[] }>();

for (const f of admin1.features) {
  if (f.properties.adm0_a3 !== 'AUS') continue;
  const meta = REGIONS[f.properties.iso_3166_2 as string];
  if (!meta) continue; // z. B. Macquarie Island – außerhalb des Kartenausschnitts
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const entry = regions.get(meta.code) ?? { ...meta, path: '', largest: [] };
  for (const poly of polys) {
    const projected = poly[0]!.map(([lng, lat]) => project({ lat: lat!, lng: lng! }));
    const pts = simplifyRing(projected, TOLERANCE).map(([x, y]) => [r1(x), r1(y)] as Pt);
    if (pts.length < 3 || Math.abs(area(pts)) < MIN_AREA) continue;
    entry.path += 'M' + pts.map(([x, y]) => `${x} ${y}`).join('L') + 'Z';
    if (Math.abs(area(pts)) > Math.abs(area(entry.largest))) entry.largest = pts;
  }
  regions.set(meta.code, entry);
}

// Beschriftungspunkte: Schwerpunkt der größten Fläche, wo nötig leicht verschoben
const NUDGE: Record<string, Pt> = { NSW: [0, 12], QLD: [8, 30], VIC: [0, 4], TAS: [0, -2], SA: [-6, -30], NT: [0, 10] };
const regionData = [...regions.values()].map((r) => {
  const [cx, cy] = centroid(r.largest);
  const [dx, dy] = NUDGE[r.code] ?? [0, 0];
  return { code: r.code, name: r.name, label: [r1(cx + dx), r1(cy + dy)], path: r.path };
});

const placesGeo = await load('ne_10m_populated_places_simple.geojson');
const seen = new Set<string>();
const towns = placesGeo.features
  .map((f) => f.properties)
  .filter((p) => p.adm0_a3 === 'AUS')
  .sort((a, b) => (a.scalerank as number) - (b.scalerank as number) || (b.pop_max as number) - (a.pop_max as number))
  .filter((p) => !seen.has(p.name as string) && seen.add(p.name as string))
  .map((p) => {
    const [x, y] = project({ lat: p.latitude as number, lng: p.longitude as number });
    return { name: p.name as string, x: r1(x), y: r1(y), rank: p.scalerank as number };
  })
  .filter((t) => t.x >= 0 && t.x <= 1000 && t.y >= 0);

const out = `// Automatisch erzeugt von scripts/build-australia-map.ts – nicht von Hand bearbeiten.
// Quelle: Natural Earth 1:10m (public domain).

export interface Region {
  code: string;
  name: string;
  /** Beschriftungspunkt in Kartenkoordinaten */
  label: [number, number];
  path: string;
}

export interface Town {
  name: string;
  x: number;
  y: number;
  /** 0 = wichtigste Stadt; höhere Werte erscheinen erst beim Hineinzoomen */
  rank: number;
}

export const REGIONS: Region[] = ${JSON.stringify(regionData)};

export const TOWNS: Town[] = ${JSON.stringify(towns)};
`;
writeFileSync(new URL('../src/features/places/mapData.ts', import.meta.url), out);
console.log(`${regionData.length} Regionen, ${towns.length} Orte, ${(out.length / 1024).toFixed(0)} KB`);
