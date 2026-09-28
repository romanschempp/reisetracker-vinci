import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const ICONS = {
  tally: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M6 4v16M10 4v16M14 4v16M18 4v16M3 16 21 8" />
    </svg>
  ),
  days: (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  employer: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M3 20V10l9-6 9 6v10M3 20h18M9 20v-6h6v6" />
    </svg>
  ),
  places: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
};

const ITEMS = [
  { to: '/', label: 'Übersicht', icon: ICONS.tally, end: true },
  { to: '/tage', label: 'Tage', icon: ICONS.days, end: false },
  { to: '/arbeitgeber', label: 'Arbeitgeber', icon: ICONS.employer, end: false },
  { to: '/orte', label: 'Orte', icon: ICONS.places, end: false },
  { to: '/mehr', label: 'Mehr', icon: ICONS.more, end: false },
];

/** Schwebende Leiste aus dunklem Rauchglas am Handy – bleibt in beiden Themes dunkel. */
export function BottomNav() {
  return (
    <nav
      aria-label="Hauptbereiche"
      className="fixed inset-x-0 bottom-0 z-10 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-5 rounded-full bg-night/75 px-1.5 shadow-[0_12px_32px_rgb(40_6_0/0.28)] ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex items-center">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex h-13 w-full flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] tracking-wide transition-colors duration-150 ${
                  isActive ? 'bg-white/12 font-medium text-white' : 'text-white/55 active:text-white'
                }`
              }
            >
              <span className="size-5.5" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Am Laptop: dasselbe Rauchglas als Seitenleiste links, mit Name und Widmung. */
export function SideNav({ action }: { action?: ReactNode }) {
  return (
    <aside className="fixed inset-y-3 left-3 z-10 hidden w-60 flex-col rounded-[1.75rem] bg-night/75 p-3 text-white ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150 lg:flex">
      <div className="flex items-center gap-3 px-3 pt-3 pb-8">
        <span className="flex size-9 items-center justify-center rounded-full bg-hivis text-on-hivis" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" {...s} strokeWidth={2}>
            <path d="M7 5v14M11 5v14M15 5v14M4 15l15-6" />
          </svg>
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-medium tracking-tight">Cockpit</span>
          <span className="text-[0.75rem] text-white/45">Work &amp; Travel</span>
        </span>
      </div>
      <nav aria-label="Hauptbereiche">
        <ul className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-full px-3.5 transition-colors duration-150 ${
                    isActive ? 'bg-white/12 font-medium text-white' : 'text-white/60 hover:bg-white/6 hover:text-white'
                  }`
                }
              >
                <span className="size-5" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-4">
        {action}
        <p className="px-3 pb-2 text-[0.75rem] leading-snug text-white/45">Von Roman, für Vincent</p>
      </div>
    </aside>
  );
}
