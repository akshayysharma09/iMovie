import { useState, useEffect } from 'react';
import { Film, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useBookingFlow } from '@/lib/bookingFlow';

interface SignInPageProps {
  navigate: (to: string) => void;
}

export default function SignInPage({ navigate }: SignInPageProps) {
  const { signIn, signUp, user } = useAuth();
  const { pending, snacks } = useBookingFlow();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    // Parse ?next= from hash path
    const hash = window.location.hash.replace(/^#/, '');
    const idx = hash.indexOf('?');
    if (idx >= 0) {
      const params = new URLSearchParams(hash.slice(idx + 1));
      const n = params.get('next');
      if (n) setNext(n);
    }
  }, []);

  useEffect(() => {
    if (user) {
      redirectAfterAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const redirectAfterAuth = () => {
    if (next === 'checkout' && pending && pending.seats.length > 0) {
      navigate(`/checkout/${pending.showtimeId}`);
    } else if (next) {
      navigate(`/${next}`);
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const res =
      mode === 'signin' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    // On signUp, Supabase returns a session immediately when email confirmation is off.
    redirectAfterAuth();
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center gap-1.5 self-start text-sm text-ink-300 hover:text-ink-50"
      >
        <ArrowLeft className="h-4 w-4" /> Back to movies
      </button>

      <div className="card p-8 animate-fadeIn">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400 text-ink-950 shadow-glow">
            <Film className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink-50">
            {mode === 'signin' ? 'Welcome back' : 'Join iMovies'}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {mode === 'signin'
              ? 'Sign in to book tickets and view your bookings.'
              : 'Create an account to start booking your cinema nights.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-ink-900 p-1">
          <button
            onClick={() => setMode('signin')}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === 'signin' ? 'bg-gold-400 text-ink-950' : 'text-ink-300 hover:text-ink-50'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              mode === 'signup' ? 'bg-gold-400 text-ink-950' : 'text-ink-300 hover:text-ink-50'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="email"
                className="input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="password"
                className="input pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-error-900/30 p-3 text-sm text-error-300 ring-1 ring-inset ring-error-500/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading
              ? 'Please wait…'
              : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>

        {next === 'checkout' && pending && (
          <p className="mt-4 text-center text-xs text-ink-500">
            We'll take you back to your checkout once you're signed in.
            {snacks.length > 0 && ` Your ${snacks.length} snack item(s) are saved.`}
          </p>
        )}
      </div>
    </div>
  );
}
