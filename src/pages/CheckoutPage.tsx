import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Showtime, Screen, Snack, SnackItem } from '@/lib/types';
import { centsToUsd, formatDateLong, formatTime } from '@/lib/types';
import { Spinner, ErrorState } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useBookingFlow } from '@/lib/bookingFlow';

interface CheckoutPageProps {
  showtimeId: string;
  navigate: (to: string) => void;
}

export default function CheckoutPage({ showtimeId, navigate }: CheckoutPageProps) {
  const { user } = useAuth();
  const { pending, snacks, setSnacks, clear } = useBookingFlow();
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [allSnacks, setAllSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [payment, setPayment] = useState({
    name: '',
    card: '',
    exp: '',
    cvc: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
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
      const { data: sn } = await supabase.from('snacks').select('*').order('name');
      if (active) setAllSnacks(sn ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [showtimeId]);

  if (loading) return <Spinner label="Preparing your checkout…" />;
  if (error || !showtime) return <ErrorState message={error ?? 'Showtime not found.'} />;
  if (!pending || pending.seats.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-ink-300">
          Your seat selection has expired. Please choose a showtime and seats
          again.
        </p>
        <button onClick={() => navigate('/')} className="btn-secondary mt-6">
          Browse movies
        </button>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-ink-300">
          Please sign in to complete your booking.
        </p>
        <button
          onClick={() => navigate(`/signin?next=checkout/${showtimeId}`)}
          className="btn-primary mt-6"
        >
          Sign in to continue
        </button>
      </div>
    );
  }

  const screen = showtime.screen as unknown as Screen | undefined;
  const movie = showtime.movie as unknown as { title: string; slug: string } | undefined;
  const priceEach = Number(showtime.base_price);
  const seatsTotal = pending.seats.length * priceEach;
  const snacksTotal = snacks.reduce((s, c) => s + c.qty * c.price_cents, 0);
  const grandTotal = seatsTotal + snacksTotal;

  const snackQty = (id: string) => snacks.find((c) => c.id === id)?.qty ?? 0;
  const setSnackQty = (s: Snack, delta: number) => {
    const current = snackQty(s.id);
    const next = Math.max(0, current + delta);
    let updated = snacks.filter((c) => c.id !== s.id);
    if (next > 0) {
      updated = [
        ...updated,
        { id: s.id, name: s.name, qty: next, price_cents: Number(s.price_cents) },
      ];
    }
    setSnacks(updated);
  };

  const handlePay = async () => {
    setFormError(null);
    // Basic client-side validation (this is a demo; no real charge happens)
    if (!payment.name.trim()) return setFormError('Enter the name on your card.');
    const digits = payment.card.replace(/\s+/g, '');
    if (digits.length < 15 || !/^\d+$/.test(digits))
      return setFormError('Enter a valid card number.');
    if (!/^\d{2}\/\d{2}$/.test(payment.exp))
      return setFormError('Expiry must be in MM/YY format.');
    if (!/^\d{3,4}$/.test(payment.cvc))
      return setFormError('Enter a valid CVC.');

    setPlacing(true);
    // Insert one booking row per seat
    try {
      for (const seat of pending.seats) {
        const { error } = await supabase.from('bookings').insert({
          showtime_id: showtimeId,
          seat_label: seat,
          price_cents: priceEach,
          snack_items: snacks as SnackItem[],
          total_cents: grandTotal,
          status: 'confirmed',
        });
        if (error) throw error;
      }
      const code = pending.code ?? null;
      clear();
      // Go to confirmation using the first seat as the representative ticket
      navigate(`/ticket/${showtimeId}/${pending.seats[0]}`);
      void code;
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : 'Booking failed. Please try again.'
      );
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(`/seats/${showtimeId}`)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-ink-50"
      >
        <ArrowLeft className="h-4 w-4" /> Back to seats
      </button>

      <h1 className="text-2xl font-bold text-ink-50">Checkout</h1>
      <p className="mt-1 text-sm text-ink-400">
        Review your order, add snacks, and pay to receive your e-tickets.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: order + snacks */}
        <div className="space-y-8">
          {/* Booking summary */}
          <section className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-ink-100">
              Your booking
            </h2>
            <div className="flex items-start gap-4">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                {(showtime.movie as unknown as { poster_url?: string })?.poster_url && (
                  <img
                    src={(showtime.movie as unknown as { poster_url?: string }).poster_url!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-50">{movie?.title}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {formatDateLong(showtime.show_date)} · {formatTime(showtime.show_time)}
                </p>
                <p className="text-xs text-ink-400">
                  {screen?.name} · {showtime.format}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-ink-700/60 pt-4 text-sm">
              <div className="flex justify-between text-ink-300">
                <span>Seats ({pending.seats.length})</span>
                <span>{pending.seats.join(', ')}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Ticket price</span>
                <span>
                  {centsToUsd(priceEach)} × {pending.seats.length} ={' '}
                  {centsToUsd(seatsTotal)}
                </span>
              </div>
            </div>
          </section>

          {/* Snacks */}
          <section className="card p-5">
            <h2 className="mb-4 flex items-center justify-between text-base font-semibold text-ink-100">
              Add snacks & combos
              {snacks.length > 0 && (
                <button
                  onClick={() => setSnacks([])}
                  className="inline-flex items-center gap-1 text-xs font-normal text-ink-400 hover:text-error-300"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {allSnacks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl bg-ink-900/50 p-3 ring-1 ring-inset ring-ink-700/60"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-100">{s.name}</p>
                    <p className="text-xs text-gold-400">
                      {centsToUsd(Number(s.price_cents))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {snackQty(s.id) > 0 && (
                      <>
                        <button
                          onClick={() => setSnackQty(s, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-700 text-ink-100 hover:bg-ink-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs text-ink-100">
                          {snackQty(s.id)}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => setSnackQty(s, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-gold-400 text-ink-950 hover:bg-gold-300"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink-100">
              <CreditCard className="h-4 w-4 text-gold-400" /> Payment details
            </h2>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-300">
                  Name on card
                </label>
                <input
                  className="input"
                  placeholder="Jane Moviegoer"
                  value={payment.name}
                  onChange={(e) => setPayment({ ...payment, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-300">
                  Card number
                </label>
                <input
                  className="input font-mono tracking-wider"
                  placeholder="4242 4242 4242 4242"
                  value={payment.card}
                  onChange={(e) => setPayment({ ...payment, card: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-300">
                    Expiry
                  </label>
                  <input
                    className="input"
                    placeholder="MM/YY"
                    value={payment.exp}
                    onChange={(e) => setPayment({ ...payment, exp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-300">
                    CVC
                  </label>
                  <input
                    className="input"
                    placeholder="123"
                    value={payment.cvc}
                    onChange={(e) => setPayment({ ...payment, cvc: e.target.value })}
                  />
                </div>
              </div>
            </div>
            {formError && (
              <p className="mt-3 text-sm text-error-300">{formError}</p>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
              <Lock className="h-3 w-3" /> This is a demo checkout — no real
              charge is made.
            </p>
          </section>
        </div>

        {/* Right: order total */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-ink-100">
              Order summary
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-300">
                <dt>
                  Tickets × {pending.seats.length}
                </dt>
                <dd>{centsToUsd(seatsTotal)}</dd>
              </div>
              {snacks.map((s) => (
                <div key={s.id} className="flex justify-between text-ink-300">
                  <dt>
                    {s.name} × {s.qty}
                  </dt>
                  <dd>{centsToUsd(s.qty * s.price_cents)}</dd>
                </div>
              ))}
              {snacks.length === 0 && (
                <p className="text-xs text-ink-500">No snacks added.</p>
              )}
            </dl>
            <div className="mt-4 flex justify-between border-t border-ink-700/60 pt-4">
              <span className="font-semibold text-ink-100">Total</span>
              <span className="text-xl font-bold text-gold-400">
                {centsToUsd(grandTotal)}
              </span>
            </div>
            <button
              onClick={handlePay}
              disabled={placing}
              className="btn-primary mt-5 w-full"
            >
              {placing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/40 border-t-ink-950" />
                  Processing…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Pay {centsToUsd(grandTotal)}
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
