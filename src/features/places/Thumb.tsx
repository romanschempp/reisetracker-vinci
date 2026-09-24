import { useObjectUrl } from '../../lib/useObjectUrl';

/** Quadratisches Vorschaubild aus einem Blob. */
export function Thumb({ blob, alt, className = '' }: { blob: Blob; alt: string; className?: string }) {
  const url = useObjectUrl(blob);
  return (
    <span className={`block aspect-square overflow-hidden rounded-2xl bg-raised ${className}`}>
      {url && <img src={url} alt={alt} className="size-full object-cover" draggable={false} />}
    </span>
  );
}
