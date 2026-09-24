import { processPhoto } from '../../lib/photos';
import { db } from '../schema';
import type { Photo, Place } from '../types';
import { isAlive, newRecordFields, nowStamp, uuid } from './common';

export type PlaceInput = Pick<Place, 'name' | 'lat' | 'lng' | 'arrivalDate' | 'departureDate' | 'note'>;

/** Alle Orte in Reihenfolge der Reise (älteste zuerst). */
export async function listPlaces(): Promise<Place[]> {
  const all = await db.places.orderBy('arrivalDate').toArray();
  return all.filter(isAlive);
}

export async function createPlace(input: PlaceInput): Promise<Place> {
  const place: Place = { ...newRecordFields(), ...clean(input) };
  await db.places.add(place);
  return place;
}

export async function updatePlace(id: string, input: PlaceInput): Promise<void> {
  const existing = await db.places.get(id);
  if (!existing) throw new Error('Ort nicht gefunden');
  await db.places.put({ ...clean(input), id, createdAt: existing.createdAt, updatedAt: nowStamp() });
}

/** Markiert den Ort als gelöscht und entfernt seine Fotos endgültig. */
export async function deletePlace(id: string): Promise<void> {
  const stamp = nowStamp();
  await db.transaction('rw', db.places, db.photos, async () => {
    await db.places.update(id, { deletedAt: stamp, updatedAt: stamp });
    await db.photos.where('placeId').equals(id).delete();
  });
}

export async function listPhotos(placeId: string): Promise<Photo[]> {
  const photos = await db.photos.where('placeId').equals(placeId).toArray();
  return photos.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Anzahl Fotos je Ort, ohne die Bilder selbst zu laden. */
export async function photoCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await db.photos.orderBy('placeId').eachKey((key) => {
    const id = String(key);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return counts;
}

export async function addPhotos(placeId: string, files: File[]): Promise<{ added: number; failed: number }> {
  let added = 0;
  let failed = 0;
  // Nacheinander, damit das Handy bei vielen Fotos nicht den Speicher sprengt
  for (const file of files) {
    try {
      const p = await processPhoto(file);
      const now = nowStamp();
      await db.photos.add({ id: uuid(), placeId, createdAt: now, updatedAt: now, ...p });
      added++;
    } catch {
      failed++;
    }
  }
  return { added, failed };
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id);
}

function clean(input: PlaceInput): PlaceInput {
  const note = input.note?.trim();
  return {
    name: input.name.trim(),
    lat: input.lat,
    lng: input.lng,
    arrivalDate: input.arrivalDate,
    ...(input.departureDate ? { departureDate: input.departureDate } : {}),
    ...(note ? { note } : {}),
  };
}
