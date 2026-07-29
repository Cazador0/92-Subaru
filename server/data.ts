/**
 * Content model for the '92 Subaru site.
 *
 * The front-end fetches this from `/api/content`. One single ordered
 * Soundtrack list featuring the band's official set-list recordings streamable
 * directly via embedded YouTube.
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
  yt: string; // YouTube Video ID
  src: string; // static audio URL
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
    { n: "01", t: "Dreams", a: "The Cranberries", y: 1992, d: 269, yt: "q8UCkjbgn5s", src: "/assets/audio/dreams.mp4" },
    { n: "02", t: "Iris", a: "Goo Goo Dolls", y: 1998, d: 289, yt: "nzMBn6Q89zk", src: "/assets/audio/iris.mp4" },
    { n: "03", t: "Kiss Me", a: "Sixpence None the Richer", y: 1997, d: 208, yt: "8OhiOI-b4ms", src: "/assets/audio/kiss-me.mp4" },
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
