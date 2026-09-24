import { useEffect, useRef, useState } from 'react';
import { deletePhoto } from '../../db/repos/places';
import type { Photo } from '../../db/types';
import { useObjectUrl } from '../../lib/useObjectUrl';

interface Props {
  photos: Photo[];
  index: number | null;
  onIndex: (index: number | null) => void;
  placeName: string;
}

/** Vollbild-Ansicht mit Blättern und Löschen. */
export function PhotoViewer({ photos, index, onIndex, placeName }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirm, setConfirm] = useState(false);
  const photo = index !== null ? photos[index] : undefined;
  const url = useObjectUrl(photo?.blob);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (photo && !d.open) d.showModal();
    if (!photo && d.open) d.close();
  }, [photo]);

  useEffect(() => setConfirm(false), [index]);

  const go = (delta: number) => index !== null && onIndex((index + delta + photos.length) % photos.length);

  const btn = 'min-h-12 rounded-2xl px-4 font-semibold text-white active:bg-white/15 disabled:opacity-30';

  return (
    <dialog
      ref={ref}
      aria-label={`Foto von ${placeName}`}
      onCancel={(e) => {
        e.preventDefault();
        onIndex(null);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-black p-0 text-white"
    >
      {photo && (
        <div className="flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between px-2">
            <button type="button" className={btn} onClick={() => onIndex(null)}>
              Schließen
            </button>
            <span className="text-small opacity-80">
              {index! + 1} von {photos.length}
            </span>
            {confirm ? (
              <button
                type="button"
                className={`${btn} bg-redpen text-white`}
                onClick={async () => {
                  const remaining = photos.length - 1;
                  await deletePhoto(photo.id);
                  onIndex(remaining === 0 ? null : Math.min(index!, remaining - 1));
                }}
              >
                Wirklich löschen
              </button>
            ) : (
              <button type="button" className={btn} onClick={() => setConfirm(true)}>
                Löschen
              </button>
            )}
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {url && <img src={url} alt={`Foto ${index! + 1} von ${placeName}`} className="max-h-full max-w-full object-contain" />}
          </div>
          {photos.length > 1 && (
            <div className="flex justify-between px-2 pb-2">
              <button type="button" className={btn} onClick={() => go(-1)}>
                Zurück
              </button>
              <button type="button" className={btn} onClick={() => go(1)}>
                Weiter
              </button>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
