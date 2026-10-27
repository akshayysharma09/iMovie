import { useEffect, useState } from 'react';
import { Play, ChevronRight, CalendarDays, Film } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Movie } from '@/lib/types';
import MovieCard, { MovieCardSkeleton } from '@/components/MovieCard';
import {
  SectionHeading,
  Spinner,
  ErrorState,
} from '@/components/ui';

interface HomePageProps {
  navigate: (to: string) => void;
}

export default function HomePage({ navigate }: HomePageProps) {
  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hero, setHero] = useState<Movie | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('rating', { ascending: false });
      if (!active) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const now = (data ?? []).filter((m) => m.status === 'now_showing');
      const soon = (data ?? []).filter((m) => m.status === 'coming_soon');
      setNowShowing(now);
      setComingSoon(soon);
      setHero(now[0] ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="animate-fadeIn">
      {hero ? (
        <Hero movie={hero} navigate={navigate} />
      ) : loading ? (
        <div className="skeleton h-[60vh] w-full" />
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="In theatres now"
          title="Now Showing"
          action={
            <button
              onClick={() => navigate('/coming-soon')}
              className="hidden items-center gap-1 text-sm font-medium text-gold-400 hover:text-gold-300 sm:inline-flex"
            >
              Coming soon <ChevronRight className="h-4 w-4" />
            </button>
          }
        />

        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : nowShowing.length === 0 ? (
          <Spinner label="No films currently showing" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {nowShowing.map((m) => (
              <MovieCard key={m.id} movie={m} onSelect={(s) => navigate(`/movie/${s}`)} />
            ))}
          </div>
        )}
      </section>

      {comingSoon.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="On the horizon"
            title="Coming Soon"
            action={
              <button
                onClick={() => navigate('/coming-soon')}
                className="inline-flex items-center gap-1 text-sm font-medium text-gold-400 hover:text-gold-300"
              >
                See all <ChevronRight className="h-4 w-4" />
              </button>
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {comingSoon.slice(0, 5).map((m) => (
              <MovieCard key={m.id} movie={m} onSelect={(s) => navigate(`/movie/${s}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Hero({ movie, navigate }: { movie: Movie; navigate: (to: string) => void }) {
  return (
    <section className="relative">
      <div className="absolute inset-0 h-[70vh] min-h-[420px] w-full overflow-hidden">
        {movie.backdrop_url && (
          <img
            src={movie.backdrop_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-7xl items-end px-4 pb-10 pt-[44vh] sm:px-6 lg:px-8 lg:pb-16">
        <div className="max-w-2xl">
          <span className="chip bg-gold-400/90 text-ink-950">
            <Film className="h-3 w-3" /> Featured this week
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-ink-50 sm:text-5xl lg:text-6xl">
            {movie.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-300">
            {movie.rating > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-gold-300">
                ★ {movie.rating.toFixed(1)}
              </span>
            )}
            {movie.runtime_minutes > 0 && <span>{movie.runtime_minutes} min</span>}
            {movie.certificate && (
              <span className="rounded border border-ink-600 px-1.5 py-0.5 text-xs">
                {movie.certificate}
              </span>
            )}
            {movie.genres.slice(0, 3).map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
          <p className="mt-4 line-clamp-3 max-w-xl text-base text-ink-300">
            {movie.synopsis}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/movie/${movie.slug}`)}
              className="btn-primary"
            >
              <Play className="h-4 w-4 fill-ink-950" /> Get tickets
            </button>
            <button
              onClick={() => navigate(`/movie/${movie.slug}`)}
              className="btn-secondary"
            >
              <CalendarDays className="h-4 w-4" /> View showtimes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
