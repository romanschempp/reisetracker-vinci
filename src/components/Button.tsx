import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-stamp text-on-stamp active:brightness-90',
  secondary: 'border-2 border-line text-ink active:bg-raised',
  danger: 'border-2 border-redpen text-redpen active:bg-redpen-wash',
  quiet: 'text-stamp underline underline-offset-4 decoration-2 px-1',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export function Button({ variant = 'primary', block = false, className = '', type = 'button', ...rest }: Props) {
  const size = variant === 'quiet' ? 'min-h-12' : 'min-h-14 px-5 rounded-lg';
  return (
    <button
      type={type}
      className={`${size} ${VARIANTS[variant]} ${block ? 'w-full' : ''} inline-flex items-center justify-center gap-2 font-bold disabled:opacity-40 ${className}`}
      {...rest}
    />
  );
}
