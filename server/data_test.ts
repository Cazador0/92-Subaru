// Use an ephemeral in-memory KV before importing the store.
Deno.env.set("KV_PATH", ":memory:");

import { assertEquals } from "@std/assert";
import { addBooking, CONTENT, listBookings } from "./data.ts";

Deno.test("content model has both cassette sides and both tour lists", () => {
  assertEquals(CONTENT.tracks.A.length, 5);
  assertEquals(CONTENT.tracks.B.length, 5);
  assertEquals(CONTENT.tour.upcoming.length, 5);
  assertEquals(CONTENT.tour.past.length, 4);
  assertEquals(CONTENT.tracks.A[0].t, "Smells Like Teen Spirit");
});

Deno.test("addBooking persists and listBookings returns it", async () => {
  const before = (await listBookings()).length;
  const b = await addBooking({
    date: "2026-09-01",
    location: "Trees, Deep Ellum",
    message: "Saturday show",
  });
  assertEquals(typeof b.id, "string");
  assertEquals(typeof b.receivedAt, "string");

  const all = await listBookings();
  assertEquals(all.length, before + 1);
  assertEquals(all.some((x) => x.id === b.id), true);
});

Deno.test("bookings come back in chronological order", async () => {
  await addBooking({ date: "2026-10-01", location: "A", message: "one" });
  await addBooking({ date: "2026-10-02", location: "B", message: "two" });
  const all = await listBookings();
  const times = all.map((b) => b.receivedAt);
  const sorted = [...times].sort();
  assertEquals(times, sorted);
});
