import { useEffect, useState } from 'react';
import { ArrowLeft, Armchair, Check, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Showtime, Screen } from '@/lib/types';
import { centsToUsd, formatDateLong, formatTime } from '@/lib/types';
import { Spinner, ErrorState } from '@/components/ui';
import { useBookingFlow } from '@/lib/bookingFlow';

interface SeatsPageProps {
  showtimeId: string;
  navigate: (to: string) => void;
}

const ROW_LABELS = 'ABCDEFGHIJKLM'.split('');

export default function SeatsPage({ showtimeId, navigate }: SeatsPageProps) {
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, setPending } = useBookingFlow();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('showtimes')
        .select('*, movie:movies(*), screen:screens(*)')
        .eq('id', showtimeId)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setError(error?.message ?? 'Showtime not found.');
        setLoading(false);
        return;
      }
      setShowtime(data as Showtime);

      // Fetch booked seats for this showtime
      const { data: bookings } = await supabase
        .from('bookings')
        .select('seat_label')
        .eq('showtime_id', showtimeId)
        .eq('status', 'confirmed');
      if (!active) return;
      setBookedSeats(new Set((bookings ?? []).map((b) => b.seat_label)));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [showtimeId]);

  const toggleSeat = (label: string) => {
    if (bookedSeats.has(label)) return;
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : [...prev, label].sort()
    );
  };

  const proceed = () => {
    if (selected.length === 0 || !showtime || !pending) return;
    setPending({ ...pending, seats: selected });
    navigate(`/checkout/${showtimeId}`);
  };

  if (loading) return <Spinner label="Loading seat map…" />;
  if (error || !showtime) return <ErrorState message={error ?? 'Showtime not found.'} />;

  const screen = showtime.screen as unknown as Screen | undefined;
  const movie = showtime.movie as unknown as { title: string } | undefined;
  const rows = screen?.rows ?? 10;
  const seatsPerRow = screen?.seats_per_row ?? 12;
  const priceEach = Number(showtime.base_price);
  const total = selected.length * priceEach;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(`/movie/${(showtime.movie as unknown as { slug: string }).slug}`)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-ink-50"
      >
        <ArrowLeft className="h-4 w-4" /> Back to movie
      </button>

      {/* Summary */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">
            {movie?.title ?? 'Select your seats'}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {formatDateLong(showtime.show_date)} · {formatTime(showtime.show_time)}{' '}
            · {screen?.name} · {showtime.format}
          </p>
        </div>
      </div>

      {/* Screen indicator */}
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto h-2 w-3/4 rounded-t-full bg-gradient-to-t from-gold-500/30 to-gold-400/80 shadow-[0_-8px_24px_-4px_rgba(212,166,72,0.4)]" />
        <p className="mt-2 text-center text-xs uppercase tracking-[0.3em] text-ink-500">
          Screen
        </p>
      </div>

      {/* Seat map */}
      <div className="mt-8 overflow-x-auto">
        <div className="mx-auto w-fit space-y-2.5">
          {Array.from({ length: rows }).map((_, r) => {
            const rowLabel = ROW_LABELS[r] ?? String(r);
            return (
              <div key={r} className="flex items-center gap-2">
                <span className="w-5 text-center text-xs font-medium text-ink-500">
                  {rowLabel}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: seatsPerRow }).map((__, c) => {
                    const label = `${rowLabel}${c + 1}`;
                    const isBooked = bookedSeats.has(label);
                    const isSelected = selected.includes(label);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleSeat(label)}
                        disabled={isBooked}
                        title={label}
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-medium transition-all duration-150 sm:h-8 sm:w-8 ${
                          isBooked
                            ? 'cursor-not-allowed bg-ink-700/50 text-ink-600'
                            : isSelected
                            ? 'bg-gold-400 text-ink-950 shadow-glow scale-105'
                            : 'bg-ink-700 text-ink-300 hover:bg-accent-600 hover:text-ink-50'
                        }`}
                      >
                        {isBooked ? '×' : c + 1}
                      </button>
                    );
                  })}
                </div>
                <span className="w-5 text-center text-xs font-medium text-ink-500">
                  {rowLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-5 text-xs text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-md bg-ink-700" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-md bg-gold-400" /> Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-md bg-ink-700/50" /> Taken
        </span>
      </div>

      {/* Footer bar */}
      <div className="sticky bottom-4 mt-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl bg-ink-900/95 px-5 py-4 ring-1 ring-inset ring-ink-700 backdrop-blur-xl shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-ink-400">
                {selected.length > 0
                  ? `${selected.length} seat${selected.length > 1 ? 's' : ''}: ${selected.join(', ')}`
                  : 'No seats selected'}
              </p>
              <p className="text-lg font-bold text-gold-400">
                {selected.length > 0 ? centsToUsd(total) : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={proceed}
            disabled={selected.length === 0}
            className="btn-primary w-full sm:w-auto"
          >
            <Check className="h-4 w-4" /> Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export { Armchair, Info };
