import { useId } from 'react';
import { addDays, formatDateRelative, todayISO, type ISODate } from '../lib/dates';

interface Props {
  label: string;
  value: ISODate;
  onChange: (value: ISODate) => void;
  /** Schnellwahl „Heute“/„Gestern“ anzeigen */
  shortcuts?: boolean;
  optional?: boolean;
  onClear?: () => void;
}

/**
 * Zeigt das Datum immer als TT.MM.JJJJ. Darüber liegt unsichtbar der
 * native Datumswähler des Handys.
 */
export function DateField({ label, value, onChange, shortcuts = false, optional = false, onClear }: Props) {
  const id = useId();
  const today = todayISO();
  const chips: [string, ISODate][] = [
    ['Heute', today],
    ['Gestern', addDays(today, -1)],
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div className="relative flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-raised px-4 transition-colors duration-150 focus-within:border-stamp hover:border-ink/40">
        <span className={value ? '' : 'text-muted'}>{value ? formatDateRelative(value, today) : 'Kein Datum'}</span>
        <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          onClick={(e) => {
            // Chrome/Edge am Rechner öffnen den Kalender sonst nur über das (unsichtbare) Symbol.
            // Nur bei der Maus – am Handy öffnet der Tipp den Wähler ohnehin.
            if ((e.nativeEvent as PointerEvent).pointerType !== 'mouse') return;
            try {
              e.currentTarget.showPicker();
            } catch {
              // ältere Browser: Standardverhalten reicht
            }
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      {(shortcuts || (optional && value)) && (
        <div className="flex gap-2">
          {shortcuts &&
            chips.map(([text, date]) => (
              <button
                key={text}
                type="button"
                onClick={() => onChange(date)}
                aria-pressed={value === date}
                className="min-h-12 rounded-full border border-ink/40 px-5 font-medium transition-colors duration-150 hover:bg-ink/5 aria-pressed:border-stamp aria-pressed:bg-stamp aria-pressed:text-on-stamp"
              >
                {text}
              </button>
            ))}
          {optional && value && onClear && (
            <button type="button" onClick={onClear} className="min-h-12 px-2 font-medium underline decoration-1 underline-offset-4 hover:decoration-2">
              Datum entfernen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
