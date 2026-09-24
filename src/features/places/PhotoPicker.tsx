import { useRef } from 'react';
import { Button } from '../../components/Button';

interface Props {
  onPick: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}

/** Öffnet Kamera oder Fotomediathek (je nach Handy), mehrere Fotos auf einmal. */
export function PhotoPicker({ onPick, disabled, label = 'Fotos hinzufügen' }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant="secondary" block disabled={disabled} onClick={() => input.current?.click()}>
        {label}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (files.length) onPick(files);
        }}
      />
    </>
  );
}
