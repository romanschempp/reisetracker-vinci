import type { Town } from './mapData';

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedLabel {
  town: Town;
  anchor: 'start' | 'end';
}

/** Welche Orte bei welchem Zoom erscheinen (Zoom 1 = ganz Australien). */
export function maxRankForZoom(zoom: number): number {
  if (zoom < 1.6) return 3;
  if (zoom < 3) return 4;
  if (zoom < 6) return 6;
  return 8;
}

const CHAR_PX = 6.2; // mittlere Zeichenbreite von Barlow Condensed bei 12 px
const LABEL_H = 15;
const GAP = 7;

/**
 * Wählt Ortsnamen, die in den Ausschnitt passen und sich nicht überlappen.
 * Wichtige Orte zuerst (TOWNS ist nach Rang sortiert). Am rechten Rand
 * steht der Name links vom Punkt, damit er nicht abgeschnitten wird.
 */
export function placeTownLabels(towns: Town[], view: ViewBox, pxPerUnit: number, mapWidth: number): PlacedLabel[] {
  const maxRank = maxRankForZoom(mapWidth / view.w);
  const boxes: [number, number, number, number][] = [];
  const placed: PlacedLabel[] = [];

  for (const town of towns) {
    if (town.rank > maxRank) continue;
    // in Bildschirmpixel relativ zum Ausschnitt
    const sx = (town.x - view.x) * pxPerUnit;
    const sy = (town.y - view.y) * pxPerUnit;
    const viewW = view.w * pxPerUnit;
    const viewH = view.h * pxPerUnit;
    if (sx < 0 || sy < 0 || sx > viewW || sy > viewH) continue;

    const width = town.name.length * CHAR_PX;
    const candidates: ('start' | 'end')[] = sx + GAP + width > viewW - 4 ? ['end'] : ['start', 'end'];
    for (const anchor of candidates) {
      const x1 = anchor === 'start' ? sx - 4 : sx - GAP - width;
      const x2 = anchor === 'start' ? sx + GAP + width : sx + 4;
      const box: [number, number, number, number] = [x1, sy - LABEL_H / 2, x2, sy + LABEL_H / 2];
      if (x1 < 0) continue;
      const hit = boxes.some(([a1, b1, a2, b2]) => box[0] < a2 && box[2] > a1 && box[1] < b2 && box[3] > b1);
      if (!hit) {
        boxes.push(box);
        placed.push({ town, anchor });
        break;
      }
    }
  }
  return placed;
}

/** Maßstab: eine runde Strecke, die höchstens maxPx breit ist. */
export function scaleBar(kmPerPx: number, maxPx = 90): { km: number; px: number } {
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  let km = steps[0]!;
  for (const s of steps) if (s / kmPerPx <= maxPx) km = s;
  return { km, px: km / kmPerPx };
}
