import { useState } from 'react';
import type { WorkDay } from '../../db/types';
import {
  addMonths,
  formatDate,
  monthGrid,
  monthLabel,
  monthOf,
  todayISO,
  weekDates,
  weekdayShort,
  type ISODate,
  type ISOMonth,
} from '../../lib/dates';
import { plural } from '../../lib/format';
import { useWorkDaySheet } from '../workdays/WorkDaySheetProvider';

type Range = 'week' | 'month';

interface Props {
  workDays: WorkDay[];
  workedDates: Set<ISODate>;
  creditedDates: Set<ISODate>;
}

const RANGE_KEY = 'overview-range';
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function loadRange(): Range {
  try {
    return localStorage.getItem(RANGE_KEY) === 'month' ? 'month' : 'week';
  } catch {
    return 'week';
  }
}

/**
 * Welche Tage du gearbeitet hast: diese Woche oder ein ganzer Monat.
 * Im Monat blätterst du bis zu deinem ersten Eintrag zurück.
 * Ein Tipp auf einen Tag öffnet ihn oder erfasst ihn nachträglich.
 */
export function DaysOverview({ workDays, workedDates, creditedDates }: Props) {
  const sheet = useWorkDaySheet();
  const today = todayISO();
  const thisMonth = monthOf(today);
  const [range, setRange] = useState<Range>(loadRange);
  const [month, setMonth] = useState<ISOMonth>(thisMonth);

  // workDays ist nach Datum absteigend sortiert – der letzte ist der älteste
  const oldest = workDays.at(-1)?.date;
  const firstMonth = oldest && monthOf(oldest) < thisMonth ? monthOf(oldest) : thisMonth;

  const choose = (next: Range) => {
    setRange(next);
    setMonth(thisMonth);
    try {
      localStorage.setItem(RANGE_KEY, next);
    } catch {
      // nur Komfort – ohne Speicher startet die Ansicht wieder bei „Woche“
    }
  };

  const cell = (date: ISODate, size: 'large' | 'small') => {
    const worked = workedDates.has(date);
    const credited = creditedDates.has(date);
    const isToday = date === today;
    const entry = workDays.find((d) => d.date === date);
    const state = worked ? 'gearbeitet' : credited ? 'zählt durch Vollzeitwoche' : 'nicht erfasst';
    return (
      <button
        type="button"
        disabled={date > today}
        onClick={() => (entry ? sheet.openEdit(entry) : sheet.openNew(date))}
        aria-label={`${weekdayShort(date)}, ${formatDate(date)}: ${state}`}
        aria-current={isToday ? 'date' : undefined}
        className={`flex w-full flex-col items-center justify-center rounded-2xl border tabular-nums transition-colors duration-150 enabled:hover:border-ink/40 disabled:opacity-35 ${
          size === 'large' ? 'min-h-16 gap-1' : 'min-h-12 gap-0.5'
        } ${worked ? 'border-stamp bg-stamp text-on-stamp' : credited ? 'border-stamp text-ink' : 'border-transparent bg-paper text-ink'}`}
      >
        {size === 'large' && <span className="text-[0.75rem] leading-none opacity-70">{weekdayShort(date)}</span>}
        <span className={`font-normal leading-none ${size === 'large' ? 'text-xl' : 'text-lg'}`}>{Number(date.slice(8))}</span>
        <span className={`h-1.5 w-5 rounded-full ${isToday ? 'bg-hivis ring-1 ring-ink/25' : 'bg-transparent'}`} aria-hidden />
      </button>
    );
  };

  const grid = monthGrid(month);
  const monthDays = grid.filter((d): d is ISODate => d !== null);
  const workedInMonth = monthDays.filter((d) => workedDates.has(d)).length;
  const fullTimeInMonth = monthDays.filter((d) => creditedDates.has(d) && !workedDates.has(d)).length;

  const tab = 'min-h-11 flex-1 rounded-full px-3 font-medium transition-colors duration-150 hover:text-ink aria-pressed:bg-stamp aria-pressed:text-on-stamp';
  const arrow =
    'flex size-12 items-center justify-center rounded-full border border-ink/40 text-xl transition-colors duration-150 enabled:hover:bg-ink/5 disabled:opacity-25';

  return (
    <section aria-label="Arbeitstage im Überblick" className="flex flex-col gap-4 rounded-3xl bg-raised p-4">
      <div className="flex rounded-full bg-paper p-1 text-muted" role="group" aria-label="Zeitraum">
        <button type="button" className={tab} aria-pressed={range === 'week'} onClick={() => choose('week')}>
          Diese Woche
        </button>
        <button type="button" className={tab} aria-pressed={range === 'month'} onClick={() => choose('month')}>
          Dieser Monat
        </button>
      </div>

      {range === 'week' ? (
        <ol className="grid grid-cols-7 gap-1.5">
          {weekDates(today).map((date) => (
            <li key={date}>{cell(date, 'large')}</li>
          ))}
        </ol>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button type="button" className={arrow} onClick={() => setMonth(addMonths(month, -1))} disabled={month <= firstMonth} aria-label="Voriger Monat">
              ‹
            </button>
            <div className="text-center">
              <p className="text-2xl font-medium tracking-tight" aria-live="polite">
                {monthLabel(month)}
              </p>
              <p className="text-small text-muted">
                {plural(workedInMonth, 'Tag', 'Tage')} gearbeitet
                {fullTimeInMonth > 0 && `, ${fullTimeInMonth} aus Vollzeitwochen`}
              </p>
            </div>
            <button type="button" className={arrow} onClick={() => setMonth(addMonths(month, 1))} disabled={month >= thisMonth} aria-label="Nächster Monat">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-small text-muted" aria-hidden>
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <ol className="grid grid-cols-7 gap-1.5">
            {grid.map((date, i) => (date ? <li key={date}>{cell(date, 'small')}</li> : <li key={`leer-${i}`} aria-hidden />))}
          </ol>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-small text-muted">
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-stamp" aria-hidden /> gearbeitet
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border border-stamp" aria-hidden /> Vollzeitwoche
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-full bg-hivis ring-1 ring-ink/25" aria-hidden /> heute
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
