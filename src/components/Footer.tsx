import { Film, MapPin, Clock, Instagram, Twitter, Facebook } from 'lucide-react';

interface FooterProps {
  navigate: (to: string) => void;
}

export default function Footer({ navigate }: FooterProps) {
  return (
    <footer className="mt-20 border-t border-ink-800/80 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-ink-950">
                <Film className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold text-ink-50">
                i<span className="text-gold-400">Movies</span>
              </span>
            </button>
            <p className="mt-4 max-w-xs text-sm text-ink-400">
              Your neighbourhood cinema. Big screen magic, comfy seats, and the
              best popcorn in town.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
              Explore
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ['Now Showing', '/'],
                ['Coming Soon', '/coming-soon'],
                ['Snacks & Combos', '/snacks'],
                ['My Bookings', '/bookings'],
              ].map(([label, to]) => (
                <li key={to}>
                  <button
                    onClick={() => navigate(to)}
                    className="text-ink-400 transition-colors hover:text-gold-300"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
              Visit
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-ink-400">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gold-400" />
                42 Lumière Lane, Downtown
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-gold-400" />
                Open daily, 11:00 AM – 11:30 PM
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
              Follow
            </h4>
            <div className="mt-4 flex gap-2">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-ink-300 ring-1 ring-inset ring-ink-700 transition-colors hover:text-gold-300"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-800/80 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} iMovies. All rights reserved.</p>
          <p>Crafted for movie lovers.</p>
        </div>
      </div>
    </footer>
  );
}
