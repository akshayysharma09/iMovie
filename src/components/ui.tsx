import { type ReactNode } from 'react';
import { Star } from 'lucide-react';

export function RatingBadge({ rating }: { rating: number }) {
  if (!rating) return null;
  return (
    <span className="chip bg-ink-900/80 text-gold-300 ring-1 ring-inset ring-gold-500/30">
      <Star className="h-3 w-3 fill-gold-300 text-gold-300" />
      {rating.toFixed(1)}
    </span>
  );
}

export function GenreChip({ label }: { label: string }) {
  return (
    <span className="chip bg-ink-700/70 text-ink-200 ring-1 ring-inset ring-ink-600">
      {label}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold text-ink-50 sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-300">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-gold-400" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-ink-800/60 px-6 py-16 text-center ring-1 ring-inset ring-ink-700/60">
      {icon && <div className="text-ink-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-100">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-400">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-error-900/30 px-6 py-16 text-center ring-1 ring-inset ring-error-500/30">
      <p className="text-base font-semibold text-error-200">Something went wrong</p>
      <p className="max-w-md text-sm text-error-300/80">{message}</p>
    </div>
  );
}
