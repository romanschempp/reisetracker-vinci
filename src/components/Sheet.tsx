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
      className="sheet fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-paper p-0 text-ink"
    >
      <div className="mx-auto max-w-xl px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-sign text-title font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-12 px-2 font-bold text-stamp">
            Schließen
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
