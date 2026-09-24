import { describe, expect, it } from 'vitest';
import type { Town } from './mapData';
import { maxRankForZoom, placeTownLabels, scaleBar } from './mapLabels';

const town = (name: string, x: number, y: number, rank = 0): Town => ({ name, x, y, rank });
const full = { x: 0, y: 0, w: 1000, h: 917 };
const px = 0.36; // 360 px breite Karte

describe('placeTownLabels', () => {
  it('zeigt kleine Orte erst beim Hineinzoomen', () => {
    expect(maxRankForZoom(1)).toBe(3);
    expect(maxRankForZoom(8)).toBe(8);
    const towns = [town('Sydney', 500, 500, 0), town('Roma', 300, 300, 7)];
    expect(placeTownLabels(towns, full, px, 1000).map((l) => l.town.name)).toEqual(['Sydney']);
    const zoomed = { x: 200, y: 200, w: 150, h: 137 };
    expect(placeTownLabels(towns, zoomed, 360 / 150, 1000).map((l) => l.town.name)).toEqual(['Roma']);
  });

  it('lässt überlappende, weniger wichtige Namen weg', () => {
    const towns = [town('Sydney', 500, 500, 0), town('Parramatta', 500, 503, 1)];
    const labels = placeTownLabels(towns, full, px, 1000);
    expect(labels.map((l) => l.town.name)).toEqual(['Sydney']);
  });

  it('setzt Namen am rechten Rand links vom Punkt', () => {
    const [label] = placeTownLabels([town('Brisbane', 985, 400)], full, px, 1000);
    expect(label?.anchor).toBe('end');
  });
});

describe('scaleBar', () => {
  it('wählt eine runde Strecke', () => {
    expect(scaleBar(4.4)).toEqual({ km: 200, px: 200 / 4.4 }); // ganz Australien auf dem Handy
    expect(scaleBar(0.1).km).toBe(5);
  });
});
