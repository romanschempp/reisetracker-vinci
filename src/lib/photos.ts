/**
 * Fotos werden vor dem Speichern verkleinert: Handyfotos haben oft 3–8 MB,
 * verkleinert auf 1600 px sind es ~300 KB. So passen hunderte Fotos aufs Gerät
 * und ins Backup. Zusätzlich entsteht ein kleines Vorschaubild für Listen.
 */
export const PHOTO_MAX_EDGE = 1600;
export const THUMB_MAX_EDGE = 360;

export interface ProcessedPhoto {
  blob: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

export function fitWithin(width: number, height: number, maxEdge: number): [number, number] {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return [Math.round(width * scale), Math.round(height * scale)];
}

function render(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const [w, h] = fitWithin(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas nicht verfügbar');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Bild konnte nicht umgewandelt werden'))), 'image/jpeg', quality),
  );
}

export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  // imageOrientation: Hochkant-Fotos bleiben hochkant (EXIF-Drehung)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const [blob, thumb] = await Promise.all([render(bitmap, PHOTO_MAX_EDGE, 0.82), render(bitmap, THUMB_MAX_EDGE, 0.75)]);
    const [width, height] = fitWithin(bitmap.width, bitmap.height, PHOTO_MAX_EDGE);
    return { blob, thumb, width, height };
  } finally {
    bitmap.close();
  }
}
