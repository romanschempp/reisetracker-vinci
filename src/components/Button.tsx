import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-stamp text-on-stamp active:opacity-80',
  secondary: 'border border-ink/40 text-ink active:bg-ink/5',
  danger: 'border border-redpen text-redpen active:bg-redpen-wash',
  quiet: 'text-ink underline underline-offset-4 decoration-1 px-1',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export function Button({ variant = 'primary', block = false, className = '', type = 'button', ...rest }: Props) {
  const size = variant === 'quiet' ? 'min-h-12' : 'min-h-13 px-6 rounded-full';
  return (
    <button
      type={type}
      className={`${size} ${VARIANTS[variant]} ${block ? 'w-full' : ''} inline-flex items-center justify-center gap-2 font-medium disabled:opacity-40 ${className}`}
      {...rest}
    />
  );
}
