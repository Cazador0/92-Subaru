/**
 * '92 Subaru — Deno web server.
 *
 * Serves the static app from ../public and a small JSON API:
 *   GET  /api/content   -> { tracks, tour }        (mixtape + gig data)
 *   GET  /api/bookings  -> Booking[]               (submitted booking requests)
 *   POST /api/bookings  -> { ok, booking }         (submit a booking request)
 *   GET  /health        -> { ok, uptime }
 *
 * Run:  deno task start   (or `deno task dev` for auto-reload)
 */

import {
  addBooking,
  type BookingInput,
  CONTENT,
  listBookings,
} from "./data.ts";

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
  const date = (payload.date ?? "").trim();
  const location = (payload.location ?? "").trim();
  const message = (payload.message ?? "").trim();
  if (!date || !location || !message) {
    return json({
      ok: false,
      error: "Fill in event date, location, and message.",
    }, 422);
  }
  const booking = await addBooking({
    date,
    location,
    message,
    type: (payload.type ?? "").trim(),
    budget: (payload.budget ?? "").trim(),
  });
  console.info(`[booking] ${booking.id} — ${date} @ ${location}`);
  return json({ ok: true, booking }, 201);
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
    if (req.method === "GET") return json(await listBookings());
    return json({ ok: false, error: "Method Not Allowed" }, 405);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Not Found", { status: 404 });
  }
  return serveStatic(pathname);
});
