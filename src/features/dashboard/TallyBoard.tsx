import { useEffect, useRef } from 'react';

interface Props {
  done: number;
  target: number;
  /** Index des Strichs, der für heute steht (wird Hi-Vis markiert), sonst null */
  todayIndex: number | null;
}

const GROUP_W = 50;
const GROUP_H = 50;
const PER_ROW = 6;

/** Deterministisches „Handgezeichnet“: kleine, stabile Abweichungen je Strich. */
function wobble(seed: number, amount: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amount;
}

function strokePath(k: number): string {
  const pos = k % 5;
  const w = (n: number) => wobble(k * 7 + n, 1.4).toFixed(1);
  if (pos === 4) {
    // der Querstrich durch das Fünferbündel
    return `M${-2 + +w(1)} ${36 + +w(2)} L${40 + +w(3)} ${13 + +w(4)}`;
  }
  const x = 5 + pos * 9;
  return `M${x + +w(1)} ${6 + +w(2)} L${x + +w(3)} ${44 + +w(4)}`;
}

/**
 * Die Strichliste: ein Strich pro Tag, Fünferbündel wie an der Schuppenwand.
 * Neue Striche werden gezeichnet, wenn du einen Tag erfasst hast.
 */
export function TallyBoard({ done, target, todayIndex }: Props) {
  const prevDone = useRef<number | null>(null);
  const animateFrom = prevDone.current !== null && done > prevDone.current ? prevDone.current : done;
  useEffect(() => {
    prevDone.current = done;
  }, [done]);

  const groups = Math.ceil(target / 5);
  const rows = Math.ceil(groups / PER_ROW);
  const width = PER_ROW * GROUP_W - 10;
  const height = rows * GROUP_H;

  const strokes = Array.from({ length: target }, (_, k) => {
    const g = Math.floor(k / 5);
    const tx = (g % PER_ROW) * GROUP_W;
    const ty = Math.floor(g / PER_ROW) * GROUP_H;
    return { k, tx, ty, d: strokePath(k), filled: k < done };
  });
  const today = todayIndex !== null && todayIndex < target ? strokes[todayIndex] : undefined;

  return (
    <svg
      viewBox={`-4 0 ${width + 8} ${height}`}
      className="block w-full"
      role="img"
      aria-label={`Strichliste: ${Math.min(done, target)} von ${target} Tagen`}
    >
      {today && (
        <rect
          x={today.tx + (today.k % 5 === 4 ? -4 : 5 + (today.k % 5) * 9 - 5)}
          y={today.ty + 2}
          width={today.k % 5 === 4 ? 48 : 10}
          height={46}
          rx={3}
          fill="var(--hivis)"
          opacity={0.85}
        />
      )}
      {strokes.map((s) => (
        <path
          key={s.k}
          d={s.d}
          transform={`translate(${s.tx} ${s.ty})`}
          stroke={s.filled ? 'var(--stamp)' : 'var(--tally-empty)'}
          strokeWidth={s.filled ? 3.6 : 2.4}
          strokeLinecap="round"
          fill="none"
          pathLength={1}
          className={s.filled && s.k >= animateFrom ? 'stroke-draw' : undefined}
          style={s.filled && s.k >= animateFrom ? { animationDelay: `${(s.k - animateFrom) * 90}ms` } : undefined}
        />
      ))}
    </svg>
  );
}
