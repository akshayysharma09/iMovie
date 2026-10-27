/*
# iMovies database schema

Creates the full schema for the iMovies single-cinema booking site.

## Tables

### movies
Catalog of films shown by the cinema.
- `id` (uuid, pk)
- `title` (text, not null) — movie title
- `slug` (text, unique) — url-safe identifier
- `synopsis` (text) — plot summary
- `poster_url` (text) — portrait poster image
- `backdrop_url` (text) — wide backdrop image
- `trailer_url` (text) — youtube trailer link
- `rating` (numeric, 0–10) — critic/aggregate rating
- `runtime_minutes` (int) — film length
- `genres` (text[]) — genre tags
- `cast_names` (text[]) — lead cast names
- `director` (text)
- `certificate` (text) — e.g. PG-13, R
- `release_date` (date) — theatrical release date
- `status` (text) — 'now_showing' | 'coming_soon'
- `created_at` (timestamptz)

### screens
The physical auditoriums in the single cinema.
- `id` (uuid, pk)
- `name` (text) — e.g. "Screen 1"
- `rows` (int) — number of seat rows
- `seats_per_row` (int) — seats per row

### showtimes
A screening of a movie on a screen at a specific date/time.
- `id` (uuid, pk)
- `movie_id` (uuid, fk -> movies)
- `screen_id` (uuid, fk -> screens)
- `show_date` (date)
- `show_time` (time)
- `base_price` (numeric) — ticket price in cents
- `format` (text) — e.g. "2D", "3D", "IMAX"

### bookings
A user's reservation for a showtime.
- `id` (uuid, pk)
- `user_id` (uuid, fk -> auth.users, default auth.uid())
- `showtime_id` (uuid, fk -> showtimes)
- `seat_label` (text) — e.g. "A1"
- `price_cents` (numeric) — paid per seat
- `snack_items` (jsonb) — [{id, name, qty, price_cents}]
- `total_cents` (numeric) — grand total
- `status` (text) — 'confirmed' | 'cancelled'
- `code` (text, unique) — ticket confirmation code
- `created_at`

### snacks
Concession items for the snacks & combos menu.
- `id` (uuid, pk)
- `name` (text)
- `description` (text)
- `price_cents` (numeric)
- `category` (text) — 'popcorn' | 'drinks' | 'combos' | 'candy'
- `image_url` (text)

## Security

The app has sign-in for bookings. Read-only catalog tables (movies, screens, showtimes, snacks) are public to anon + authenticated so unauthenticated visitors can browse. Bookings are owner-scoped to authenticated users with the standard 4 CRUD policies and a DEFAULT auth.uid() on user_id.
*/

-- ====== movies ======
CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  synopsis text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  rating numeric(3,1) DEFAULT 0,
  runtime_minutes int DEFAULT 120,
  genres text[] DEFAULT '{}',
  cast_names text[] DEFAULT '{}',
  director text,
  certificate text,
  release_date date,
  status text DEFAULT 'now_showing',
  created_at timestamptz DEFAULT now()
);

-- ====== screens ======
CREATE TABLE IF NOT EXISTS screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rows int NOT NULL DEFAULT 10,
  seats_per_row int NOT NULL DEFAULT 12,
  created_at timestamptz DEFAULT now()
);

-- ====== showtimes ======
CREATE TABLE IF NOT EXISTS showtimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  screen_id uuid NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  show_date date NOT NULL,
  show_time time NOT NULL,
  base_price numeric NOT NULL DEFAULT 1250,
  format text DEFAULT '2D',
  created_at timestamptz DEFAULT now()
);

-- ====== snacks ======
CREATE TABLE IF NOT EXISTS snacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_cents numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'popcorn',
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- ====== bookings ======
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  seat_label text NOT NULL,
  price_cents numeric NOT NULL DEFAULT 0,
  snack_items jsonb DEFAULT '[]',
  total_cents numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed',
  code text UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS everywhere
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE snacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Grants: catalog tables are publicly readable
GRANT SELECT ON movies TO anon, authenticated;
GRANT SELECT ON screens TO anon, authenticated;
GRANT SELECT ON showtimes TO anon, authenticated;
GRANT SELECT ON snacks TO anon, authenticated;

-- Grants: bookings only for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;

-- Catalog read policies (public)
DROP POLICY IF EXISTS "public_read_movies" ON movies;
CREATE POLICY "public_read_movies" ON movies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_screens" ON screens;
CREATE POLICY "public_read_screens" ON screens FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_showtimes" ON showtimes;
CREATE POLICY "public_read_showtimes" ON showtimes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_snacks" ON snacks;
CREATE POLICY "public_read_snacks" ON snacks FOR SELECT TO anon, authenticated USING (true);

-- Bookings: owner-scoped CRUD
DROP POLICY IF EXISTS "select_own_bookings" ON bookings;
CREATE POLICY "select_own_bookings" ON bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings" ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings" ON bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bookings" ON bookings;
CREATE POLICY "delete_own_bookings" ON bookings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_date ON showtimes(show_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime ON bookings(showtime_id);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
