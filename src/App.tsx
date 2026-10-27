import { useMemo } from 'react';
import { AuthProvider } from '@/lib/auth';
import { BookingFlowProvider } from '@/lib/bookingFlow';
import { useRouter, matchRoute } from '@/lib/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import MoviePage from '@/pages/MoviePage';
import ComingSoonPage from '@/pages/ComingSoonPage';
import SnacksPage from '@/pages/SnacksPage';
import SeatsPage from '@/pages/SeatsPage';
import CheckoutPage from '@/pages/CheckoutPage';
import TicketPage from '@/pages/TicketPage';
import SignInPage from '@/pages/SignInPage';
import BookingsPage from '@/pages/BookingsPage';

function Routed() {
  const { route, navigate } = useRouter();
  const path = route.path;

  let page: React.ReactNode = null;
  let showChrome = true;

  const movieMatch = matchRoute(path, '/movie/:slug');
  const seatsMatch = matchRoute(path, '/seats/:showtimeId');
  const checkoutMatch = matchRoute(path, '/checkout/:showtimeId');
  const ticketMatch = matchRoute(path, '/ticket/:showtimeId/:seat');

  if (path === '/' || path === '') {
    page = <HomePage navigate={navigate} />;
  } else if (path === '/coming-soon') {
    page = <ComingSoonPage navigate={navigate} />;
  } else if (path === '/snacks') {
    page = <SnacksPage />;
  } else if (path === '/signin') {
    page = <SignInPage navigate={navigate} />;
  } else if (path === '/bookings') {
    page = <BookingsPage navigate={navigate} />;
  } else if (movieMatch) {
    page = <MoviePage slug={movieMatch.slug} navigate={navigate} />;
  } else if (seatsMatch) {
    page = <SeatsPage showtimeId={seatsMatch.showtimeId} navigate={navigate} />;
  } else if (checkoutMatch) {
    page = <CheckoutPage showtimeId={checkoutMatch.showtimeId} navigate={navigate} />;
  } else if (ticketMatch) {
    page = (
      <TicketPage
        showtimeId={ticketMatch.showtimeId}
        seatLabel={ticketMatch.seat}
        navigate={navigate}
      />
    );
  } else {
    page = (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-ink-50">Page not found</h1>
        <p className="mt-2 text-ink-400">
          The page you're looking for has left the theatre.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">
          Back to movies
        </button>
      </div>
    );
  }

  void useMemo; // keep import used in case of future memoization

  return (
    <div className="flex min-h-screen flex-col">
      {showChrome && <Header navigate={navigate} currentPath={path} />}
      <main className="flex-1">{page}</main>
      {showChrome && <Footer navigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BookingFlowProvider>
        <Routed />
      </BookingFlowProvider>
    </AuthProvider>
  );
}
