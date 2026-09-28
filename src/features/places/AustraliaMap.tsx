import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Place } from '../../db/types';
import { BOUNDS, MAP_HEIGHT, MAP_WIDTH, project, unproject, type LatLng } from '../../lib/geo';
import { REGIONS, TOWNS } from './mapData';
import { placeTownLabels, scaleBar } from './mapLabels';

interface Props {
  /** In Reisereihenfolge – die Nummern auf der Karte folgen dieser Reihenfolge. */
  places: Place[];
  selectedId?: string;
  /** Vorläufige Markierung beim Eintragen eines Orts */
  draft?: LatLng;
  onMapTap?: (pos: LatLng) => void;
  onPlaceTap?: (place: Place) => void;
  label: string;
}

interface View {
  x: number;
  y: number;
  w: number;
}

const ASPECT = MAP_HEIGHT / MAP_WIDTH;
const FULL: View = { x: 0, y: 0, w: MAP_WIDTH };
const MIN_W = 20; // stärkster Zoom 50-fach
const TAP_SLOP = 8; // px Bewegung, bis aus einem Tipp ein Verschieben wird

function clampView(v: View): View {
  const w = Math.min(MAP_WIDTH, Math.max(MIN_W, v.w));
  const h = w * ASPECT;
  return { w, x: Math.min(MAP_WIDTH - w, Math.max(0, v.x)), y: Math.min(MAP_HEIGHT - h, Math.max(0, v.y)) };
}

function zoomAt(v: View, factor: number, cx: number, cy: number): View {
  const w = Math.min(MAP_WIDTH, Math.max(MIN_W, v.w / factor));
  const k = w / v.w;
  return clampView({ w, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k });
}

/**
 * Offline-Karte von Australien. Ein Finger verschiebt, zwei Finger zoomen,
 * ein kurzer Tipp setzt einen Ort bzw. öffnet einen vorhandenen.
 */
export function AustraliaMap({ places, selectedId, draft, onMapTap, onPlaceTap, label }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(FULL);
  const [pxWidth, setPxWidth] = useState(360);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: 0, multi: false, pinchDist: 0, pinId: null as string | null });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(([entry]) => entry && setPxWidth(entry.contentRect.width || 360));
    ro.observe(svg);
    // Mausrad-Zoom am Rechner (muss nicht-passiv sein, sonst scrollt die Seite)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toMap(e.clientX, e.clientY);
      setView((v) => zoomAt(v, e.deltaY < 0 ? 1.25 : 0.8, p.x, p.y));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      ro.disconnect();
      svg.removeEventListener('wheel', onWheel);
    };
  }, []);

  function toMap(clientX: number, clientY: number) {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    // Pin schon hier merken: nach setPointerCapture zeigt e.target nur noch aufs SVG
    const pinId = (e.target as Element).closest('[data-place-id]')?.getAttribute('data-place-id') ?? null;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) gesture.current = { moved: 0, multi: false, pinchDist: 0, pinId };
    if (pointers.current.size === 2) {
      gesture.current.multi = true;
      gesture.current.pinchDist = pinchDistance();
    }
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved += Math.hypot(dx, dy);

    if (pointers.current.size === 1 && !gesture.current.multi) {
      if (gesture.current.moved < TAP_SLOP) return;
      setView((v) => {
        const k = v.w / pxWidth;
        return clampView({ ...v, x: v.x - dx * k, y: v.y - dy * k });
      });
    } else if (pointers.current.size === 2) {
      const dist = pinchDistance();
      const [a, b] = [...pointers.current.values()];
      if (!a || !b || !gesture.current.pinchDist) return;
      const mid = toMap((a.x + b.x) / 2, (a.y + b.y) / 2);
      const factor = dist / gesture.current.pinchDist;
      gesture.current.pinchDist = dist;
      setView((v) => zoomAt(v, factor, mid.x, mid.y));
    }
  }

  function onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    const wasTap = pointers.current.size === 1 && !gesture.current.multi && gesture.current.moved < TAP_SLOP;
    pointers.current.delete(e.pointerId);
    if (!wasTap) return;

    const { pinId } = gesture.current;
    if (pinId) {
      const place = places.find((p) => p.id === pinId);
      if (place && onPlaceTap) onPlaceTap(place);
      return;
    }
    if (onMapTap) {
      const p = toMap(e.clientX, e.clientY);
      onMapTap(unproject(p.x, p.y));
    }
  }

  // Einheiten so umrechnen, dass Pins und Schrift beim Zoomen gleich groß bleiben
  const k = view.w / pxWidth;
  const h = view.w * ASPECT;
  const zoom = MAP_WIDTH / view.w;
  const labels = useMemo(
    () => placeTownLabels(TOWNS, { ...view, h: view.w * ASPECT }, pxWidth / view.w, MAP_WIDTH),
    [view, pxWidth],
  );
  // Maßstab für die Mitte des Ausschnitts (Mercator: km pro Einheit hängt vom Breitengrad ab)
  const centerLat = unproject(view.x + view.w / 2, view.y + h / 2).lat;
  const kmPerUnit = (111.32 * Math.cos((centerLat * Math.PI) / 180) * (BOUNDS.east - BOUNDS.west)) / MAP_WIDTH;
  const scale = scaleBar(kmPerUnit * k);
  const points = places.map((p) => project(p));
  const draftXY = draft ? project(draft) : null;
  const zoomBy = (factor: number) =>
    setView((v) => zoomAt(v, factor, v.x + v.w / 2, v.y + (v.w * ASPECT) / 2));

  const ctrl =
    'flex size-12 items-center justify-center rounded-full bg-night/80 text-xl font-light text-white shadow-md backdrop-blur-xl transition-opacity duration-150 hover:opacity-85 active:opacity-75';

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${h}`}
        className={`block aspect-[1000/917] w-full touch-none select-none bg-[var(--sea)] active:cursor-grabbing ${onMapTap ? 'cursor-crosshair' : 'cursor-grab'}`}
        role="img"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
      >
        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="var(--sea)" />
        {REGIONS.map((r) => (
          <path
            key={r.code}
            d={r.path}
            fill={`var(--region-${r.code.toLowerCase()})`}
            stroke="var(--region-border)"
            strokeWidth={1.2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {REGIONS.map((r) => {
          // Kürzel in der Gesamtansicht, ausgeschrieben beim Hineinzoomen; das ACT erst ganz nah
          if (r.code === 'ACT' && zoom < 6) return null;
          const full = zoom >= 2.5;
          return (
            <text
              key={r.code}
              x={r.label[0]}
              y={r.label[1]}
              textAnchor="middle"
              fontSize={(full ? 15 : 13) * k}
              fontWeight={500}
              letterSpacing={1 * k}
              fill="var(--ink)"
              opacity={0.45}
              aria-hidden
            >
              {full ? r.name : r.code}
            </text>
          );
        })}

        {labels.map(({ town, anchor }) => (
          <g key={town.name} aria-hidden>
            <circle cx={town.x} cy={town.y} r={2.5 * k} fill="var(--ink)" opacity={0.7} />
            <text
              x={town.x + (anchor === 'start' ? 6 : -6) * k}
              y={town.y + 4 * k}
              textAnchor={anchor}
              fontSize={12 * k}
              fontWeight={town.rank <= 3 ? 600 : 400}
              fill="var(--ink)"
              stroke="var(--halo)"
              strokeWidth={3 * k}
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {town.name}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <polyline
            points={points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="var(--stamp)"
            strokeWidth={2.5 * k}
            strokeDasharray={`${6 * k} ${5 * k}`}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        )}

        {places.map((place, i) => {
          const [x, y] = points[i]!;
          const selected = place.id === selectedId;
          return (
            <g key={place.id} data-place-id={place.id} className="cursor-pointer">
              {selected && <circle cx={x} cy={y} r={19 * k} fill="var(--hivis)" />}
              <circle cx={x} cy={y} r={13 * k} fill="var(--stamp)" stroke="var(--paper)" strokeWidth={2.5 * k} />
              <text
                x={x}
                y={y + 4.5 * k}
                textAnchor="middle"
                fontSize={13 * k}
                fontWeight={500}
                fill="var(--on-stamp)"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {draftXY && (
          <g aria-hidden>
            <circle cx={draftXY[0]} cy={draftXY[1]} r={14 * k} fill="var(--hivis)" stroke="var(--ink)" strokeWidth={2.5 * k} />
            <circle cx={draftXY[0]} cy={draftXY[1]} r={3.5 * k} fill="var(--ink)" />
          </g>
        )}
      </svg>

      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col gap-0.5 rounded-xl bg-raised/90 px-3 py-1.5 text-small leading-none" aria-hidden>
        <span>{scale.km} km</span>
        <span className="h-1.5 border-x-2 border-b-2 border-ink" style={{ width: scale.px }} />
      </div>

      <div className="absolute right-2 bottom-2 flex flex-col gap-2">
        <button type="button" className={ctrl} onClick={() => zoomBy(1.6)} aria-label="Hineinzoomen">
          +
        </button>
        <button type="button" className={ctrl} onClick={() => zoomBy(1 / 1.6)} aria-label="Herauszoomen">
          −
        </button>
      </div>
      {view.w < MAP_WIDTH && (
        <button
          type="button"
          onClick={() => setView(FULL)}
          className="absolute top-2 right-2 min-h-11 rounded-full bg-night/80 px-4 text-small font-medium text-white shadow-md backdrop-blur-xl transition-opacity duration-150 hover:opacity-85"
        >
          Ganz Australien
        </button>
      )}
    </div>
  );
}
