import { describe, expect, it } from 'vitest';
import type { Employer, Place, WorkDay } from '../db/types';
import { buildBackup, parseBackup, type SerializedPhoto } from './backup';

const stamp = '2026-11-02T08:00:00.000Z';
const employer: Employer = {
  id: 'e1',
  createdAt: stamp,
  updatedAt: stamp,
  name: 'Tomato Farm',
  abn: '51824753556',
  location: 'Bowen',
  postcode: '4805',
  workType: 'fruit-picking',
  hourlyRateCents: 3050,
  startDate: '2026-11-01',
  fullTime: true,
};
const workDay: WorkDay = { id: 'w1', createdAt: stamp, updatedAt: stamp, date: '2026-11-02', employerId: 'e1', hours: 7.5, note: 'Reihe 12' };
const place: Place = { id: 'p1', createdAt: stamp, updatedAt: stamp, name: 'Bowen', lat: -20.01, lng: 148.24, arrivalDate: '2026-11-01' };
const photo: SerializedPhoto = {
  id: 'f1',
  placeId: 'p1',
  createdAt: stamp,
  updatedAt: stamp,
  width: 1600,
  height: 1200,
  type: 'image/jpeg',
  data: 'AAEC',
  thumbData: 'AAE=',
};
const data = {
  employers: [employer],
  workDays: [workDay],
  places: [place],
  photos: [photo],
  settings: { key: 'settings' as const, targetDays: 88 },
};

describe('Backup', () => {
  it('übersteht einen Export/Import unverändert', () => {
    const text = JSON.stringify(buildBackup(data, new Date(stamp)));
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.employers).toEqual([employer]);
      expect(r.data.workDays).toEqual([workDay]);
      expect(r.data.places).toEqual([place]);
      expect(r.data.photos).toEqual([photo]);
      expect(r.data.settings.targetDays).toBe(88);
    }
  });

  it('liest alte Backups (v1) ohne Orte und Fotos', () => {
    const { places: _p, photos: _f, ...v1 } = { ...buildBackup(data), schemaVersion: 1 };
    const r = parseBackup(JSON.stringify(v1));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.places).toEqual([]);
      expect(r.data.photos).toEqual([]);
      expect(r.data.workDays).toHaveLength(1);
    }
  });

  it('lehnt Fotos ohne Ort ab', () => {
    const file = buildBackup({ ...data, photos: [{ ...photo, placeId: 'fehlt' }] });
    expect(parseBackup(JSON.stringify(file)).ok).toBe(false);
  });

  it('lehnt kaputtes JSON und fremde Dateien ab', () => {
    expect(parseBackup('{nope').ok).toBe(false);
    expect(parseBackup('{"foo":1}').ok).toBe(false);
  });

  it('lehnt Backups aus neueren Versionen ab', () => {
    const file = { ...buildBackup(data), schemaVersion: 99 };
    const r = parseBackup(JSON.stringify(file));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/neueren App-Version/);
  });

  it('lehnt ungültige Datensätze ab', () => {
    const file = buildBackup({ ...data, workDays: [{ ...workDay, date: '02.11.2026' }] });
    expect(parseBackup(JSON.stringify(file)).ok).toBe(false);
  });

  it('lehnt Arbeitstage ohne Arbeitgeber ab', () => {
    const file = buildBackup({ ...data, workDays: [{ ...workDay, employerId: 'fehlt' }] });
    expect(parseBackup(JSON.stringify(file)).ok).toBe(false);
  });
});
