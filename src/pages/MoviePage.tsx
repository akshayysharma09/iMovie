import { useEffect, useState } from 'react';
import { Play, Star, Clock, CalendarDays, Clapperboard, User2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Movie, Showtime, Screen } from '@/lib/types';
import { formatDateLong, formatTime, centsToUsd } from '@/lib/types';
import { Spinner, ErrorState, RatingBadge, GenreChip } from '@/components/ui';
import { useBookingFlow } from '@/lib/bookingFlow';

interface MoviePageProps {
  slug: string;
  navigate: (to: string) => void;
}

export default function MoviePage({ slug, navigate }: MoviePageProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { setPending } = useBookingFlow();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: m, error: e1 } = await supabase
        .from('movies')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (!active) return;
      if (e1) {
        setError(e1.message);
        setLoading(false);
        return;
      }
      if (!m) {
        setError('Movie not found.');
        setLoading(false);
        return;
      }
      setMovie(m as Movie);

      // Load showtimes for this movie with screen join
      const { data: st, error: e2 } = await supabase
        .from('showtimes')
        .select('*, screen:screens(*)')
        .eq('movie_id', (m as Movie).id)
        .order('show_date')
        .order('show_time');
      if (!active) return;
      if (e2) {
        setError(e2.message);
      } else {
        setShowtimes((st ?? []) as Showtime[]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <Spinner label="Loading film…" />;
  if (error || !movie) return <ErrorState message={error ?? 'Movie not found.'} />;

  const dates = Array.from(
    new Set(showtimes.map((s) => s.show_date))
  ).sort();

  const pickShowtime = (st: Showtime) => {
    const screen = (st.screen as unknown as Screen) ?? null;
    setPending({
      showtimeId: st.id,
      movieId: movie.id,
      movieTitle: movie.title,
      screenName: screen?.name ?? 'Screen',
      showDate: st.show_date,
      showTime: st.show_time,
      format: st.format,
      priceCents: Number(st.base_price),
      seats: [],
    });
    navigate(`/seats/${st.id}`);
  };

  return (
    <div className="animate-fadeIn">
      {/* Backdrop */}
      <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden">
        {movie.backdrop_url ? (
          <img src={movie.backdrop_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-ink-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
      </div>

      <div className="mx-auto -mt-32 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          {/* Poster */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-2xl ring-1 ring-inset ring-ink-700 shadow-card">
              {movie.poster_url && (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Main info */}
          <div>
            <div className="flex flex-wrap items-start gap-2">
              {movie.certificate && (
                <span className="chip bg-ink-800 text-ink-200 ring-1 ring-inset ring-ink-600">
                  {movie.certificate}
                </span>
              )}
              {movie.rating > 0 && <RatingBadge rating={movie.rating} />}
              {movie.genres.map((g) => (
                <GenreChip key={g} label={g} />
              ))}
            </div>

            <h1 className="mt-3 text-3xl font-extrabold text-ink-50 sm:text-4xl">
              {movie.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-300">
              {movie.runtime_minutes > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gold-400" />
                  {movie.runtime_minutes} min
                </span>
              )}
              {movie.director && (
                <span className="inline-flex items-center gap-1.5">
                  <Clapperboard className="h-4 w-4 text-gold-400" />
                  {movie.director}
                </span>
              )}
              {movie.release_date && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-gold-400" />
                  {formatDateLong(movie.release_date)}
                </span>
              )}
            </div>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-300">
              {movie.synopsis}
            </p>

            {movie.trailer_url && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="btn-primary mt-6"
              >
                <Play className="h-4 w-4 fill-ink-950" /> Watch trailer
              </button>
            )}

            {movie.cast_names.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
                  Cast
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.cast_names.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800/70 px-3 py-1.5 text-sm text-ink-200 ring-1 ring-inset ring-ink-700"
                    >
                      <User2 className="h-3.5 w-3.5 text-gold-400" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Showtimes */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-ink-50">Showtimes</h2>
          <p className="mt-1 text-sm text-ink-400">
            Pick a date and time. Each screening runs at our downtown cinema.
          </p>

          {dates.length === 0 ? (
            <div className="card mt-6 p-6 text-center text-ink-300">
              <p>
                No showtimes scheduled for this film right now. Please check back
                soon.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {dates.map((date) => {
                const dayShowtimes = showtimes
                  .filter((s) => s.show_date === date)
                  .sort((a, b) => a.show_time.localeCompare(b.show_time));
                return (
                  <div key={date} className="card p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-gold-400" />
                      <h3 className="text-base font-semibold text-ink-100">
                        {formatDateLong(date)}
                      </h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {dayShowtimes.map((st) => {
                        const screen = st.screen as unknown as Screen | undefined;
                        return (
                          <button
                            key={st.id}
                            onClick={() => pickShowtime(st)}
                            className="group flex items-center justify-between rounded-xl bg-ink-900/70 p-4 ring-1 ring-inset ring-ink-700 transition-all hover:-translate-y-0.5 hover:ring-gold-400/40 hover:shadow-card"
                          >
                            <div className="text-left">
                              <p className="text-base font-semibold text-ink-50">
                                {formatTime(st.show_time)}
                              </p>
                              <p className="mt-0.5 text-xs text-ink-400">
                                {screen?.name ?? 'Screen'} · {st.format}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gold-400">
                                {centsToUsd(Number(st.base_price))}
                              </p>
                              <p className="mt-0.5 text-xs text-ink-500 group-hover:text-gold-300">
                                Seats →
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Trailer modal */}
      {trailerOpen && movie.trailer_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/90 p-4 backdrop-blur"
          onClick={() => setTrailerOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black ring-1 ring-ink-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg bg-ink-900/80 px-3 py-1.5 text-sm text-ink-200 hover:text-ink-50"
            >
              Close
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={`${movie.trailer_url}?autoplay=1&rel=0`}
                title={`${movie.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Star };
