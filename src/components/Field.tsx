import { useId, type ReactNode } from 'react';

export const inputClass =
  'block w-full min-h-14 rounded-2xl border border-line bg-raised px-4 text-ink placeholder:text-muted/70 focus:border-stamp focus:outline-none aria-[invalid=true]:border-redpen';

interface Props {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}

/** Label, Eingabe, Hinweis und Fehler – verbunden für Screenreader. */
export function Field({ label, hint, error, children }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const describedBy = error || hint ? hintId : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {(error || hint) && (
        <p id={hintId} className={`text-small ${error ? 'text-redpen font-semibold' : 'text-muted'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
