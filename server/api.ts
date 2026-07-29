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
import { clientIp, RateLimiter } from "./spam.ts";

const limiter = new RateLimiter();

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handlePostBooking(req: Request): Promise<Response> {
  // Rate limit before doing any work (FR-004).
  if (!limiter.allow(clientIp(req))) {
    return json({
      ok: false,
      error: "Too many requests — please wait a few minutes and try again.",
    }, 429);
  }

  let payload: Partial<BookingInput> & { website?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  // Honeypot: humans never see the "website" field. A filled honeypot gets
  // the normal confirmation but no email is sent (fake success, FR-004).
  if ((payload.website ?? "").trim()) {
    console.info("[booking] honeypot hit — fake success, no email");
    return json({ ok: true }, 201);
  }

  const booking: BookingInput = {
    firstName: (payload.firstName ?? "").trim(),
    lastName: (payload.lastName ?? "").trim(),
    email: (payload.email ?? "").trim(),
    phone: (payload.phone ?? "").trim(),
    date: (payload.date ?? "").trim(),
    type: (payload.type ?? "").trim(),
    location: (payload.location ?? "").trim(),
    budget: (payload.budget ?? "").trim(),
    message: (payload.message ?? "").trim(),
  };
  // Required fields per FR-001 (deeper validation — date bounds, email
  // format, length caps — is issue #6).
  const missing = ([
    ["firstName", "first name"],
    ["lastName", "last name"],
    ["email", "email"],
    ["date", "event date"],
    ["location", "location"],
    ["message", "message"],
  ] as const).filter(([k]) => !booking[k]).map(([, label]) => label);
  if (missing.length) {
    return json({
      ok: false,
      error: `Fill in: ${missing.join(", ")}.`,
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
