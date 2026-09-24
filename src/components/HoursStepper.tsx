import { useEffect, useId, useState } from 'react';
import { formatHours, parseHours } from '../lib/format';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const STEP = 0.5;

/** Stunden mit großen −/+ Knöpfen, damit es auch mit Handschuhen klappt. */
export function HoursStepper({ value, onChange }: Props) {
  const id = useId();
  const [text, setText] = useState(String(value).replace('.', ','));

  useEffect(() => setText(String(value).replace('.', ',')), [value]);

  const step = (delta: number) => onChange(Math.min(24, Math.max(STEP, value + delta)));
  const stepClass =
    'size-14 shrink-0 rounded-lg border-2 border-line text-2xl font-bold active:bg-raised disabled:opacity-40';

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-bold">
        Stunden
      </label>
      <div className="flex items-center gap-2">
        <button type="button" className={stepClass} onClick={() => step(-STEP)} disabled={value <= STEP} aria-label="Eine halbe Stunde weniger">
          −
        </button>
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const h = parseHours(e.target.value);
            if (h !== null) onChange(h);
          }}
          onBlur={() => setText(String(value).replace('.', ','))}
          aria-describedby={`${id}-v`}
          className="min-h-14 w-full min-w-0 rounded-lg border-2 border-line bg-raised text-center font-sign text-title font-bold focus:border-stamp focus:outline-none"
        />
        <button type="button" className={stepClass} onClick={() => step(STEP)} disabled={value >= 24} aria-label="Eine halbe Stunde mehr">
          +
        </button>
      </div>
      <span id={`${id}-v`} className="sr-only">
        {formatHours(value)}
      </span>
    </div>
  );
}
