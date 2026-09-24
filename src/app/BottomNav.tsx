import { NavLink } from 'react-router';

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

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

export function BottomNav() {
  return (
    <nav
      aria-label="Hauptbereiche"
      className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-line bg-paper pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[0.8125rem] ${
                  isActive ? 'font-bold text-stamp' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-x-3 top-0 h-1 rounded-b bg-stamp" aria-hidden />}
                  <span className="size-6" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
