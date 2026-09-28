import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { SideEntryButton } from '../features/dashboard/QuickEntryBar';
import { BottomNav, SideNav } from './BottomNav';

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <>
      <SideNav action={<SideEntryButton />} />
      <div className="lg:pl-63">
        <main className="mx-auto max-w-xl px-4 pt-[env(safe-area-inset-top)] pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-6 lg:max-w-6xl lg:px-10 lg:pt-4 lg:pb-16">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </>
  );
}
