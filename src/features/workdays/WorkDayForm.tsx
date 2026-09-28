import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { DateField } from '../../components/DateField';
import { HoursStepper } from '../../components/HoursStepper';
import { inputClass } from '../../components/Field';
import { useEmployers, useWorkDays } from '../../db/hooks';
import { createWorkDay, deleteWorkDay, updateWorkDay } from '../../db/repos/workDays';
import type { WorkDay } from '../../db/types';
import { formatDate, isWithin, todayISO, type ISODate } from '../../lib/dates';
import { STATUS_LABELS, WORK_TYPE_LABELS, regionalStatus, statusCounts } from '../../lib/regional';
import { useQuickDefaults } from './useQuickDefaults';

export type FormResult = 'created' | 'updated' | 'deleted' | 'closed';

interface Props {
  /** Bestehender Eintrag zum Bearbeiten, sonst wird ein neuer angelegt. */
  workDay?: WorkDay;
  date?: ISODate;
  onDone: (result: FormResult) => void;
}

export function WorkDayForm(props: Props) {
  const employers = useEmployers();
  const defaults = useQuickDefaults();
  if (!employers || defaults.loading) return null;

  if (employers.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>Leg zuerst einen Arbeitgeber an. Danach erfasst du hier deine Tage.</p>
        <Link
          to="/arbeitgeber/neu"
          onClick={() => props.onDone('closed')}
          className="inline-flex min-h-13 items-center rounded-full bg-stamp px-6 font-medium text-on-stamp transition-opacity duration-150 hover:opacity-85"
        >
          Arbeitgeber anlegen
        </Link>
      </div>
    );
  }

  return (
    <LoadedForm
      {...props}
      initial={{
        date: props.workDay?.date ?? props.date ?? todayISO(),
        employerId: props.workDay?.employerId ?? defaults.employer?.id ?? employers[0]!.id,
        hours: props.workDay?.hours ?? defaults.hours,
        note: props.workDay?.note ?? '',
      }}
    />
  );
}

interface Initial {
  date: ISODate;
  employerId: string;
  hours: number;
  note: string;
}

function LoadedForm({ workDay, onDone, initial }: Props & { initial: Initial }) {
  const employers = useEmployers() ?? [];
  const workDays = useWorkDays() ?? [];
  const [date, setDate] = useState(initial.date);
  const [employerId, setEmployerId] = useState(initial.employerId);
  const [hours, setHours] = useState(initial.hours);
  const [note, setNote] = useState(initial.note);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const employer = employers.find((e) => e.id === employerId);
  const status = employer ? regionalStatus(employer.postcode, employer.workType) : null;
  const duplicate = workDays.find((d) => d.date === date && d.employerId === employerId && d.id !== workDay?.id);
  const outsidePeriod = employer && !isWithin(date, employer.startDate, employer.endDate);
  const inFuture = date > todayISO();

  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const input = { date, employerId, hours, note };
    if (workDay) await updateWorkDay(workDay.id, input);
    else await createWorkDay(input);
    onDone(workDay ? 'updated' : 'created');
  }

  async function remove() {
    if (!workDay) return;
    await deleteWorkDay(workDay.id);
    onDone('deleted');
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 font-semibold">Arbeitgeber</legend>
        {employers.map((e) => (
          <label
            key={e.id}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-line px-4 transition-colors duration-150 hover:border-ink/40 has-checked:border-stamp has-checked:bg-stamp-wash"
          >
            <input
              type="radio"
              name="employer"
              value={e.id}
              checked={e.id === employerId}
              onChange={() => setEmployerId(e.id)}
              className="size-5 shrink-0 accent-[var(--stamp)]"
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold">{e.name}</span>
              <span className="truncate text-small text-muted">
                {WORK_TYPE_LABELS[e.workType]}, {e.postcode}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <DateField label="Datum" value={date} onChange={setDate} shortcuts />
      <HoursStepper value={hours} onChange={setHours} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="workday-note" className="font-semibold">
          Notiz (optional)
        </label>
        <input id="workday-note" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Block C, Regen ab Mittag" />
      </div>

      <div className="flex flex-col gap-2" aria-live="polite">
        {status && !statusCounts(status) && (
          <Banner tone="warn" role="alert">
            <p className="font-semibold">Dieser Tag zählt nicht für dein Visum</p>
            <p className="text-small">
              {employer?.name} ist als „{STATUS_LABELS[status]}“ eingestuft (PLZ {employer?.postcode}). Du kannst den Tag
              trotzdem speichern, z. B. für deine Lohnübersicht.
            </p>
          </Banner>
        )}
        {outsidePeriod && employer && (
          <Banner tone="warn">
            <p className="text-small">
              Der {formatDate(date)} liegt außerhalb deiner Beschäftigung bei {employer.name} (
              {formatDate(employer.startDate)}
              {employer.endDate ? ` bis ${formatDate(employer.endDate)}` : ' bis heute'}).
            </p>
          </Banner>
        )}
        {duplicate && (
          <Banner tone="info">
            <p className="text-small">
              Für diesen Tag gibt es schon einen Eintrag bei {employer?.name}. Der Tag zählt trotzdem nur einmal.
            </p>
          </Banner>
        )}
        {inFuture && (
          <Banner tone="info">
            <p className="text-small">Das Datum liegt in der Zukunft.</p>
          </Banner>
        )}
      </div>

      <Button type="submit" block disabled={saving}>
        {workDay ? 'Änderungen speichern' : 'Tag speichern'}
      </Button>

      {workDay &&
        (confirmDelete ? (
          <div className="flex flex-col gap-2">
            <Button variant="danger" block onClick={remove}>
              Ja, Tag löschen
            </Button>
            <Button variant="secondary" block onClick={() => setConfirmDelete(false)}>
              Behalten
            </Button>
          </div>
        ) : (
          <Button variant="quiet-danger" block onClick={() => setConfirmDelete(true)}>
            Tag löschen
          </Button>
        ))}
    </form>
  );
}
