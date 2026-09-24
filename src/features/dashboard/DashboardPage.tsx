import { Link } from 'react-router';
import { Banner } from '../../components/Banner';
import { Tag } from '../../components/Tag';
import { useDayCount, useEmployers, useSettings, useWorkDays } from '../../db/hooks';
import { estimateFinish } from '../../lib/dayCount';
import { formatDate, todayISO, weekDates } from '../../lib/dates';
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
  const percent = Math.min(100, Math.round((done / target) * 100));
  const thisWeek = weekDates(today).filter((d) => count.workedDates.has(d)).length;

  return (
    <>
      <div className="flex items-center justify-between gap-3 pt-6">
        <Tag>{target}-Tage-Ziel</Tag>
        <Tag>{formatDate(today)}</Tag>
      </div>

      <section aria-labelledby="progress-heading" className="pt-8 pb-8">
        <h1 id="progress-heading" className="flex items-end gap-3">
          <span className="text-hero font-light tracking-[-0.06em]">{done}</span>
          <span className="pb-2 text-xl leading-tight text-muted">
            von {target}
            <br />
            Tagen
          </span>
        </h1>
        <p className="mt-6 text-[1.5rem] leading-[1.2] tracking-tight">
          {remaining === 0 ? 'Geschafft. Du hast alle Tage zusammen.' : `${plural(remaining, 'Tag fehlt', 'Tage fehlen')} noch.`}{' '}
          <span className="text-muted/70">
            {finish && `Im bisherigen Tempo bist du etwa am ${formatDate(finish)} fertig.`}
            {count.fromFullTimeWeeks > 0 &&
              ` Davon ${plural(count.fromFullTimeWeeks, 'Wochenendtag', 'Wochenendtage')} aus vollen Vollzeitwochen.`}
          </span>
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 rounded-3xl bg-raised p-5">
          <div className="mb-4 flex items-center justify-between">
            <Tag>Strichliste</Tag>
            <span className="text-small text-muted">ein Strich pro Tag</span>
          </div>
          <TallyBoard done={done} target={target} todayIndex={todayIndex} />
        </div>
        <div className="flex min-h-40 flex-col justify-between rounded-3xl bg-stamp p-5 text-on-stamp">
          <span className="text-[3.25rem] leading-none font-light tracking-[-0.04em]">
            {percent}
            <span className="text-2xl"> %</span>
          </span>
          <span className="text-small opacity-70">vom Ziel geschafft</span>
        </div>
        <div className="flex min-h-40 flex-col justify-between rounded-3xl bg-sage p-5">
          <span className="text-[3.25rem] leading-none font-light tracking-[-0.04em]">{thisWeek}</span>
          <span className="text-small text-muted">{thisWeek === 1 ? 'Tag' : 'Tage'} gearbeitet diese Woche</span>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <DaysOverview workDays={workDays} workedDates={count.workedDates} creditedDates={count.creditedDates} />

        {count.notCounted > 0 && (
          <Banner tone="warn">
            <p className="font-semibold">{plural(count.notCounted, 'Tag zählt', 'Tage zählen')} nicht</p>
            <p className="text-small">
              Du hast an diesen Tagen nur bei Arbeitgebern außerhalb der Region oder ohne specified work gearbeitet.{' '}
              <Link to="/arbeitgeber" className="font-semibold underline underline-offset-2">
                Arbeitgeber prüfen
              </Link>
            </p>
          </Banner>
        )}

        {offline === 'preparing' && (
          <Banner tone="info" role="status">
            <p className="font-semibold">Offline-Modus wird vorbereitet</p>
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
