import type { ISODate } from '../lib/dates';

export type { ISODate };

/**
 * Gemeinsame Felder aller Datensätze. UUIDs, updatedAt und deletedAt
 * (Einträge werden nur als gelöscht markiert) machen einen späteren Sync möglich.
 */
export interface BaseRecord {
  id: string;
  createdAt: string; // ISO-Zeitstempel
  updatedAt: string; // ISO-Zeitstempel
  deletedAt?: string; // gesetzt = gelöscht
}

export const WORK_TYPES = [
  'farm',
  'fruit-picking',
  'packing',
  'animal',
  'fishing',
  'forestry',
  'mining',
  'construction',
  'tourism',
  'disaster-recovery',
  'other',
] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export interface Employer extends BaseRecord {
  name: string;
  abn: string; // nur Ziffern, 11 Stellen
  location: string;
  postcode: string; // 4 Ziffern
  workType: WorkType;
  hourlyRateCents: number; // Geld immer in Cent, nie als Kommazahl
  startDate: ISODate;
  endDate?: ISODate;
  /** Vollzeit: volle Wochen (≥ 5 Arbeitstage Mo–So) zählen mit Wochenende als 7 Tage. */
  fullTime: boolean;
}

export interface WorkDay extends BaseRecord {
  date: ISODate;
  employerId: string;
  hours: number;
  note?: string;
}

/** Ein Ort auf deiner Reise. */
export interface Place extends BaseRecord {
  name: string;
  lat: number;
  lng: number;
  arrivalDate: ISODate;
  departureDate?: ISODate;
  note?: string;
}

/**
 * Foto zu einem Ort, verkleinert gespeichert (siehe lib/photos.ts).
 * Fotos werden beim Löschen wirklich entfernt statt nur markiert,
 * damit der Speicher auf dem Handy frei wird.
 */
export interface Photo {
  id: string;
  placeId: string;
  createdAt: string;
  updatedAt: string;
  blob: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

export interface Settings {
  key: 'settings';
  targetDays: number;
  lastBackupAt?: string;
}

export const DEFAULT_SETTINGS: Settings = { key: 'settings', targetDays: 88 };
