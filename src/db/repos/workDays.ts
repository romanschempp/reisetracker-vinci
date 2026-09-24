import { db } from '../schema';
import type { WorkDay } from '../types';
import { isAlive, newRecordFields, nowStamp } from './common';

export type WorkDayInput = Pick<WorkDay, 'date' | 'employerId' | 'hours' | 'note'>;

/** Alle Arbeitstage, neueste zuerst. */
export async function listWorkDays(): Promise<WorkDay[]> {
  const all = await db.workDays.orderBy('date').reverse().toArray();
  return all.filter(isAlive);
}

export async function createWorkDay(input: WorkDayInput): Promise<WorkDay> {
  const day: WorkDay = { ...newRecordFields(), ...clean(input) };
  await db.workDays.add(day);
  return day;
}

export async function updateWorkDay(id: string, input: WorkDayInput): Promise<void> {
  const existing = await db.workDays.get(id);
  if (!existing) throw new Error('Arbeitstag nicht gefunden');
  await db.workDays.put({ ...clean(input), id, createdAt: existing.createdAt, updatedAt: nowStamp() });
}

export async function deleteWorkDay(id: string): Promise<void> {
  const stamp = nowStamp();
  await db.workDays.update(id, { deletedAt: stamp, updatedAt: stamp });
}

/** Zuletzt angelegter Eintrag – liefert die Vorbelegung für die Schnelleingabe. */
export async function lastCreatedWorkDay(): Promise<WorkDay | undefined> {
  const all = await db.workDays.toArray();
  return all.filter(isAlive).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function clean(input: WorkDayInput): WorkDayInput {
  const note = input.note?.trim();
  return { date: input.date, employerId: input.employerId, hours: input.hours, ...(note ? { note } : {}) };
}
