import { readAllData } from '../../db/repos/backup';
import { updateSettings } from '../../db/repos/settings';
import { backupFileName, buildBackup } from '../../lib/backup';

export type ExportResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Exportiert alle Daten als JSON. Auf dem Handy über das Teilen-Menü
 * (in iCloud Drive, Google Drive oder per Mail sichern), sonst als Download.
 */
export async function exportBackup(): Promise<ExportResult> {
  const data = await readAllData();
  const now = new Date();
  const json = JSON.stringify(buildBackup(data, now), null, 2);
  const file = new File([json], backupFileName(now), { type: 'application/json' });

  let result: ExportResult;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Cockpit-Backup' });
      result = 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      download(file);
      result = 'downloaded';
    }
  } else {
    download(file);
    result = 'downloaded';
  }

  await updateSettings({ lastBackupAt: now.toISOString() });
  return result;
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
