import { useEffect, useState, type ReactNode } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Tag } from '../../components/Tag';
import { POSTCODE_LISTS } from '../../config/regionalPostcodes';
import { useSettings } from '../../db/hooks';
import { updateSettings } from '../../db/repos/settings';
import { formatDate } from '../../lib/dates';
import { listIsEmpty } from '../../lib/regional';
import { useOfflineReady, type OfflineState } from '../../lib/useOfflineReady';
import { getThemePref, setThemePref, type ThemePref } from '../../lib/theme';
import { BackupSection } from '../backup/BackupSection';

const TARGETS = [
  { value: 88, label: '88 Tage', hint: 'für das zweite Jahr' },
  { value: 179, label: '179 Tage', hint: 'für das dritte Jahr' },
];

const OFFLINE_TEXT: Record<OfflineState, { text: string; className: string }> = {
  checking: { text: 'Offline-Status wird geprüft …', className: 'text-muted' },
  ready: { text: 'Offline bereit: Die App startet auch ohne Internet.', className: 'text-paddock' },
  preparing: { text: 'Offline-Modus wird vorbereitet. Lass die App kurz mit Internet geöffnet.', className: 'text-redpen' },
  unsupported: {
    text: 'Offline nicht verfügbar: Öffne die App über ihre https-Adresse, nicht über den Entwicklungsserver.',
    className: 'text-redpen',
  },
};

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Wie das Handy' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-line px-4 has-checked:border-stamp has-checked:bg-stamp-wash">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-[var(--stamp)]" />
      <span>{children}</span>
    </label>
  );
}

export function SettingsPage() {
  const settings = useSettings();
  const [theme, setTheme] = useState<ThemePref>(getThemePref);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const offline = OFFLINE_TEXT[useOfflineReady()];

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(false));
  }, []);

  if (!settings) return null;

  return (
    <>
      <PageHeader title="Mehr" />
      <div className="flex flex-col gap-10">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-2xl font-medium tracking-tight">Ziel</legend>
          {TARGETS.map((t) => (
            <Choice key={t.value} name="target" checked={settings.targetDays === t.value} onChange={() => updateSettings({ targetDays: t.value })}>
              <span className="font-semibold">{t.label}</span> <span className="text-muted">{t.hint}</span>
            </Choice>
          ))}
        </fieldset>

        <BackupSection />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-2xl font-medium tracking-tight">Darstellung</legend>
          {THEMES.map((t) => (
            <Choice
              key={t.value}
              name="theme"
              checked={theme === t.value}
              onChange={() => {
                setTheme(t.value);
                setThemePref(t.value);
              }}
            >
              {t.label}
            </Choice>
          ))}
        </fieldset>

        <section aria-labelledby="postcode-heading" className="flex flex-col gap-3">
          <h2 id="postcode-heading" className="text-2xl font-medium tracking-tight">
            Postleitzahlenlisten
          </h2>
          <p className="text-muted">
            Gepflegt in <code>src/config/regionalPostcodes.ts</code>. Quelle: immi.homeaffairs.gov.au.
          </p>
          <ul className="divide-y divide-line rounded-3xl bg-raised px-5">
            {Object.values(POSTCODE_LISTS).map((list) => (
              <li key={list.label} className="py-3">
                <p className="font-semibold">{list.label}</p>
                <p className="text-small text-muted">{list.appliesTo}</p>
                <p className={`text-small font-semibold ${listIsEmpty(list) ? 'text-redpen' : 'text-paddock'}`}>
                  {listIsEmpty(list)
                    ? 'Noch leer – Prüfung nicht aktiv'
                    : `${list.postcodes.length} Einzelwerte, ${list.ranges.length} Bereiche${list.asOf ? `, Stand ${formatDate(list.asOf)}` : ''}`}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="storage-heading" className="flex flex-col gap-2">
          <h2 id="storage-heading" className="text-2xl font-medium tracking-tight">
            Speicher
          </h2>
          <p className={`font-semibold ${offline.className}`} role="status">
            {offline.text}
          </p>
          <p className="text-muted">
            {persisted
              ? 'Deine Daten sind dauerhaft auf diesem Gerät gespeichert.'
              : 'Der Browser darf deine Daten bei Platzmangel löschen. Installier die App auf dem Homescreen und mach regelmäßig Backups.'}
          </p>
        </section>

        <footer className="flex min-h-56 flex-col justify-between gap-8 rounded-3xl bg-[#141414] p-6 text-white">
          <Tag className="self-start">Für dich</Tag>
          <div>
            <p className="text-[2.5rem] leading-none font-light tracking-[-0.03em]">
              Von Roman,
              <br />
              <span className="text-white/45">für Vincent</span>
            </p>
            <p className="mt-4 text-small text-white/45">Version {__APP_VERSION__}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
