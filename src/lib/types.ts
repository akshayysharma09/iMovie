export type MovieStatus = 'now_showing' | 'coming_soon';

export interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  rating: number;
  runtime_minutes: number;
  genres: string[];
  cast_names: string[];
  director: string | null;
  certificate: string | null;
  release_date: string | null;
  status: MovieStatus;
  created_at: string;
}

export interface Screen {
  id: string;
  name: string;
  rows: number;
  seats_per_row: number;
  created_at: string;
}

export interface Showtime {
  id: string;
  movie_id: string;
  screen_id: string;
  show_date: string;
  show_time: string;
  base_price: number;
  format: string;
  created_at: string;
  // joined fields
  movie?: Movie;
  screen?: Screen;
}

export interface Snack {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  image_url: string | null;
  created_at: string;
}

export interface SnackItem {
  id: string;
  name: string;
  qty: number;
  price_cents: number;
}

export interface Booking {
  id: string;
  user_id: string;
  showtime_id: string;
  seat_label: string;
  price_cents: number;
  snack_items: SnackItem[];
  total_cents: number;
  status: string;
  code: string;
  created_at: string;
  // joined fields
  showtime?: Showtime;
}

export const centsToUsd = (cents: number): string =>
  `$${(cents / 100).toFixed(2)}`;

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateLong = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  // time is "HH:MM:SS" or "HH:MM"
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
};
