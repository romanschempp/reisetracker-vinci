import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { Sheet } from '../../components/Sheet';
import { usePhotoCounts, usePlaces } from '../../db/hooks';
import { db } from '../../db/schema';
import type { Place } from '../../db/types';
import { plural } from '../../lib/format';
import type { LatLng } from '../../lib/geo';
import { AustraliaMap } from './AustraliaMap';
import { PlaceDetail } from './PlaceDetail';
import { PlaceForm } from './PlaceForm';
import { formatStay } from './stay';
import { Thumb } from './Thumb';

type Mode = { kind: 'new'; pos?: LatLng } | { kind: 'view'; id: string } | { kind: 'edit'; id: string } | null;

function Cover({ placeId }: { placeId: string }) {
  const first = useLiveQuery(() => db.photos.where('placeId').equals(placeId).first(), [placeId]);
  if (!first) return <span className="block size-14 rounded-2xl bg-raised" aria-hidden />;
  return <Thumb blob={first.thumb} alt="" className="size-14" />;
}

export function PlacesPage() {
  const places = usePlaces();
  const counts = usePhotoCounts();
  const [mode, setMode] = useState<Mode>(null);
  const [session, setSession] = useState(0);
  // Beim Schließen den letzten Inhalt stehen lassen, bis das Sheet weg ist
  const lastMode = useRef<Mode>(null);
  if (mode) lastMode.current = mode;
  const shown = mode ?? lastMode.current;

  if (!places) return null;

  const open = (next: Mode) => {
    setSession((s) => s + 1);
    setMode(next);
  };
  const current = shown && shown.kind !== 'new' ? places.find((p) => p.id === shown.id) : undefined;
  const number = current ? places.indexOf(current) + 1 : 0;
  const title = !shown ? '' : shown.kind === 'new' ? 'Ort eintragen' : shown.kind === 'edit' ? 'Ort bearbeiten' : (current?.name ?? '');

  return (
    <>
      <PageHeader title="Orte" action={places.length > 0 && <Button onClick={() => open({ kind: 'new' })}>Ort eintragen</Button>} />

      <AustraliaMap
        places={places}
        selectedId={mode && mode.kind !== 'new' ? mode.id : undefined}
        onMapTap={(pos) => open({ kind: 'new', pos })}
        onPlaceTap={(p) => open({ kind: 'view', id: p.id })}
        label={`Karte von Australien mit ${plural(places.length, 'eingetragenem Ort', 'eingetragenen Orten')}`}
      />
      <p className="mt-2 text-small text-muted">Tipp auf die Karte, um dort einen Ort einzutragen.</p>

      {places.length === 0 ? (
        <EmptyState title="Noch keine Orte" action={<Button onClick={() => open({ kind: 'new' })}>Ersten Ort eintragen</Button>}>
          Halte fest, wo du warst, wann und mit welchen Fotos. Die Orte werden in der Reihenfolge deiner Reise nummeriert und
          auf der Karte verbunden.
        </EmptyState>
      ) : (
        <ol className="mt-6 divide-y divide-line rounded-3xl bg-raised px-5" aria-label="Deine Reise">
          {places.map((p: Place, i) => {
            const n = counts?.get(p.id) ?? 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => open({ kind: 'view', id: p.id })}
                  className="grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-3 py-3 text-left active:opacity-60"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-stamp text-base font-medium text-on-stamp tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="text-small text-muted">{formatStay(p)}</span>
                    {n > 0 && <span className="text-small text-muted">{plural(n, 'Foto', 'Fotos')}</span>}
                  </span>
                  <Cover placeId={p.id} />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <Sheet open={mode !== null} onClose={() => setMode(null)} title={title}>
        <div key={session}>
          {shown?.kind === 'new' && (
            <PlaceForm
              initialPos={shown.pos}
              places={places}
              onDone={(saved) => (saved ? open({ kind: 'view', id: saved.id }) : setMode(null))}
            />
          )}
          {shown?.kind === 'edit' && current && (
            <PlaceForm place={current} places={places} onDone={() => open({ kind: 'view', id: current.id })} />
          )}
          {shown?.kind === 'view' && current && (
            <PlaceDetail place={current} number={number} onEdit={() => open({ kind: 'edit', id: current.id })} onDeleted={() => setMode(null)} />
          )}
        </div>
      </Sheet>
    </>
  );
}
