import { useRef, useState } from 'react';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { useEmployers, useSettings, useWorkDays } from '../../db/hooks';
import { replaceAllData } from '../../db/repos/backup';
import { parseBackup, type BackupFile } from '../../lib/backup';
import { formatDate } from '../../lib/dates';
import { plural } from '../../lib/format';
import { exportBackup } from './backupActions';

type Status = { tone: 'ok' | 'warn'; text: string } | null;

function countAlive(file: BackupFile) {
  return {
    employers: file.employers.filter((e) => !e.deletedAt).length,
    days: file.workDays.filter((d) => !d.deletedAt).length,
    places: file.places.filter((p) => !p.deletedAt).length,
    photos: file.photos.length,
  };
}

export function BackupSection() {
  const settings = useSettings();
  const employers = useEmployers() ?? [];
  const workDays = useWorkDays() ?? [];
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    setStatus(null);
    try {
      const result = await exportBackup();
      if (result === 'shared') setStatus({ tone: 'ok', text: 'Backup geteilt. Prüf, ob die Datei am Ziel angekommen ist.' });
      if (result === 'downloaded') setStatus({ tone: 'ok', text: 'Backup heruntergeladen.' });
    } catch {
      setStatus({ tone: 'warn', text: 'Das Backup konnte nicht erstellt werden. Versuch es noch einmal.' });
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setStatus(null);
    const result = parseBackup(await file.text());
    if (fileInput.current) fileInput.current.value = '';
    if (!result.ok) {
      setStatus({ tone: 'warn', text: result.error });
      return;
    }
    setPending(result.data);
  }

  async function confirmImport() {
    if (!pending) return;
    setBusy(true);
    try {
      await replaceAllData(pending);
      const c = countAlive(pending);
      setStatus({
        tone: 'ok',
        text: `Backup wiederhergestellt: ${plural(c.employers, 'Arbeitgeber', 'Arbeitgeber')}, ${plural(c.days, 'Arbeitstag', 'Arbeitstage')}, ${plural(c.places, 'Ort', 'Orte')}, ${plural(c.photos, 'Foto', 'Fotos')}.`,
      });
    } catch {
      setStatus({ tone: 'warn', text: 'Wiederherstellen fehlgeschlagen. Deine bisherigen Daten sind unverändert.' });
    } finally {
      setPending(null);
      setBusy(false);
    }
  }

  const incoming = pending ? countAlive(pending) : null;

  return (
    <section aria-labelledby="backup-heading" className="flex flex-col gap-3">
      <h2 id="backup-heading" className="text-2xl font-medium tracking-tight">
        Backup
      </h2>
      <p className="text-muted">
        {settings?.lastBackupAt
          ? `Letztes Backup am ${formatDate(settings.lastBackupAt.slice(0, 10))}.`
          : 'Noch kein Backup gemacht.'}{' '}
        Die Datei enthält alle Arbeitgeber, Arbeitstage, Orte und Fotos und bleibt bei dir – nichts wird hochgeladen.
      </p>
      <Button block onClick={onExport} disabled={busy}>
        Backup sichern
      </Button>
      <Button block variant="secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
        Backup wiederherstellen
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {status && (
        <div role="status">
          <Banner tone={status.tone}>
            <p className="text-small font-semibold">{status.text}</p>
          </Banner>
        </div>
      )}

      <Sheet open={pending !== null} onClose={() => setPending(null)} title="Backup wiederherstellen?">
        {pending && incoming && (
          <div className="flex flex-col gap-4">
            <p>
              Backup vom <strong>{formatDate(pending.exportedAt.slice(0, 10))}</strong> mit{' '}
              {plural(incoming.employers, 'Arbeitgeber', 'Arbeitgeber')}, {plural(incoming.days, 'Arbeitstag', 'Arbeitstagen')},{' '}
              {plural(incoming.places, 'Ort', 'Orten')} und {plural(incoming.photos, 'Foto', 'Fotos')}.
            </p>
            <Banner tone="warn">
              <p className="text-small">
                Das ersetzt alle Daten auf diesem Handy, auch Orte und Fotos ({plural(employers.length, 'Arbeitgeber', 'Arbeitgeber')},{' '}
                {plural(workDays.length, 'Arbeitstag', 'Arbeitstage')}). Sichere vorher ein Backup, wenn du unsicher bist.
              </p>
            </Banner>
            <Button block variant="danger" onClick={confirmImport} disabled={busy}>
              Daten ersetzen
            </Button>
            <Button block variant="secondary" onClick={() => setPending(null)}>
              Abbrechen
            </Button>
          </div>
        )}
      </Sheet>
    </section>
  );
}
