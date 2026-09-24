import { useState } from 'react';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { plural } from '../../lib/format';
import { exportBackup } from '../backup/backupActions';

export const BACKUP_REMIND_AFTER_DAYS = 7;

/** Erscheint, wenn das letzte Backup länger als eine Woche her ist. */
export function BackupReminder({ lastBackupAt }: { lastBackupAt?: string }) {
  const [busy, setBusy] = useState(false);
  const daysAgo = lastBackupAt ? Math.floor((Date.now() - Date.parse(lastBackupAt)) / 86_400_000) : null;
  if (daysAgo !== null && daysAgo < BACKUP_REMIND_AFTER_DAYS) return null;

  return (
    <Banner tone="warn">
      <p className="font-bold">
        {daysAgo === null ? 'Du hast noch kein Backup gemacht' : `Letztes Backup vor ${plural(daysAgo, 'Tag', 'Tagen')}`}
      </p>
      <p className="mb-3 text-small">
        Deine Daten liegen nur auf diesem Handy. Sichere sie in iCloud Drive, Google Drive oder per Mail.
      </p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await exportBackup();
          } finally {
            setBusy(false);
          }
        }}
      >
        Backup sichern
      </Button>
    </Banner>
  );
}
