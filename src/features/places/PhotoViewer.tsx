import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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

  // Wischen am Handy: waagerecht blättern, ein Stück nach unten schließt
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && photos.length > 1) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx)) onIndex(null);
  };

  const round =
    'flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors duration-150 hover:bg-white/20 active:bg-white/25';
  const icon = (d: string) => (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );

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
        <div className="relative flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <button type="button" className={round} onClick={() => onIndex(null)} aria-label="Schließen">
              {icon('M6 6l12 12M18 6 6 18')}
            </button>
            <span className="rounded-full bg-white/10 px-3 py-1 text-small tabular-nums">
              {index! + 1} / {photos.length}
            </span>
            {confirm ? (
              <button
                type="button"
                className="min-h-12 rounded-full bg-redpen px-5 font-medium text-white"
                onClick={async () => {
                  const remaining = photos.length - 1;
                  await deletePhoto(photo.id);
                  onIndex(remaining === 0 ? null : Math.min(index!, remaining - 1));
                }}
              >
                Wirklich löschen
              </button>
            ) : (
              <button type="button" className={round} onClick={() => setConfirm(true)} aria-label="Foto löschen">
                {icon('M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3')}
              </button>
            )}
          </div>
          <div
            className="flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2 pb-4 select-none"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (swipe.current = null)}
          >
            {url && (
              <img
                key={photo.id}
                src={url}
                alt={`Foto ${index! + 1} von ${placeName}`}
                draggable={false}
                className="rise-in max-h-full max-w-full rounded-lg object-contain"
              />
            )}
          </div>
          {photos.length > 1 && (
            <>
              <button type="button" className={`${round} absolute top-1/2 left-3 hidden -translate-y-1/2 sm:flex`} onClick={() => go(-1)} aria-label="Voriges Foto">
                {icon('M15 5l-7 7 7 7')}
              </button>
              <button type="button" className={`${round} absolute top-1/2 right-3 hidden -translate-y-1/2 sm:flex`} onClick={() => go(1)} aria-label="Nächstes Foto">
                {icon('M9 5l7 7-7 7')}
              </button>
              <p className="pb-3 text-center text-small text-white/50 sm:hidden">Wischen zum Blättern</p>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
