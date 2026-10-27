import { Star, Clock, Calendar } from 'lucide-react';
import type { Movie } from '@/lib/types';
import { RatingBadge, GenreChip } from '@/components/ui';

interface MovieCardProps {
  movie: Movie;
  onSelect: (slug: string) => void;
}

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  const isComingSoon = movie.status === 'coming_soon';
  return (
    <button
      onClick={() => onSelect(movie.slug)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-ink-800/60 text-left ring-1 ring-inset ring-ink-700/60 transition-all duration-300 hover:-translate-y-1 hover:ring-gold-400/40 hover:shadow-card"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-ink-900">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-600">
            No poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {movie.certificate && (
            <span className="chip bg-ink-950/80 text-ink-100 ring-1 ring-inset ring-ink-600 backdrop-blur">
              {movie.certificate}
            </span>
          )}
          {!isComingSoon && <RatingBadge rating={movie.rating} />}
        </div>

        {isComingSoon && movie.release_date && (
          <div className="absolute right-3 top-3">
            <span className="chip bg-gold-400/90 text-ink-950 backdrop-blur">
              <Calendar className="h-3 w-3" />
              {new Date(movie.release_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Bottom info on poster */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold leading-tight text-ink-50">
            {movie.title}
          </h3>
          {!isComingSoon && (
            <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-300">
              {movie.runtime_minutes > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {movie.runtime_minutes}m
                </span>
              )}
              {movie.genres.slice(0, 2).map((g) => (
                <span key={g}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {movie.genres.slice(0, 3).map((g) => (
              <GenreChip key={g} label={g} />
            ))}
          </div>
        )}
        {isComingSoon ? (
          <span className="text-xs font-medium text-gold-400">
            Coming {movie.release_date
              ? new Date(movie.release_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })
              : 'soon'}
          </span>
        ) : (
          <span className="text-sm font-medium text-gold-400 group-hover:text-gold-300">
            View details & book →
          </span>
        )}
      </div>
    </button>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-ink-800/60 ring-1 ring-inset ring-ink-700/60">
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export { Star };
