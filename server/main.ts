/**
 * '92 Subaru — Deno web server.
 *
 * Serves the static app from ../public and a small JSON API:
 *   GET  /api/content   -> { tracks, tour }   (soundtrack + gig data)
 *   POST /api/bookings  -> { ok }             (submit a booking request → email)
 *   GET  /health        -> { ok, uptime }
 *
 * Bookings are delivered by email (system of record — spec FR-002); nothing
 * is persisted server-side. See server/email.ts for configuration.
 *
 * Run:  deno task start   (or `deno task dev` for auto-reload)
 */

import { CONTENT } from "./data.ts";
import { type BookingInput, sendBookingEmail } from "./email.ts";

const PORT = Number(Deno.env.get("PORT") ?? 8000);
const PUBLIC_DIR = new URL("../public/", import.meta.url);
const STARTED = Date.now();

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function serveStatic(pathname: string): Promise<Response> {
  // Normalize + block path traversal before touching the filesystem.
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const clean = rel.replace(/\\/g, "/").split("/").filter((s) =>
    s && s !== "." && s !== ".."
  ).join("/");
  const target = new URL(clean, PUBLIC_DIR);

  try {
    const stat = await Deno.stat(target);
    if (stat.isDirectory) return serveStatic(pathname + "/");
    const body = await Deno.readFile(target);
    const dot = clean.lastIndexOf(".");
    const type = dot >= 0 ? CONTENT_TYPES[clean.slice(dot)] : undefined;
    return new Response(body, {
      headers: { "content-type": type ?? "application/octet-stream" },
    });
  } catch {
    // Unknown path with no file extension -> let the single-page app handle it.
    if (!clean.includes(".")) return serveStatic("/");
    return new Response("Not Found", { status: 404 });
  }
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

Deno.serve({
  port: PORT,
  onListen: ({ port }) =>
    console.info(`'92 Subaru running → http://localhost:${port}`),
}, async (req) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/health") {
    return json({ ok: true, uptime: (Date.now() - STARTED) / 1000 });
  }

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

  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Not Found", { status: 404 });
  }
  return serveStatic(pathname);
});
