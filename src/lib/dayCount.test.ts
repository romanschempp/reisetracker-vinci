import { describe, expect, it } from 'vitest';
import type { Employer, WorkDay } from '../db/types';
import { countDays, estimateFinish, type StatusOf } from './dayCount';

const stamp = '2026-01-01T00:00:00.000Z';

function employer(id: string, extra: Partial<Employer> = {}): Employer {
  return {
    id,
    createdAt: stamp,
    updatedAt: stamp,
    name: id,
    abn: '51824753556',
    location: 'Bowen',
    postcode: '4805',
    workType: 'fruit-picking',
    hourlyRateCents: 3000,
    startDate: '2026-10-01',
    fullTime: false,
    ...extra,
  };
}

let n = 0;
function day(date: string, employerId: string, extra: Partial<WorkDay> = {}): WorkDay {
  n++;
  return { id: `d${n}`, createdAt: stamp, updatedAt: stamp, date, employerId, hours: 8, ...extra };
}

const allRegional: StatusOf = () => 'regional';
const today = '2026-12-31';

describe('countDays', () => {
  it('zählt jeden Kalendertag nur einmal', () => {
    const employers = [employer('a'), employer('b')];
    const days = [
      day('2026-11-02', 'a'),
      day('2026-11-02', 'a', { hours: 3 }), // zweiter Eintrag am selben Tag
      day('2026-11-02', 'b'), // anderer Arbeitgeber, selber Tag
      day('2026-11-03', 'b'),
    ];
    const r = countDays(days, employers, today, allRegional);
    expect(r.worked).toBe(2);
    expect(r.credited).toBe(2);
  });

  it('ignoriert gelöschte Einträge und gelöschte Arbeitgeber', () => {
    const employers = [employer('a'), employer('gone', { deletedAt: stamp })];
    const days = [
      day('2026-11-02', 'a', { deletedAt: stamp }),
      day('2026-11-03', 'gone'),
      day('2026-11-04', 'a'),
    ];
    expect(countDays(days, employers, today, allRegional).worked).toBe(1);
  });

  it('zählt Tage bei nicht regionalen Arbeitgebern nicht mit', () => {
    const employers = [employer('farm'), employer('city', { postcode: '2000' })];
    const statusOf: StatusOf = (e) => (e.postcode === '2000' ? 'not-regional' : 'regional');
    const days = [day('2026-11-02', 'farm'), day('2026-11-03', 'city'), day('2026-11-04', 'city')];
    const r = countDays(days, employers, today, statusOf);
    expect(r.worked).toBe(1);
    expect(r.notCounted).toBe(2);
  });

  it('zählt einen Tag, der auch regional gearbeitet wurde, nicht als „nicht gezählt“', () => {
    const employers = [employer('farm'), employer('city')];
    const statusOf: StatusOf = (e) => (e.id === 'city' ? 'not-regional' : 'regional');
    const r = countDays([day('2026-11-02', 'farm'), day('2026-11-02', 'city')], employers, today, statusOf);
    expect(r.worked).toBe(1);
    expect(r.notCounted).toBe(0);
  });

  it('zählt ohne Vollzeit-Haken nur die gearbeiteten Tage', () => {
    const days = ['02', '03', '04', '05', '06'].map((d) => day(`2026-11-${d}`, 'a'));
    const r = countDays(days, [employer('a')], today, allRegional);
    expect(r.credited).toBe(5);
    expect(r.fromFullTimeWeeks).toBe(0);
  });

  it('zählt eine volle Vollzeitwoche (Mo–Fr) als 7 Tage', () => {
    const days = ['02', '03', '04', '05', '06'].map((d) => day(`2026-11-${d}`, 'a'));
    const r = countDays(days, [employer('a', { fullTime: true })], today, allRegional);
    expect(r.worked).toBe(5);
    expect(r.credited).toBe(7);
    expect(r.fromFullTimeWeeks).toBe(2);
  });

  it('füllt keine Woche mit nur 4 Arbeitstagen auf', () => {
    const days = ['02', '03', '04', '05'].map((d) => day(`2026-11-${d}`, 'a'));
    const r = countDays(days, [employer('a', { fullTime: true })], today, allRegional);
    expect(r.credited).toBe(4);
  });

  it('füllt nicht über das Ende der Beschäftigung oder über heute hinaus auf', () => {
    const days = ['02', '03', '04', '05', '06'].map((d) => day(`2026-11-${d}`, 'a'));
    const ended = employer('a', { fullTime: true, endDate: '2026-11-07' });
    expect(countDays(days, [ended], today, allRegional).credited).toBe(6);
    const running = employer('a', { fullTime: true });
    expect(countDays(days, [running], '2026-11-06', allRegional).credited).toBe(5);
  });

  it('zählt Wochenenden nicht doppelt, wenn dort auch gearbeitet wurde', () => {
    const days = ['02', '03', '04', '05', '06', '07'].map((d) => day(`2026-11-${d}`, 'a'));
    const r = countDays(days, [employer('a', { fullTime: true })], today, allRegional);
    expect(r.worked).toBe(6);
    expect(r.credited).toBe(7);
  });

  it('zählt Wochen über Monatsgrenzen korrekt', () => {
    // Mo 30.11. bis Fr 04.12.2026
    const dates = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04'];
    const r = countDays(dates.map((d) => day(d, 'a')), [employer('a', { fullTime: true })], today, allRegional);
    expect(r.credited).toBe(7);
    expect(r.creditedDates.has('2026-12-06')).toBe(true);
  });
});

describe('estimateFinish', () => {
  const dates = (list: string[]) => new Set(list);

  it('braucht mindestens 5 Tage', () => {
    expect(estimateFinish(dates(['2026-11-02', '2026-11-03']), 88, '2026-11-03')).toBeNull();
  });

  it('rechnet im bisherigen Tempo hoch', () => {
    // 10 Tage an 10 Kalendertagen → 1 Tag pro Tag → 78 Tage fehlen
    const ten = Array.from({ length: 10 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    expect(estimateFinish(dates(ten), 88, '2026-11-10')).toBe('2027-01-27');
  });

  it('meldet nichts, wenn das Ziel erreicht ist', () => {
    const five = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
    expect(estimateFinish(dates(five), 5, '2026-11-05')).toBeNull();
  });
});
