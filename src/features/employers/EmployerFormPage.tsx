import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { DateField } from '../../components/DateField';
import { Field, inputClass } from '../../components/Field';
import { PageHeader } from '../../components/PageHeader';
import { Sheet } from '../../components/Sheet';
import { useEmployer, useWorkDays } from '../../db/hooks';
import { createEmployer, deleteEmployer, updateEmployer } from '../../db/repos/employers';
import { WORK_TYPES } from '../../db/types';
import { formatAbn, isValidAbn, normalizeAbn } from '../../lib/abn';
import { plural } from '../../lib/format';
import { WORK_TYPE_LABELS, isValidPostcode, regionalStatus } from '../../lib/regional';
import {
  emptyEmployerForm,
  employerToForm,
  validateEmployerForm,
  type EmployerFormErrors,
  type EmployerFormValues,
} from './employerForm';
import { RegionalStatusLabel } from './RegionalStatusLabel';

export function EmployerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useEmployer(id);
  const workDays = useWorkDays();
  const [values, setValues] = useState<EmployerFormValues>(emptyEmployerForm);
  const [errors, setErrors] = useState<EmployerFormErrors>({});
  const [loadedId, setLoadedId] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Beim Bearbeiten einmalig mit den gespeicherten Werten füllen
  useEffect(() => {
    if (existing && existing.id !== loadedId) {
      setValues(employerToForm(existing));
      setLoadedId(existing.id);
    }
  }, [existing, loadedId]);

  const set = <K extends keyof EmployerFormValues>(key: K, value: EmployerFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const isEdit = Boolean(id);
  if (isEdit && existing === undefined && loadedId === undefined) return null;

  const dayCount = new Set(workDays?.filter((d) => d.employerId === id).map((d) => d.date)).size;
  const abnDigits = normalizeAbn(values.abn);
  const status = isValidPostcode(values.postcode) ? regionalStatus(values.postcode, values.workType) : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    const result = validateEmployerForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (id) await updateEmployer(id, result.input);
    else await createEmployer(result.input);
    navigate('/arbeitgeber');
  }

  async function remove() {
    if (!id) return;
    await deleteEmployer(id);
    navigate('/arbeitgeber', { replace: true });
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Arbeitgeber bearbeiten' : 'Neuer Arbeitgeber'}
        action={
          <Link to="/arbeitgeber" className="inline-flex min-h-12 items-center rounded-full px-1 font-medium underline decoration-1 underline-offset-4 hover:decoration-2">
            Abbrechen
          </Link>
        }
      />

      <form onSubmit={save} noValidate className="flex max-w-xl flex-col gap-5">
        <Field label="Name" error={errors.name}>
          {(p) => (
            <input {...p} className={inputClass} value={values.name} onChange={(e) => set('name', e.target.value)} autoComplete="organization" />
          )}
        </Field>

        <Field
          label="ABN"
          error={errors.abn}
          hint={
            abnDigits.length === 11 && isValidAbn(abnDigits)
              ? `Gültige ABN: ${formatAbn(abnDigits)}`
              : 'Steht auf deinem Payslip. Kannst du auch später nachtragen.'
          }
        >
          {(p) => (
            <input {...p} className={inputClass} inputMode="numeric" value={values.abn} onChange={(e) => set('abn', e.target.value)} placeholder="51 824 753 556" />
          )}
        </Field>

        <Field label="Art der Arbeit">
          {(p) => (
            <select {...p} className={inputClass} value={values.workType} onChange={(e) => set('workType', e.target.value as EmployerFormValues['workType'])}>
              {WORK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WORK_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <div className="grid grid-cols-[1fr_7.5rem] gap-3">
          <Field label="Ort" error={errors.location}>
            {(p) => <input {...p} className={inputClass} value={values.location} onChange={(e) => set('location', e.target.value)} />}
          </Field>
          <Field label="PLZ" error={errors.postcode}>
            {(p) => (
              <input
                {...p}
                className={inputClass}
                inputMode="numeric"
                maxLength={4}
                value={values.postcode}
                onChange={(e) => set('postcode', e.target.value.replace(/\D/g, ''))}
              />
            )}
          </Field>
        </div>

        {status && (
          <div aria-live="polite">
            {status === 'regional' && (
              <Banner tone="ok">
                <RegionalStatusLabel status={status} />
                <p className="text-small">Tage hier zählen für dein Second-Year-Visum.</p>
              </Banner>
            )}
            {status === 'not-regional' && (
              <Banner tone="warn">
                <RegionalStatusLabel status={status} />
                <p className="text-small">
                  {values.postcode} steht nicht auf der Liste für {WORK_TYPE_LABELS[values.workType]}. Tage hier zählen nicht.
                </p>
              </Banner>
            )}
            {status === 'not-specified' && (
              <Banner tone="warn">
                <RegionalStatusLabel status={status} />
                <p className="text-small">Diese Arbeit zählt nicht als specified work. Du kannst die Tage trotzdem erfassen.</p>
              </Banner>
            )}
            {status === 'unchecked' && (
              <Banner tone="info">
                <RegionalStatusLabel status={status} />
                <p className="text-small">Die Postleitzahlenliste ist noch leer. Die Tage zählen vorläufig mit.</p>
              </Banner>
            )}
          </div>
        )}

        <Field label="Stundenlohn (AUD)" error={errors.hourlyRate} hint="Brutto pro Stunde, wie im Vertrag.">
          {(p) => (
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">$</span>
              <input {...p} className={`${inputClass} pl-8`} inputMode="decimal" value={values.hourlyRate} onChange={(e) => set('hourlyRate', e.target.value)} placeholder="30.50" />
            </div>
          )}
        </Field>

        <DateField label="Erster Arbeitstag" value={values.startDate} onChange={(v) => set('startDate', v)} />
        {errors.startDate && <p className="-mt-3 text-small font-semibold text-redpen">{errors.startDate}</p>}

        <DateField
          label="Letzter Arbeitstag (optional)"
          value={values.endDate}
          onChange={(v) => set('endDate', v)}
          optional
          onClear={() => set('endDate', '')}
        />
        {errors.endDate && <p className="-mt-3 text-small font-semibold text-redpen">{errors.endDate}</p>}

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 has-checked:border-stamp">
          <input
            type="checkbox"
            checked={values.fullTime}
            onChange={(e) => set('fullTime', e.target.checked)}
            className="mt-1 size-6 shrink-0 accent-[var(--stamp)]"
          />
          <span>
            <span className="block font-semibold">Vollzeit</span>
            <span className="block text-small text-muted">
              Arbeitest du hier in einer Woche an mindestens 5 Tagen, zählt die ganze Woche inklusive Wochenende als 7
              Tage. Prüf auf immi.homeaffairs.gov.au, ob das für deinen Job gilt.
            </span>
          </span>
        </label>

        <Button type="submit" block>
          {isEdit ? 'Änderungen speichern' : 'Arbeitgeber speichern'}
        </Button>

        {isEdit && (
          <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
            Arbeitgeber löschen
          </Button>
        )}
      </form>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Arbeitgeber löschen?">
        <div className="flex flex-col gap-4">
          <p>
            {dayCount > 0
              ? `${values.name} und ${plural(dayCount, 'erfasster Tag', 'erfasste Tage')} werden gelöscht. Das zieht sie von deinem Fortschritt ab.`
              : `${values.name} wird gelöscht.`}
          </p>
          <Button variant="danger" block onClick={remove}>
            Endgültig löschen
          </Button>
          <Button variant="secondary" block onClick={() => setConfirmDelete(false)}>
            Behalten
          </Button>
        </div>
      </Sheet>
    </>
  );
}
