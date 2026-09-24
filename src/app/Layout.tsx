import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './BottomNav';

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <>
      <main className="mx-auto max-w-xl px-4 pt-[env(safe-area-inset-top)] pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
