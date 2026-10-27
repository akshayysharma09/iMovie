import { useEffect, useState } from 'react';
import { Ticket, CalendarDays, Clock, Armchair, ArrowRight, Film } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking, Showtime, Screen, Movie } from '@/lib/types';
import { centsToUsd, formatDateLong, formatTime } from '@/lib/types';
import { Spinner, EmptyState, ErrorState } from '@/components/ui';
import { useAuth } from '@/lib/auth';

interface BookingsPageProps {
  navigate: (to: string) => void;
}

export default function BookingsPage({ navigate }: BookingsPageProps) {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*, showtime:showtimes(*, movie:movies(*), screen:screens(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setBookings(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || loading) return <Spinner label="Loading your bookings…" />;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <EmptyState
          icon={<Ticket className="h-10 w-10" />}
          title="Sign in to see your bookings"
          description="Your upcoming and past tickets will appear here once you're signed in."
        />
        <button onClick={() => navigate('/signin')} className="btn-primary mt-6">
          Sign in
        </button>
      </div>
    );
  }
  if (error) return <ErrorState message={error} />;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings
    .filter((b) => {
      const st = b.showtime as unknown as Showtime | undefined;
      return st && st.show_date >= today && b.status === 'confirmed';
    })
    .sort((a, b) => {
      const sa = a.showtime as unknown as Showtime;
      const sb = b.showtime as unknown as Showtime;
      return (sa.show_date + sa.show_time).localeCompare(sb.show_date + sb.show_time);
    });
  const past = bookings
    .filter((b) => {
      const st = b.showtime as unknown as Showtime | undefined;
      return st && (st.show_date < today || b.status !== 'confirmed');
    })
    .sort((a, b) => (b.created_at).localeCompare(a.created_at));

  if (bookings.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <EmptyState
          icon={<Ticket className="h-10 w-10" />}
          title="No bookings yet"
          description="Browse what's showing and book your first ticket at iMovies."
        />
        <button onClick={() => navigate('/')} className="btn-primary mt-6">
          Browse movies
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ink-50">My Bookings</h1>
      <p className="mt-1 text-sm text-ink-400">
        Your upcoming and past tickets at iMovies.
      </p>

      <section className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-100">
          <CalendarDays className="h-5 w-5 text-gold-400" /> Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-500">No upcoming tickets.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onClick={() =>
                  navigate(`/ticket/${(b.showtime as unknown as Showtime).id}/${b.seat_label}`)
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-100">
          <Clock className="h-5 w-5 text-ink-400" /> Past
        </h2>
        {past.length === 0 ? (
          <p className="text-sm text-ink-500">No past tickets.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                faded
                onClick={() =>
                  navigate(`/ticket/${(b.showtime as unknown as Showtime).id}/${b.seat_label}`)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BookingCard({
  booking,
  faded,
  onClick,
}: {
  booking: Booking;
  faded?: boolean;
  onClick: () => void;
}) {
  const showtime = booking.showtime as unknown as Showtime | undefined;
  const screen = showtime?.screen as unknown as Screen | undefined;
  const movie = showtime?.movie as unknown as Movie | undefined;
  const snacks = (booking.snack_items ?? []) as { name: string; qty: number }[];

  return (
    <button
      onClick={onClick}
      className={`group flex gap-4 overflow-hidden rounded-2xl bg-ink-800/60 p-4 text-left ring-1 ring-inset ring-ink-700/60 transition-all hover:-translate-y-0.5 hover:ring-gold-400/40 hover:shadow-card ${
        faded ? 'opacity-70' : ''
      }`}
    >
      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-900 ring-1 ring-inset ring-ink-700">
        {movie?.poster_url && (
          <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink-50">{movie?.title}</h3>
          {booking.status !== 'confirmed' && (
            <span className="chip bg-ink-700 text-ink-300">Cancelled</span>
          )}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {showtime && formatDateLong(showtime.show_date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {showtime && formatTime(showtime.show_time)}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1">
            <Armchair className="h-3 w-3" /> Seat {booking.seat_label}
          </span>
          <span className="inline-flex items-center gap-1">
            <Film className="h-3 w-3" /> {showtime?.format}
          </span>
          {screen && <span>{screen.name}</span>}
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-mono text-xs font-semibold text-gold-400">
            {booking.code}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-400 group-hover:text-gold-300">
            View ticket <ArrowRight className="h-3 w-3" />
          </span>
        </div>
        {snacks.length > 0 && (
          <p className="mt-1 text-xs text-ink-500">
            Snacks: {snacks.map((s) => `${s.name} ×${s.qty}`).join(', ')}
          </p>
        )}
      </div>
    </button>
  );
}
