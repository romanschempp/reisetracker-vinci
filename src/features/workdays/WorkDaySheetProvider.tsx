import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Sheet } from '../../components/Sheet';
import type { WorkDay } from '../../db/types';
import type { ISODate } from '../../lib/dates';
import { WorkDayForm, type FormResult } from './WorkDayForm';

interface Api {
  openNew: (date?: ISODate) => void;
  openEdit: (workDay: WorkDay) => void;
}

const Ctx = createContext<Api | null>(null);

export function useWorkDaySheet(): Api {
  const api = useContext(Ctx);
  if (!api) throw new Error('useWorkDaySheet braucht den WorkDaySheetProvider');
  return api;
}

const MESSAGES: Partial<Record<FormResult, string>> = {
  created: 'Tag gespeichert',
  updated: 'Änderungen gespeichert',
  deleted: 'Tag gelöscht',
};

/** Ein Sheet für die ganze App: Schnelleingabe von überall, Bearbeiten aus jeder Liste. */
export function WorkDaySheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<{ workDay?: WorkDay; date?: ISODate }>({});
  const [session, setSession] = useState(0);
  const [toast, setToast] = useState<string>();
  const toastTimer = useRef<number>(undefined);

  const openNew = useCallback((date?: ISODate) => {
    setTarget({ date });
    setSession((s) => s + 1);
    setOpen(true);
  }, []);

  const openEdit = useCallback((workDay: WorkDay) => {
    setTarget({ workDay });
    setSession((s) => s + 1);
    setOpen(true);
  }, []);

  const done = (result: FormResult) => {
    setOpen(false);
    const message = MESSAGES[result];
    if (!message) return;
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(undefined), 2500);
  };

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const api = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <Sheet open={open} onClose={() => setOpen(false)} title={target.workDay ? 'Tag bearbeiten' : 'Tag erfassen'}>
        <WorkDayForm key={session} workDay={target.workDay} date={target.date} onDone={done} />
      </Sheet>
      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4"
      >
        {toast && <p className="rounded-2xl bg-ink px-5 py-3 font-semibold text-paper shadow-lg">{toast}</p>}
      </div>
    </Ctx.Provider>
  );
}
