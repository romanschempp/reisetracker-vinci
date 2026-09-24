import type { EmployerInput } from '../../db/repos/employers';
import type { Employer, WorkType } from '../../db/types';
import { isValidAbn, normalizeAbn } from '../../lib/abn';
import { todayISO } from '../../lib/dates';
import { centsToInput, parseMoneyToCents } from '../../lib/format';
import { isValidPostcode } from '../../lib/regional';

export interface EmployerFormValues {
  name: string;
  abn: string;
  location: string;
  postcode: string;
  workType: WorkType;
  hourlyRate: string;
  startDate: string;
  endDate: string;
  fullTime: boolean;
}

export type EmployerFormErrors = Partial<Record<keyof EmployerFormValues, string>>;

export function emptyEmployerForm(): EmployerFormValues {
  return {
    name: '',
    abn: '',
    location: '',
    postcode: '',
    workType: 'fruit-picking',
    hourlyRate: '',
    startDate: todayISO(),
    endDate: '',
    fullTime: false,
  };
}

export function employerToForm(e: Employer): EmployerFormValues {
  return {
    name: e.name,
    abn: e.abn,
    location: e.location,
    postcode: e.postcode,
    workType: e.workType,
    hourlyRate: centsToInput(e.hourlyRateCents),
    startDate: e.startDate,
    endDate: e.endDate ?? '',
    fullTime: e.fullTime,
  };
}

export function validateEmployerForm(
  v: EmployerFormValues,
): { ok: true; input: EmployerInput } | { ok: false; errors: EmployerFormErrors } {
  const errors: EmployerFormErrors = {};
  const abn = normalizeAbn(v.abn);
  const cents = parseMoneyToCents(v.hourlyRate);

  if (!v.name.trim()) errors.name = 'Gib einen Namen ein, z. B. wie er auf dem Payslip steht.';
  if (abn && !isValidAbn(abn)) errors.abn = 'Diese ABN ist ungültig. Prüf die 11 Ziffern auf Tippfehler.';
  if (!isValidPostcode(v.postcode)) errors.postcode = 'Die Postleitzahl hat 4 Ziffern.';
  if (cents === null) errors.hourlyRate = 'Gib den Stundenlohn als Betrag ein, z. B. 30.50.';
  if (!v.startDate) errors.startDate = 'Wähle das Startdatum.';
  if (v.endDate && v.endDate < v.startDate) errors.endDate = 'Das Enddatum liegt vor dem Startdatum.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    input: {
      name: v.name.trim(),
      abn,
      location: v.location.trim(),
      postcode: v.postcode,
      workType: v.workType,
      hourlyRateCents: cents!,
      startDate: v.startDate,
      ...(v.endDate ? { endDate: v.endDate } : {}),
      fullTime: v.fullTime,
    },
  };
}
