/**
 * Content + booking store for the '92 Subaru site.
 *
 * `tracks` and `tour` are the same data the Xerox-Rave prototype hard-coded in
 * its logic class. Serving them from here is what turns the design scaffold into
 * a real app: the front-end fetches `/api/content` instead of embedding the
 * arrays. The shape mirrors the Firestore collections described in
 * `firestore.rules` and seeded by `research/scripts/seed.js`
 * (`presets` = mixtape tracks, `events` = tour dates) — we serve them locally
 * from Deno because no Firebase service-account credentials are present.
 */

export interface Track {
  n: string; // catalog no. e.g. "A1"
  t: string; // title
  a: string; // artist
  y: number; // year
  d: number; // duration, seconds
}

export interface Gig {
  date: string;
  venue: string;
  city: string;
  status: "SOLD OUT" | "GET TICKETS" | "PLAYED";
}

export interface Content {
  tracks: { A: Track[]; B: Track[] };
  tour: { upcoming: Gig[]; past: Gig[] };
}

export const CONTENT: Content = {
  tracks: {
    A: [
      { n: "A1", t: "Smells Like Teen Spirit", a: "Nirvana", y: 1991, d: 301 },
      { n: "A2", t: "Creep", a: "Radiohead", y: 1992, d: 236 },
      { n: "A3", t: "Wonderwall", a: "Oasis", y: 1995, d: 258 },
      { n: "A4", t: "Losing My Religion", a: "R.E.M.", y: 1991, d: 268 },
      { n: "A5", t: "Bittersweet Symphony", a: "The Verve", y: 1997, d: 358 },
    ],
    B: [
      {
        n: "B1",
        t: "I Want It That Way",
        a: "Backstreet Boys",
        y: 1999,
        d: 213,
      },
      {
        n: "B2",
        t: "...Baby One More Time",
        a: "Britney Spears",
        y: 1998,
        d: 211,
      },
      { n: "B3", t: "Waterfalls", a: "TLC", y: 1995, d: 279 },
      { n: "B4", t: "Wannabe", a: "Spice Girls", y: 1996, d: 173 },
      { n: "B5", t: "Gangsta's Paradise", a: "Coolio", y: 1995, d: 240 },
    ],
  },
  tour: {
    upcoming: [
      {
        date: "AUG 14",
        venue: "Trees",
        city: "Deep Ellum, Dallas",
        status: "SOLD OUT",
      },
      {
        date: "AUG 22",
        venue: "Tulips FTW",
        city: "Fort Worth",
        status: "GET TICKETS",
      },
      {
        date: "SEP 05",
        venue: "The Factory",
        city: "Deep Ellum, Dallas",
        status: "GET TICKETS",
      },
      {
        date: "SEP 19",
        venue: "Dan's Silverleaf",
        city: "Denton",
        status: "SOLD OUT",
      },
      {
        date: "OCT 03",
        venue: "Texas Live!",
        city: "Arlington",
        status: "GET TICKETS",
      },
    ],
    past: [
      {
        date: "MAY 10",
        venue: "Granada Theater",
        city: "Greenville Ave, Dallas",
        status: "PLAYED",
      },
      {
        date: "APR 18",
        venue: "Ridglea Theater",
        city: "Fort Worth",
        status: "PLAYED",
      },
      {
        date: "MAR 21",
        venue: "Gas Monkey Live",
        city: "Dallas",
        status: "PLAYED",
      },
      {
        date: "FEB 07",
        venue: "The Rustic",
        city: "Uptown, Dallas",
        status: "PLAYED",
      },
    ],
  },
};

// ---- Booking store (Deno KV) -----------------------------------------------
//
// KV works on every target with no code change:
//   • Deno Deploy — native, globally-replicated, persistent (no config).
//   • Fly / Docker / VPS — SQLite-backed; point KV_PATH at a persistent volume
//     (e.g. KV_PATH=/data/kv.sqlite). Unset -> Deno's default local location.
//   • Tests — set KV_PATH=":memory:" for an ephemeral in-memory database.

export interface BookingInput {
  date: string;
  type?: string;
  location: string;
  budget?: string;
  message: string;
}

export interface Booking extends BookingInput {
  id: string;
  receivedAt: string;
}

let _kv: Deno.Kv | null = null;
async function kv(): Promise<Deno.Kv> {
  if (!_kv) {
    const path = Deno.env.get("KV_PATH");
    // On Deno Deploy openKv() must be called with no path; elsewhere a path
    // (or :memory:) selects the SQLite backing store.
    _kv = path ? await Deno.openKv(path) : await Deno.openKv();
  }
  return _kv;
}

// Keys are ["bookings", <ISO timestamp>, <id>]: the ISO prefix sorts
// lexicographically, so a prefix list returns bookings in chronological order.
export async function addBooking(input: BookingInput): Promise<Booking> {
  const record: Booking = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    ...input,
  };
  const db = await kv();
  await db.set(["bookings", record.receivedAt, record.id], record);
  return record;
}

export async function listBookings(): Promise<Booking[]> {
  const db = await kv();
  const out: Booking[] = [];
  for await (const entry of db.list<Booking>({ prefix: ["bookings"] })) {
    out.push(entry.value);
  }
  return out;
}
