import { useState, type FormEvent } from 'react';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { DateField } from '../../components/DateField';
import { Field, inputClass } from '../../components/Field';
import { addPhotos, createPlace, updatePlace } from '../../db/repos/places';
import type { Place } from '../../db/types';
import { todayISO } from '../../lib/dates';
import { plural } from '../../lib/format';
import { formatLatLng, inBounds, type LatLng } from '../../lib/geo';
import { AustraliaMap } from './AustraliaMap';
import { PhotoPicker } from './PhotoPicker';
import { Thumb } from './Thumb';

interface Props {
  place?: Place;
  initialPos?: LatLng;
  /** Übrige Orte, damit man beim Setzen die Route sieht */
  places: Place[];
  onDone: (place: Place | null) => void;
}

type GpsState = 'idle' | 'locating' | { error: string };

const GPS_ERRORS: Record<number, string> = {
  1: 'Standortzugriff ist nicht erlaubt. Erlaub ihn in den Einstellungen deines Handys oder tipp auf die Karte.',
  2: 'Kein GPS-Signal. Geh ins Freie oder tipp auf die Karte.',
  3: 'Die Standortsuche hat zu lange gedauert. Versuch es noch einmal oder tipp auf die Karte.',
};

export function PlaceForm({ place, initialPos, places, onDone }: Props) {
  const [name, setName] = useState(place?.name ?? '');
  const [pos, setPos] = useState<LatLng | undefined>(place ? { lat: place.lat, lng: place.lng } : initialPos);
  const [arrival, setArrival] = useState(place?.arrivalDate ?? todayISO());
  const [departure, setDeparture] = useState(place?.departureDate ?? '');
  const [note, setNote] = useState(place?.note ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [gps, setGps] = useState<GpsState>('idle');
  const [errors, setErrors] = useState<{ name?: string; pos?: string; departure?: string }>({});
  const [saving, setSaving] = useState(false);

  function locate() {
    if (!navigator.geolocation) {
      setGps({ error: 'Dieses Gerät kann den Standort nicht bestimmen. Tipp auf die Karte.' });
      return;
    }
    setGps('locating');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setErrors((e) => ({ ...e, pos: undefined }));
        setGps('idle');
      },
      (err) => setGps({ error: GPS_ERRORS[err.code] ?? 'Standort nicht gefunden. Tipp auf die Karte.' }),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Gib dem Ort einen Namen, z. B. Bowen oder Mission Beach.';
    if (!pos) next.pos = 'Tipp auf die Karte oder nutze deinen Standort.';
    if (departure && departure < arrival) next.departure = 'Die Abreise liegt vor der Ankunft.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !pos) return;

    setSaving(true);
    const input = { name, lat: pos.lat, lng: pos.lng, arrivalDate: arrival, departureDate: departure || undefined, note };
    if (place) {
      await updatePlace(place.id, input);
      onDone(place);
    } else {
      const created = await createPlace(input);
      if (files.length) await addPhotos(created.id, files);
      onDone(created);
    }
  }

  const others = places.filter((p) => p.id !== place?.id);

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-5">
      <Field label="Ort" error={errors.name}>
        {(p) => <input {...p} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Bowen" />}
      </Field>

      <div className="flex flex-col gap-2">
        <span className="font-semibold">Position</span>
        <AustraliaMap
          places={others}
          draft={pos}
          onMapTap={(p) => {
            setPos(p);
            setErrors((e) => ({ ...e, pos: undefined }));
          }}
          label="Karte zum Setzen der Position. Tipp auf die Stelle, an der du bist."
        />
        <p className={`text-small ${errors.pos ? 'font-semibold text-redpen' : 'text-muted'}`}>
          {errors.pos ?? (pos ? `Gesetzt: ${formatLatLng(pos)}` : 'Tipp auf die Karte, zum Zoomen zwei Finger oder die Knöpfe.')}
        </p>
        <Button variant="secondary" block onClick={locate} disabled={gps === 'locating'}>
          {gps === 'locating' ? 'Suche Standort …' : 'Meinen Standort verwenden'}
        </Button>
        {typeof gps === 'object' && (
          <Banner tone="warn" role="alert">
            <p className="text-small">{gps.error}</p>
          </Banner>
        )}
        {pos && !inBounds(pos) && (
          <Banner tone="info">
            <p className="text-small">Diese Position liegt außerhalb von Australien und erscheint nicht auf der Karte.</p>
          </Banner>
        )}
      </div>

      <DateField label="Angekommen" value={arrival} onChange={setArrival} shortcuts />
      <DateField label="Abgereist (optional)" value={departure} onChange={setDeparture} optional onClear={() => setDeparture('')} />
      {errors.departure && <p className="-mt-3 text-small font-semibold text-redpen">{errors.departure}</p>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="place-note" className="font-semibold">
          Notiz (optional)
        </label>
        <textarea
          id="place-note"
          rows={3}
          className={`${inputClass} py-3`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Hostel, Leute, was du erlebt hast"
        />
      </div>

      {!place && (
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Fotos</span>
          {files.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="relative">
                  <Thumb blob={f} alt={`Ausgewähltes Foto ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                    aria-label={`Foto ${i + 1} entfernen`}
                    className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border border-paper bg-ink text-paper"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <PhotoPicker onPick={(picked) => setFiles((fs) => [...fs, ...picked])} disabled={saving} />
        </div>
      )}

      <Button type="submit" block disabled={saving}>
        {saving
          ? files.length
            ? `Speichert ${plural(files.length, 'Foto', 'Fotos')} …`
            : 'Speichert …'
          : place
            ? 'Änderungen speichern'
            : 'Ort speichern'}
      </Button>
      <Button variant="secondary" block onClick={() => onDone(null)} disabled={saving}>
        Abbrechen
      </Button>
    </form>
  );
}
