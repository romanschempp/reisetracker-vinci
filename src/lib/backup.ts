import { z } from 'zod';
import { WORK_TYPES, type Employer, type Place, type Settings, type WorkDay } from '../db/types';
import { isISODate } from './dates';

export const BACKUP_APP_ID = 'work-travel-cockpit';
/** Erhöhen, wenn sich das Format ändert – und unten eine Migration ergänzen. */
export const BACKUP_SCHEMA_VERSION = 2; // v2: Orte und Fotos

const isoDate = z.string().refine(isISODate, 'Datum muss YYYY-MM-DD sein');
const timestamp = z.string().min(1);

const base = {
  id: z.string().min(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.optional(),
};

const employerSchema = z.object({
  ...base,
  name: z.string(),
  abn: z.string(),
  location: z.string(),
  postcode: z.string(),
  workType: z.enum(WORK_TYPES),
  hourlyRateCents: z.number().int().nonnegative(),
  startDate: isoDate,
  endDate: isoDate.optional(),
  fullTime: z.boolean(),
});

const workDaySchema = z.object({
  ...base,
  date: isoDate,
  employerId: z.string().min(1),
  hours: z.number().positive().max(24),
  note: z.string().optional(),
});

const placeSchema = z.object({
  ...base,
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  arrivalDate: isoDate,
  departureDate: isoDate.optional(),
  note: z.string().optional(),
});

/** Fotos stehen als Base64 im Backup, damit eine einzige Datei alles enthält. */
const photoSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  type: z.string(),
  data: z.string(),
  thumbData: z.string(),
});

export type SerializedPhoto = z.infer<typeof photoSchema>;

const settingsSchema = z.object({
  key: z.literal('settings'),
  targetDays: z.number().int().positive(),
  lastBackupAt: timestamp.optional(),
});

const backupSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  // Backups aus v1 haben noch keine Orte/Fotos – sie werden als leer übernommen.
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  exportedAt: timestamp,
  employers: z.array(employerSchema),
  workDays: z.array(workDaySchema),
  places: z.array(placeSchema).default([]),
  photos: z.array(photoSchema).default([]),
  settings: settingsSchema,
});

export interface BackupData {
  employers: Employer[];
  workDays: WorkDay[];
  places: Place[];
  photos: SerializedPhoto[];
  settings: Settings;
}

export type BackupFile = z.infer<typeof backupSchema>;

export function buildBackup(data: BackupData, now: Date = new Date()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    employers: data.employers,
    workDays: data.workDays,
    places: data.places,
    photos: data.photos,
    settings: data.settings,
  };
}

export function backupFileName(now: Date = new Date()): string {
  const d = now.toISOString().slice(0, 10);
  return `cockpit-backup-${d}.json`;
}

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

/** Prüft eine Backup-Datei vollständig, bevor irgendetwas überschrieben wird. */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON. Wähle eine Backup-Datei dieser App.' };
  }

  if (typeof json !== 'object' || json === null || (json as { app?: unknown }).app !== BACKUP_APP_ID) {
    return { ok: false, error: 'Das ist keine Backup-Datei des Work & Travel Cockpits.' };
  }
  const version = (json as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version === 'number' && version > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Das Backup stammt aus einer neueren App-Version (Format ${version}). Aktualisiere die App und versuch es erneut.`,
    };
  }

  const result = backupSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.join(' › ') || 'Datei';
    return { ok: false, error: `Das Backup ist beschädigt (${where}: ${issue?.message}). Es wurde nichts geändert.` };
  }

  // Jeder Arbeitstag muss auf einen Arbeitgeber im Backup zeigen.
  const ids = new Set(result.data.employers.map((e) => e.id));
  const orphan = result.data.workDays.find((d) => !ids.has(d.employerId));
  if (orphan) {
    return { ok: false, error: `Arbeitstag vom ${orphan.date} gehört zu keinem Arbeitgeber im Backup. Es wurde nichts geändert.` };
  }

  const placeIds = new Set(result.data.places.map((p) => p.id));
  const lostPhoto = result.data.photos.find((p) => !placeIds.has(p.placeId));
  if (lostPhoto) {
    return { ok: false, error: 'Ein Foto im Backup gehört zu keinem Ort. Es wurde nichts geändert.' };
  }

  return { ok: true, data: { ...result.data, schemaVersion: BACKUP_SCHEMA_VERSION } };
}
