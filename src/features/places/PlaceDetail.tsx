import { useState } from 'react';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { usePhotos } from '../../db/hooks';
import { addPhotos, deletePlace } from '../../db/repos/places';
import type { Place } from '../../db/types';
import { plural } from '../../lib/format';
import { formatLatLng } from '../../lib/geo';
import { PhotoPicker } from './PhotoPicker';
import { PhotoViewer } from './PhotoViewer';
import { formatStay } from './stay';
import { Thumb } from './Thumb';

interface Props {
  place: Place;
  number: number;
  onEdit: () => void;
  onDeleted: () => void;
}

export function PlaceDetail({ place, number, onEdit, onDeleted }: Props) {
  const photos = usePhotos(place.id) ?? [];
  const [viewing, setViewing] = useState<number | null>(null);
  const [adding, setAdding] = useState(0);
  const [failed, setFailed] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function add(files: File[]) {
    setAdding(files.length);
    setFailed(0);
    const r = await addPhotos(place.id, files);
    setFailed(r.failed);
    setAdding(0);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-sign text-xl font-bold text-stamp">Station {number}</p>
        <p className="text-lg font-bold">{formatStay(place)}</p>
        <p className="text-small text-muted">{formatLatLng(place)}</p>
      </div>

      {place.note && <p className="max-w-prose whitespace-pre-line">{place.note}</p>}

      <section aria-label="Fotos" className="flex flex-col gap-3">
        {photos.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.id}>
                <button type="button" onClick={() => setViewing(i)} className="block w-full" aria-label={`Foto ${i + 1} öffnen`}>
                  <Thumb blob={p.thumb} alt="" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Noch keine Fotos von diesem Ort.</p>
        )}
        <PhotoPicker onPick={add} disabled={adding > 0} label={adding ? `Speichert ${plural(adding, 'Foto', 'Fotos')} …` : 'Fotos hinzufügen'} />
        {failed > 0 && (
          <Banner tone="warn" role="alert">
            <p className="text-small">
              {plural(failed, 'Foto konnte', 'Fotos konnten')} nicht gelesen werden. Versuch es mit JPEG oder PNG.
            </p>
          </Banner>
        )}
      </section>

      <Button block onClick={onEdit}>
        Ort bearbeiten
      </Button>
      {confirmDelete ? (
        <div className="flex flex-col gap-2">
          <p>
            {place.name}
            {photos.length ? ` und ${plural(photos.length, 'Foto', 'Fotos')}` : ''} werden gelöscht.
          </p>
          <Button
            variant="danger"
            block
            onClick={async () => {
              await deletePlace(place.id);
              onDeleted();
            }}
          >
            Ja, Ort löschen
          </Button>
          <Button variant="secondary" block onClick={() => setConfirmDelete(false)}>
            Behalten
          </Button>
        </div>
      ) : (
        <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
          Ort löschen
        </Button>
      )}

      <PhotoViewer photos={photos} index={viewing} onIndex={setViewing} placeName={place.name} />
    </div>
  );
}
