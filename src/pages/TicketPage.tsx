import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, CalendarDays, Clock, Film, Armchair, Download, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Booking, Showtime, Screen, Movie } from '@/lib/types';
import { centsToUsd, formatDateLong, formatTime } from '@/lib/types';
import { Spinner, ErrorState } from '@/components/ui';

interface TicketPageProps {
  showtimeId: string;
  seatLabel: string;
  navigate: (to: string) => void;
}

export default function TicketPage({ showtimeId, seatLabel, navigate }: TicketPageProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, showtime:showtimes(*, movie:movies(*), screen:screens(*))')
        .eq('showtime_id', showtimeId)
        .eq('seat_label', seatLabel)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Ticket not found.');
        setLoading(false);
        return;
      }
      setBooking(data as Booking);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [showtimeId, seatLabel]);

  if (loading) return <Spinner label="Issuing your e-ticket…" />;
  if (error || !booking)
    return <ErrorState message={error ?? 'Ticket not found.'} />;

  const showtime = booking.showtime as unknown as Showtime | undefined;
  const screen = showtime?.screen as unknown as Screen | undefined;
  const movie = showtime?.movie as unknown as Movie | undefined;
  const snackItems = (booking.snack_items ?? []) as {
    name: string;
    qty: number;
    price_cents: number;
  }[];
  const snacksTotal = snackItems.reduce((s, i) => s + i.qty * i.price_cents, 0);
  const ticketTotal = Number(booking.total_cents);

  const qrValue = `IMOVIES|${booking.code}|${showtimeId}|${seatLabel}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Success banner */}
      <div className="mb-8 flex flex-col items-center text-center animate-fadeIn">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-500/15 text-success-400 ring-1 ring-inset ring-success-500/30">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink-50">Booking confirmed!</h1>
        <p className="mt-1 text-sm text-ink-400">
          Your e-ticket is below. Show the QR code at the cinema entrance.
        </p>
      </div>

      {/* Ticket card */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 to-ink-900 ring-1 ring-inset ring-ink-700 shadow-card animate-fadeIn">
        {/* Top: movie + QR */}
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-4">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-900 ring-1 ring-inset ring-ink-700">
              {movie?.poster_url && (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-50">{movie?.title}</h2>
              <p className="mt-1 text-sm text-ink-300">
                {showtime && formatDateLong(showtime.show_date)}
              </p>
              <p className="text-sm text-ink-400">
                {showtime && formatTime(showtime.show_time)} · {screen?.name} ·{' '}
                {showtime?.format}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={qrValue} size={120} level="M" />
            </div>
            <p className="mt-2 font-mono text-xs font-semibold tracking-wider text-gold-400">
              {booking.code}
            </p>
          </div>
        </div>

        {/* Perforation */}
        <div className="relative">
          <div className="absolute left-0 top-0 -translate-y-1/2 -translate-x-1/2">
            <span className="block h-6 w-6 rounded-full bg-ink-950" />
          </div>
          <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2">
            <span className="block h-6 w-6 rounded-full bg-ink-950" />
          </div>
          <div className="mx-6 border-t border-dashed border-ink-700" />
        </div>

        {/* Bottom: details grid */}
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <Detail icon={<Armchair className="h-4 w-4" />} label="Seat" value={booking.seat_label} />
          <Detail icon={<Film className="h-4 w-4" />} label="Format" value={showtime?.format ?? '—'} />
          <Detail icon={<CalendarDays className="h-4 w-4" />} label="Date" value={showtime ? new Date(showtime.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} />
          <Detail icon={<Clock className="h-4 w-4" />} label="Time" value={showtime ? formatTime(showtime.show_time) : '—'} />
        </div>

        {/* Snacks + total */}
        <div className="border-t border-ink-700/60 p-6">
          {snackItems.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                Snacks included
              </p>
              <ul className="space-y-1 text-sm text-ink-300">
                {snackItems.map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{s.name} × {s.qty}</span>
                    <span>{centsToUsd(s.qty * s.price_cents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-ink-700/60 pt-4">
            <span className="text-sm text-ink-400">Total paid</span>
            <span className="text-lg font-bold text-gold-400">
              {centsToUsd(ticketTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={() => navigate('/bookings')} className="btn-primary">
          <Download className="h-4 w-4" /> View my bookings
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary">
          <Home className="h-4 w-4" /> Back to movies
        </button>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-500">
        {icon}
        {label}
      </span>
      <span className="text-base font-semibold text-ink-100">{value}</span>
    </div>
  );
}
