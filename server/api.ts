/**
 * '92 Subaru — shared JSON API handler.
 *
 * One request handler, two entry points (one deploy story, spec FR-016):
 *   server/main.ts     local Deno server (static files + this API)
 *   api/[...slug].ts   Vercel serverless function (vercel-deno runtime)
 *
 * Routes:
 *   GET  /api/content   -> { tracks, tour }   (soundtrack + gig data)
 *   POST /api/bookings  -> { ok }             (booking request → email)
 *   anything else       -> JSON 404           (unknown API routes, FR-021)
 */

import { CONTENT } from "./data.ts";
import { type BookingInput, sendBookingEmail } from "./email.ts";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handlePostBooking(req: Request): Promise<Response> {
  let payload: Partial<BookingInput>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }
  const booking: BookingInput = {
    date: (payload.date ?? "").trim(),
    location: (payload.location ?? "").trim(),
    message: (payload.message ?? "").trim(),
    type: (payload.type ?? "").trim(),
    budget: (payload.budget ?? "").trim(),
  };
  if (!booking.date || !booking.location || !booking.message) {
    return json({
      ok: false,
      error: "Fill in event date, location, and message.",
    }, 422);
  }
  try {
    await sendBookingEmail(booking);
  } catch (e) {
    // Never silently lose a request (CHK001): surface a clear outcome.
    console.error("[booking] email delivery failed:", e);
    return json({
      ok: false,
      error: "Couldn't send your request right now — please try again shortly.",
    }, 502);
  }
  console.info(`[booking] emailed — ${booking.date} @ ${booking.location}`);
  return json({ ok: true }, 201);
}

export function handleApi(req: Request): Promise<Response> | Response {
  const { pathname } = new URL(req.url);

  if (pathname === "/api/content") {
    if (req.method !== "GET") {
      return json({ ok: false, error: "Method Not Allowed" }, 405);
    }
    return json(CONTENT);
  }

  if (pathname === "/api/bookings") {
    if (req.method === "POST") return handlePostBooking(req);
    return json({ ok: false, error: "Method Not Allowed" }, 405);
  }

  return json({ ok: false, error: "Not Found" }, 404);
}
