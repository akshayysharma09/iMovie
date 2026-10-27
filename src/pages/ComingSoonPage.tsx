import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Movie } from '@/lib/types';
import MovieCard, { MovieCardSkeleton } from '@/components/MovieCard';
import { SectionHeading, ErrorState } from '@/components/ui';

interface ComingSoonPageProps {
  navigate: (to: string) => void;
}

export default function ComingSoonPage({ navigate }: ComingSoonPageProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('status', 'coming_soon')
        .order('release_date');
      if (!active) return;
      if (error) setError(error.message);
      else setMovies(data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="On the horizon"
        title="Coming Soon"
      />
      <p className="-mt-4 mb-8 flex items-center gap-2 text-sm text-ink-400">
        <CalendarDays className="h-4 w-4 text-gold-400" />
        Upcoming releases at iMovies — keep an eye out for bookings opening.
      </p>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <p className="text-ink-400">No upcoming films announced yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} onSelect={(s) => navigate(`/movie/${s}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
