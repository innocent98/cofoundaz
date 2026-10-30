'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

/** Shared look for the Settings hub: the cards, inputs and buttons the tabs are built from. */

export function Card({
  title,
  description,
  children,
  className = '',
  action,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`bg-white border border-line rounded-[24px] shadow-card p-5 md:p-7 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-display font-medium text-ink">{title}</h2>}
            {description && <p className="text-xs text-ink-subtle mt-1 leading-relaxed">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-bold text-ink mb-1.5">
      {children}
    </label>
  );
}

const inputCls =
  'w-full bg-white border border-line-stone rounded-modal px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent-gold disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed';

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...rest }, ref) {
    return <input ref={ref} {...rest} className={`${inputCls} ${className}`} />;
  },
);

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-24 ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

export function FieldError({ message, id }: { message?: string | null; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-danger-ink mt-1.5">
      {message}
    </p>
  );
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const variants: Record<Variant, string> = {
  primary: 'bg-accent-gold hover:bg-accent-xa38346 text-white shadow-card border border-transparent',
  secondary: 'bg-white hover:bg-neutral-50 text-ink border border-line-stone',
  danger: 'bg-danger-ink hover:bg-danger-x8d2a20 text-white border border-transparent',
  ghost: 'bg-transparent hover:bg-neutral-50 text-ink-muted border border-transparent',
};

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      {...rest}
      className={`inline-flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-modal text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

const bannerTone = {
  info: { cls: 'bg-surface-subtle border-line text-ink', Icon: Info },
  success: { cls: 'bg-brand-tint border-brand-xd5e6dc text-brand-strong', Icon: CheckCircle2 },
  warn: { cls: 'bg-neutral-xfaf6ee border-accent-xf2e5d0 text-accent-x6b5a35', Icon: AlertTriangle },
  error: { cls: 'bg-danger-xfdf0ed border-danger-xf3d5ce text-danger-ink', Icon: AlertTriangle },
} as const;

export function Banner({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: keyof typeof bannerTone;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { cls, Icon } = bannerTone[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`border rounded-[24px] p-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 ${cls}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
        <div className="text-xs space-y-0.5 min-w-0">
          {title && <p className="font-bold">{title}</p>}
          {children && <div className="leading-relaxed">{children}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-xs text-ink-subtle">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
      {label}…
    </div>
  );
}

/** A section that failed to load: honest message plus Retry, never an empty page. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Banner
      tone="error"
      title="Couldn't load this"
      action={
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      {message}
    </Banner>
  );
}

export function ProgressBar({ percent, tone = 'ok', label }: { percent: number; tone?: 'ok' | 'warn' | 'full'; label: string }) {
  const color = tone === 'full' ? 'bg-danger-ink' : tone === 'warn' ? 'bg-accent-gold' : 'bg-brand-strong';
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full bg-neutral-xefefed h-2 rounded-full overflow-hidden"
    >
      <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Only a real http(s) URL can be an <img src>; the local dev storage returns a file path instead. */
export function imageSrc(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
