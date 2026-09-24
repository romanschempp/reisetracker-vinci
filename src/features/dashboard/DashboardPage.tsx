import { Link } from 'react-router';
import { Banner } from '../../components/Banner';
import { useDayCount, useEmployers, useSettings, useWorkDays } from '../../db/hooks';
import { estimateFinish } from '../../lib/dayCount';
import { formatDate, todayISO } from '../../lib/dates';
import { plural } from '../../lib/format';
import { useOfflineReady } from '../../lib/useOfflineReady';
import { PostcodeListNotice } from '../employers/PostcodeListNotice';
import { BackupReminder } from './BackupReminder';
import { DaysOverview } from './DaysOverview';
import { QuickEntryBar } from './QuickEntryBar';
import { TallyBoard } from './TallyBoard';

export function DashboardPage() {
  const count = useDayCount();
  const settings = useSettings();
  const employers = useEmployers();
  const workDays = useWorkDays();
  const offline = useOfflineReady();
  if (!count || !settings || !employers || !workDays) return null;

  const today = todayISO();
  const target = settings.targetDays;
  const done = count.credited;
  const remaining = Math.max(0, target - done);
  const finish = estimateFinish(count.creditedDates, target, today);
  const sorted = [...count.creditedDates].sort();
  const todayIndex = count.creditedDates.has(today) ? sorted.indexOf(today) : null;
  const hasData = workDays.length > 0 || employers.length > 0;

  return (
    <>
      <section aria-labelledby="progress-heading" className="pt-6 pb-5">
        <h1 id="progress-heading" className="font-sign font-bold">
          <span className="text-hero tracking-tight">{done}</span>
          <span className="ml-2 text-title text-muted">von {target} Tagen</span>
        </h1>
        <p className="mt-2 text-lg font-bold">
          {remaining === 0 ? 'Geschafft. Du hast alle Tage zusammen.' : `${plural(remaining, 'Tag fehlt', 'Tage fehlen')} noch.`}
        </p>
        {count.fromFullTimeWeeks > 0 && (
          <p className="text-muted">
            Davon {plural(count.fromFullTimeWeeks, 'Wochenendtag', 'Wochenendtage')} aus vollen Vollzeitwochen.
          </p>
        )}
        {finish && <p className="text-muted">Im bisherigen Tempo bist du etwa am {formatDate(finish)} fertig.</p>}
      </section>

      <TallyBoard done={done} target={target} todayIndex={todayIndex} />

      <div className="mt-8 flex flex-col gap-6">
        <DaysOverview workDays={workDays} workedDates={count.workedDates} creditedDates={count.creditedDates} />

        {count.notCounted > 0 && (
          <Banner tone="warn">
            <p className="font-bold">{plural(count.notCounted, 'Tag zählt', 'Tage zählen')} nicht</p>
            <p className="text-small">
              Du hast an diesen Tagen nur bei Arbeitgebern außerhalb der Region oder ohne specified work gearbeitet.{' '}
              <Link to="/arbeitgeber" className="font-bold underline underline-offset-2">
                Arbeitgeber prüfen
              </Link>
            </p>
          </Banner>
        )}

        {offline === 'preparing' && (
          <Banner tone="info" role="status">
            <p className="font-bold">Offline-Modus wird vorbereitet</p>
            <p className="text-small">Lass die App kurz mit Internet geöffnet. Sobald dieser Hinweis verschwindet, funktioniert sie im Flugmodus.</p>
          </Banner>
        )}

        {hasData && <BackupReminder lastBackupAt={settings.lastBackupAt} />}
        <PostcodeListNotice workTypes={employers.map((e) => e.workType)} />
      </div>

      <QuickEntryBar loggedToday={count.workedDates.has(today)} />
    </>
  );
}
