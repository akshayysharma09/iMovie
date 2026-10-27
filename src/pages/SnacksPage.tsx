import { useEffect, useState } from 'react';
import { Popcorn, Coffee, Candy, UtensilsCrossed, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Snack } from '@/lib/types';
import { centsToUsd } from '@/lib/types';
import { SectionHeading, Spinner, ErrorState } from '@/components/ui';
import { useBookingFlow } from '@/lib/bookingFlow';

const CATEGORIES = [
  { key: 'popcorn', label: 'Popcorn', icon: Popcorn },
  { key: 'drinks', label: 'Drinks', icon: Coffee },
  { key: 'combos', label: 'Combos', icon: UtensilsCrossed },
  { key: 'candy', label: 'Candy', icon: Candy },
];

export default function SnacksPage() {
  const [allSnacks, setAllSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { snacks: cart, setSnacks } = useBookingFlow();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('snacks').select('*').order('name');
      if (!active) return;
      if (error) setError(error.message);
      else setAllSnacks(data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const qty = (id: string) => cart.find((c) => c.id === id)?.qty ?? 0;
  const setQty = (s: Snack, delta: number) => {
    const current = qty(s.id);
    const next = Math.max(0, current + delta);
    let updated = cart.filter((c) => c.id !== s.id);
    if (next > 0) {
      updated = [
        ...updated,
        { id: s.id, name: s.name, qty: next, price_cents: Number(s.price_cents) },
      ];
    }
    setSnacks(updated);
  };

  if (loading) return <Spinner label="Loading the concession menu…" />;
  if (error) return <ErrorState message={error} />;

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.qty * c.price_cents, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Concession stand"
        title="Snacks & Combos"
      />
      <p className="-mt-4 mb-8 text-sm text-ink-400">
        Build your order ahead of the show and skip the queue. Your selections
        carry over to checkout when you book a ticket.
      </p>

      <div className="space-y-10">
        {CATEGORIES.map((cat) => {
          const items = allSnacks.filter((s) => s.category === cat.key);
          if (items.length === 0) return null;
          const Icon = cat.icon;
          return (
            <section key={cat.key}>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-100">
                <Icon className="h-5 w-5 text-gold-400" />
                {cat.label}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="flex gap-4 rounded-2xl bg-ink-800/60 p-4 ring-1 ring-inset ring-ink-700/60"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-900">
                      {s.image_url && (
                        <img
                          src={s.image_url}
                          alt={s.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-ink-100">{s.name}</h4>
                        <span className="font-semibold text-gold-400">
                          {centsToUsd(Number(s.price_cents))}
                        </span>
                      </div>
                      {s.description && (
                        <p className="mt-1 text-xs text-ink-400 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-end gap-2 pt-3">
                        {qty(s.id) > 0 && (
                          <>
                            <button
                              onClick={() => setQty(s, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700 text-ink-100 hover:bg-ink-600"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium text-ink-100">
                              {qty(s.id)}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => setQty(s, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400 text-ink-950 hover:bg-gold-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {cartCount > 0 && (
        <div className="sticky bottom-4 mt-10">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl bg-ink-900/95 px-5 py-4 ring-1 ring-inset ring-gold-400/40 backdrop-blur-xl shadow-card">
            <div>
              <p className="text-sm text-ink-400">
                {cartCount} item{cartCount > 1 ? 's' : ''} in your order
              </p>
              <p className="text-lg font-bold text-gold-400">
                {centsToUsd(cartTotal)}
              </p>
            </div>
            <p className="text-xs text-ink-400">
              These will be added at checkout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
