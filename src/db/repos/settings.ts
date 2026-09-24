import { db } from '../schema';
import { DEFAULT_SETTINGS, type Settings } from '../types';

export async function getSettings(): Promise<Settings> {
  return (await db.meta.get('settings')) ?? DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Omit<Settings, 'key'>>): Promise<void> {
  const current = await getSettings();
  await db.meta.put({ ...current, ...patch, key: 'settings' });
}
