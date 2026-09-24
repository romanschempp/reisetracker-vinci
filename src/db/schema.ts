import Dexie, { type EntityTable } from 'dexie';
import type { Employer, Photo, Place, Settings, WorkDay } from './types';

/**
 * Lokale Datenbank (IndexedDB).
 *
 * Schema-Änderungen: Nie eine bestehende Version ändern, sondern eine neue
 * anhängen, z. B.
 *
 *   this.version(3).stores({ documents: 'id, employerId, updatedAt' })
 *     .upgrade(tx => …);
 *
 * Dexie migriert vorhandene Daten dann automatisch.
 */
export class CockpitDB extends Dexie {
  employers!: EntityTable<Employer, 'id'>;
  workDays!: EntityTable<WorkDay, 'id'>;
  meta!: EntityTable<Settings, 'key'>;
  places!: EntityTable<Place, 'id'>;
  photos!: EntityTable<Photo, 'id'>;

  constructor(name = 'cockpit') {
    super(name);
    this.version(1).stores({
      employers: 'id, postcode, updatedAt',
      workDays: 'id, date, employerId, [employerId+date], updatedAt',
      meta: 'key',
    });
    // v2: Reise-Orte mit Fotos
    this.version(2).stores({
      places: 'id, arrivalDate, updatedAt',
      photos: 'id, placeId, updatedAt',
    });
  }
}

export const db = new CockpitDB();

/** Bittet den Browser, die Daten nicht bei Speicherknappheit zu löschen. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
