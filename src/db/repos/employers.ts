import { db } from '../schema';
import type { Employer } from '../types';
import { isAlive, newRecordFields, nowStamp } from './common';

export type EmployerInput = Omit<Employer, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export async function listEmployers(): Promise<Employer[]> {
  const all = await db.employers.toArray();
  return all.filter(isAlive).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getEmployer(id: string): Promise<Employer | undefined> {
  const e = await db.employers.get(id);
  return e && isAlive(e) ? e : undefined;
}

export async function createEmployer(input: EmployerInput): Promise<Employer> {
  const employer: Employer = { ...newRecordFields(), ...input };
  await db.employers.add(employer);
  return employer;
}

export async function updateEmployer(id: string, input: EmployerInput): Promise<void> {
  const existing = await db.employers.get(id);
  if (!existing) throw new Error('Arbeitgeber nicht gefunden');
  // put statt update, damit ein geleertes Enddatum wirklich verschwindet
  await db.employers.put({ ...input, id, createdAt: existing.createdAt, updatedAt: nowStamp() });
}

/** Markiert den Arbeitgeber und alle seine Arbeitstage als gelöscht. */
export async function deleteEmployer(id: string): Promise<void> {
  const stamp = nowStamp();
  await db.transaction('rw', db.employers, db.workDays, async () => {
    await db.employers.update(id, { deletedAt: stamp, updatedAt: stamp });
    await db.workDays
      .where('employerId')
      .equals(id)
      .filter(isAlive)
      .modify({ deletedAt: stamp, updatedAt: stamp });
  });
}
