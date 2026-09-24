import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysBetween,
  formatDate,
  addMonths,
  formatDateRelative,
  monthGrid,
  monthLabel,
  monthOf,
  isISODate,
  startOfWeek,
  todayISO,
  weekdayIndex,
} from './dates';

describe('dates', () => {
  it('erkennt gültige und ungültige Daten', () => {
    expect(isISODate('2026-11-03')).toBe(true);
    expect(isISODate('2028-02-29')).toBe(true);
    expect(isISODate('2026-02-29')).toBe(false);
    expect(isISODate('03.11.2026')).toBe(false);
  });

  it('rechnet über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30);
  });

  it('ist unabhängig von Sommerzeitumstellungen (DE und AU)', () => {
    // Europa stellt am 25.10.2026 um, Sydney am 04.10.2026.
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-10-03', 2)).toBe('2026-10-05');
  });

  it('beginnt die Woche am Montag', () => {
    expect(weekdayIndex('2026-11-02')).toBe(0); // Montag
    expect(weekdayIndex('2026-11-08')).toBe(6); // Sonntag
    expect(startOfWeek('2026-11-08')).toBe('2026-11-02');
  });

  it('formatiert als TT.MM.JJJJ', () => {
    expect(formatDate('2026-11-03')).toBe('03.11.2026');
    expect(formatDateRelative('2026-11-03', '2026-11-03')).toBe('Heute, 03.11.2026');
    expect(formatDateRelative('2026-11-02', '2026-11-03')).toBe('Gestern, 02.11.2026');
    expect(formatDateRelative('2026-10-30', '2026-11-03')).toBe('Fr, 30.10.2026');
  });

  it('nimmt für heute das lokale Datum, nicht UTC', () => {
    // 23:30 Ortszeit darf nicht zum nächsten oder vorigen UTC-Tag springen.
    expect(todayISO(new Date(2026, 10, 3, 23, 30))).toBe('2026-11-03');
    expect(todayISO(new Date(2026, 10, 3, 0, 15))).toBe('2026-11-03');
  });
});

describe('Monate', () => {
  it('blättert über Jahresgrenzen', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2027-01', -1)).toBe('2026-12');
    expect(addMonths('2026-09', -12)).toBe('2025-09');
  });

  it('beschriftet Monate auf Deutsch', () => {
    expect(monthLabel('2026-03')).toBe('März 2026');
    expect(monthLabel('2026-11-03')).toBe('November 2026');
    expect(monthOf('2026-11-03')).toBe('2026-11');
  });

  it('baut das Kalenderraster ab Montag', () => {
    // 01.09.2026 ist ein Dienstag → ein leeres Feld davor
    const grid = monthGrid('2026-09');
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBe('2026-09-01');
    expect(grid.filter(Boolean)).toHaveLength(30);
    expect(grid.at(-1)).toBe('2026-09-30');
    // Februar im Schaltjahr
    expect(monthGrid('2028-02').filter(Boolean)).toHaveLength(29);
  });
});
