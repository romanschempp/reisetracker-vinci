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
      <div className="relative flex min-h-14 items-center rounded-2xl border border-line bg-raised px-4 focus-within:border-stamp">
        <span className={value ? '' : 'text-muted'}>{value ? formatDateRelative(value, today) : 'Kein Datum'}</span>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
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
                className="min-h-12 rounded-full border border-ink/40 px-5 font-medium aria-pressed:border-stamp aria-pressed:bg-stamp aria-pressed:text-on-stamp"
              >
                {text}
              </button>
            ))}
          {optional && value && onClear && (
            <button type="button" onClick={onClear} className="min-h-12 px-2 font-medium underline underline-offset-4">
              Datum entfernen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
