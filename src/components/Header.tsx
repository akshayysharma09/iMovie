import { useEffect, useState } from 'react';
import { Film, Menu, Ticket, User, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';

interface HeaderProps {
  navigate: (to: string) => void;
  currentPath: string;
}

const NAV = [
  { label: 'Now Showing', to: '/' },
  { label: 'Coming Soon', to: '/coming-soon' },
  { label: 'Snacks', to: '/snacks' },
];

export default function Header({ navigate, currentPath }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { navigate: nav } = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (to: string) => {
    navigate(to);
    setOpen(false);
  };

  const isActive = (to: string) =>
    to === '/' ? currentPath === '/' : currentPath.startsWith(to);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ink-950/85 backdrop-blur-xl ring-1 ring-inset ring-ink-800'
          : 'bg-gradient-to-b from-ink-950/90 to-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <button
          onClick={() => go('/')}
          className="group flex items-center gap-2.5"
          aria-label="iMovies home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-ink-950 shadow-glow transition-transform group-hover:scale-105">
            <Film className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="text-xl font-bold tracking-tight text-ink-50">
            i<span className="text-gold-400">Movies</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <button
              key={item.to}
              onClick={() => go(item.to)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? 'text-gold-400'
                  : 'text-ink-200 hover:text-ink-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Account actions */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <button
                onClick={() => go('/bookings')}
                className="btn-ghost"
              >
                <Ticket className="h-4 w-4" />
                My Bookings
              </button>
              <button
                onClick={() => {
                  signOut();
                  nav('/');
                }}
                className="btn-secondary"
              >
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => go('/signin')} className="btn-primary">
              <User className="h-4 w-4" />
              Sign in
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-ink-200 hover:bg-ink-800 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden">
          <div className="mx-4 mb-3 rounded-2xl bg-ink-900/95 p-3 ring-1 ring-inset ring-ink-700 backdrop-blur-xl">
            {NAV.map((item) => (
              <button
                key={item.to}
                onClick={() => go(item.to)}
                className={`block w-full rounded-lg px-4 py-3 text-left text-sm font-medium ${
                  isActive(item.to) ? 'text-gold-400' : 'text-ink-200'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="my-2 h-px bg-ink-700/60" />
            {user ? (
              <>
                <button
                  onClick={() => go('/bookings')}
                  className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-ink-200"
                >
                  My Bookings
                </button>
                <button
                  onClick={() => {
                    signOut();
                    go('/');
                  }}
                  className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-ink-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => go('/signin')}
                className="btn-primary w-full"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
