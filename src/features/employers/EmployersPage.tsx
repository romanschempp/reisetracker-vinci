import { useMemo } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useEmployers, useWorkDays } from '../../db/hooks';
import { formatDate } from '../../lib/dates';
import { plural } from '../../lib/format';
import { WORK_TYPE_LABELS, regionalStatus } from '../../lib/regional';
import { PostcodeListNotice } from './PostcodeListNotice';
import { RegionalStatusLabel } from './RegionalStatusLabel';

const newLinkClass =
  'inline-flex min-h-12 items-center rounded-full bg-stamp px-5 font-medium text-on-stamp transition-opacity duration-150 hover:opacity-85 active:opacity-75';

export function EmployersPage() {
  const employers = useEmployers();
  const workDays = useWorkDays();

  const daysByEmployer = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const d of workDays ?? []) {
      const set = map.get(d.employerId) ?? new Set();
      set.add(d.date);
      map.set(d.employerId, set);
    }
    return map;
  }, [workDays]);

  if (!employers) return null;

  return (
    <>
      <PageHeader
        title="Arbeitgeber"
        action={
          employers.length > 0 && (
            <Link to="/arbeitgeber/neu" className={newLinkClass}>
              Neuer Arbeitgeber
            </Link>
          )
        }
      />

      {employers.length === 0 ? (
        <EmptyState
          title="Noch kein Arbeitgeber"
          action={
            <Link to="/arbeitgeber/neu" className={newLinkClass}>
              Arbeitgeber anlegen
            </Link>
          }
        >
          Leg zuerst an, bei wem du arbeitest. Danach erfasst du deine Tage mit einem Tipp.
        </EmptyState>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <PostcodeListNotice workTypes={employers.map((e) => e.workType)} />
          <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-raised">
            {employers.map((e) => {
              const days = daysByEmployer.get(e.id)?.size ?? 0;
              return (
                <li key={e.id}>
                  <Link to={`/arbeitgeber/${e.id}`} className="flex flex-col gap-1 px-5 py-4 transition-colors duration-150 hover:bg-ink/[0.03] active:bg-ink/5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-lg font-semibold">{e.name}</span>
                      <RegionalStatusLabel status={regionalStatus(e.postcode, e.workType)} />
                    </span>
                    <span className="text-muted">
                      {WORK_TYPE_LABELS[e.workType]} in {e.location || 'unbekanntem Ort'}, {e.postcode}
                    </span>
                    <span className="text-small text-muted">
                      {plural(days, 'Tag', 'Tage')} erfasst, seit {formatDate(e.startDate)}
                      {e.endDate ? ` bis ${formatDate(e.endDate)}` : ''}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
