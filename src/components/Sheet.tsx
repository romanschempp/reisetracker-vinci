import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Bottom-Sheet auf Basis von <dialog>: Fokus bleibt drin, Escape und Tipp daneben schließen.
 * Der Inhalt bleibt beim Schließen stehen, bis das Sheet weg ist. Formulare darin
 * per `key` neu mounten, damit sie beim Öffnen frisch starten.
 */
export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[2rem] bg-paper p-0 text-ink lg:inset-0 lg:m-auto lg:max-h-[min(88dvh,54rem)] lg:w-[min(36rem,calc(100vw-4rem))] lg:rounded-[2rem] lg:shadow-[0_24px_64px_rgb(0_0_0/0.25)]"
    >
      <div className="mx-auto max-w-xl px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-7 lg:pt-7 lg:pb-7">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line lg:hidden" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-title font-normal tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ink/40 text-xl transition-colors duration-150 hover:bg-ink/5 active:bg-ink/10"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
