import { useMemo } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useEmployers, useWorkDays } from '../../db/hooks';
import type { WorkDay } from '../../db/types';
import { formatDate, monthLabel, weekdayShort } from '../../lib/dates';
import { formatHours, plural } from '../../lib/format';
import { regionalStatus, statusCounts } from '../../lib/regional';
import { useWorkDaySheet } from './WorkDaySheetProvider';

export function WorkDaysPage() {
  const workDays = useWorkDays();
  const employers = useEmployers();
  const sheet = useWorkDaySheet();

  const employerById = useMemo(() => new Map(employers?.map((e) => [e.id, e])), [employers]);

  const months = useMemo(() => {
    const groups: { label: string; days: WorkDay[] }[] = [];
    for (const d of workDays ?? []) {
      const label = monthLabel(d.date);
      const last = groups.at(-1);
      if (last?.label === label) last.days.push(d);
      else groups.push({ label, days: [d] });
    }
    return groups;
  }, [workDays]);

  if (!workDays || !employers) return null;

  const totalHours = workDays.reduce((sum, d) => sum + d.hours, 0);
  const distinctDays = new Set(workDays.map((d) => d.date)).size;

  return (
    <>
      <PageHeader
        title="Arbeitstage"
        action={employers.length > 0 && workDays.length > 0 && <Button onClick={() => sheet.openNew()}>Tag erfassen</Button>}
      />

      {workDays.length === 0 ? (
        <EmptyState
          title="Noch keine Tage erfasst"
          action={<Button onClick={() => sheet.openNew()}>Ersten Tag erfassen</Button>}
        >
          Erfass jeden Arbeitstag am besten direkt nach der Schicht. Das dauert nur ein paar Sekunden.
        </EmptyState>
      ) : (
        <>
          <p className="max-w-3xl pb-4 text-muted">
            {plural(distinctDays, 'Tag', 'Tage')} mit {formatHours(totalHours)} erfasst.
          </p>
          {months.map((month) => (
            <section key={month.label} aria-label={month.label} className="mb-6 max-w-3xl">
              <h2 className="sticky top-0 z-[1] bg-paper/70 py-2 backdrop-blur-xl text-2xl font-medium tracking-tight">{month.label}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-raised">
                {month.days.map((d) => {
                  const employer = employerById.get(d.employerId);
                  const counts = employer ? statusCounts(regionalStatus(employer.postcode, employer.workType)) : false;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => sheet.openEdit(d)}
                        aria-label={`${formatDate(d.date)} bei ${employer?.name ?? 'unbekannt'} bearbeiten`}
                        className="grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-3 px-5 py-3 text-left transition-colors duration-150 hover:bg-ink/[0.03] active:bg-ink/5"
                      >
                        <span className="flex flex-col leading-none">
                          <span className="text-small text-muted">{weekdayShort(d.date)}</span>
                          <span className="text-2xl font-light tracking-tight tabular-nums">{d.date.slice(8)}.{d.date.slice(5, 7)}.</span>
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold">{employer?.name ?? 'Unbekannter Arbeitgeber'}</span>
                          {!counts && <span className="text-small font-semibold text-redpen">Zählt nicht</span>}
                          {d.note && <span className="truncate text-small text-muted">{d.note}</span>}
                        </span>
                        <span className="text-2xl font-light tracking-tight tabular-nums">{formatHours(d.hours)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  );
}
