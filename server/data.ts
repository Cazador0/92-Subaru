/**
 * Content model for the '92 Subaru site.
 *
 * The front-end fetches this from `/api/content`. One single ordered
 * Soundtrack list (no Side A/B — removed per spec FR-007). Track picks are
 * provisional placeholders drawn from the band's stated set-list artists
 * (copy-deck.md §About, Para 2) until the owner provides YouTube URLs (#12).
 *
 * Bookings are NOT stored here — email is the system of record (FR-002);
 * see server/email.ts.
 */

export interface Track {
  n: string; // track no. e.g. "01"
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
  tracks: Track[];
  tour: { upcoming: Gig[]; past: Gig[] };
}

export const CONTENT: Content = {
  tracks: [
    { n: "01", t: "Wonderwall", a: "Oasis", y: 1995, d: 258 },
    { n: "02", t: "Semi-Charmed Life", a: "Third Eye Blind", y: 1997, d: 268 },
    { n: "03", t: "Iris", a: "Goo Goo Dolls", y: 1998, d: 289 },
    { n: "04", t: "Zombie", a: "The Cranberries", y: 1994, d: 306 },
    { n: "05", t: "Don't Speak", a: "No Doubt", y: 1996, d: 263 },
    { n: "06", t: "Creep", a: "Radiohead", y: 1992, d: 236 },
    { n: "07", t: "Basket Case", a: "Green Day", y: 1994, d: 181 },
    { n: "08", t: "What's Up?", a: "4 Non Blondes", y: 1993, d: 295 },
    { n: "09", t: "Hey Jealousy", a: "Gin Blossoms", y: 1992, d: 236 },
    { n: "10", t: "All Star", a: "Smash Mouth", y: 1999, d: 200 },
  ],
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
