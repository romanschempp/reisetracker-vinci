import { describe, expect, it } from 'vitest';
import { MAP_HEIGHT, MAP_WIDTH, formatLatLng, inBounds, project, unproject } from './geo';

const sydney = { lat: -33.87, lng: 151.21 };
const perth = { lat: -31.95, lng: 115.86 };
const darwin = { lat: -12.46, lng: 130.84 };
const hobart = { lat: -42.88, lng: 147.33 };

describe('geo', () => {
  it('legt Australien in den Kartenausschnitt', () => {
    for (const city of [sydney, perth, darwin, hobart]) {
      const [x, y] = project(city);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(MAP_WIDTH);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(MAP_HEIGHT);
    }
  });

  it('hält die Himmelsrichtungen ein', () => {
    expect(project(sydney)[0]).toBeGreaterThan(project(perth)[0]); // Osten rechts
    expect(project(darwin)[1]).toBeLessThan(project(hobart)[1]); // Norden oben
  });

  it('rechnet Tipp-Position zurück in Koordinaten', () => {
    const [x, y] = project(sydney);
    const back = unproject(x, y);
    expect(back.lat).toBeCloseTo(sydney.lat, 6);
    expect(back.lng).toBeCloseTo(sydney.lng, 6);
  });

  it('erkennt Positionen außerhalb', () => {
    expect(inBounds(sydney)).toBe(true);
    expect(inBounds({ lat: 48.1, lng: 11.6 })).toBe(false);
  });

  it('formatiert Koordinaten', () => {
    expect(formatLatLng({ lat: -16.9186, lng: 145.7781 })).toBe('16,92° S, 145,78° O');
  });
});
