import type { BackupData, BackupFile, SerializedPhoto } from '../../lib/backup';
import { base64ToBlob, blobToBase64 } from '../../lib/base64';
import { db } from '../schema';
import type { Photo } from '../types';
import { getSettings } from './settings';

async function serializePhoto({ blob, thumb, ...rest }: Photo): Promise<SerializedPhoto> {
  return { ...rest, type: blob.type || 'image/jpeg', data: await blobToBase64(blob), thumbData: await blobToBase64(thumb) };
}

function deserializePhoto({ type, data, thumbData, ...rest }: SerializedPhoto): Photo {
  return { ...rest, blob: base64ToBlob(data, type), thumb: base64ToBlob(thumbData, type) };
}

/** Alles, inklusive als gelöscht markierter Einträge – das Backup ist ein vollständiges Abbild. */
export async function readAllData(): Promise<BackupData> {
  const [employers, workDays, places, photos, settings] = await Promise.all([
    db.employers.toArray(),
    db.workDays.toArray(),
    db.places.toArray(),
    db.photos.toArray(),
    getSettings(),
  ]);
  const serialized: SerializedPhoto[] = [];
  for (const p of photos) serialized.push(await serializePhoto(p));
  return { employers, workDays, places, photos: serialized, settings };
}

/** Ersetzt alle Daten atomar: Schlägt etwas fehl, bleibt der alte Stand erhalten. */
export async function replaceAllData(file: BackupFile): Promise<void> {
  // Umwandeln vor der Transaktion – IndexedDB-Transaktionen dürfen nicht auf andere Promises warten.
  const photos = file.photos.map(deserializePhoto);
  await db.transaction('rw', [db.employers, db.workDays, db.meta, db.places, db.photos], async () => {
    await Promise.all([db.employers.clear(), db.workDays.clear(), db.meta.clear(), db.places.clear(), db.photos.clear()]);
    await db.employers.bulkAdd(file.employers);
    await db.workDays.bulkAdd(file.workDays);
    await db.places.bulkAdd(file.places);
    await db.photos.bulkAdd(photos);
    await db.meta.put(file.settings);
  });
}
