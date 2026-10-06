/**
 * '92 Subaru — local Deno web server.
 *
 * Serves the static app from ../public plus the JSON API in server/api.ts
 * (the same handler the Vercel deployment runs via api/[...slug].ts):
 *   GET  /api/content   -> { tracks, tour }   (soundtrack + gig data)
 *   POST /api/bookings  -> { ok }             (submit a booking request → email)
 *   GET  /health        -> { ok, uptime }     (local liveness only)
 *
 * Bookings are delivered by email (system of record — spec FR-002); nothing
 * is persisted server-side. See server/email.ts for configuration.
 *
 * Run:  deno task start   (or `deno task dev` for auto-reload)
 */

import { handleApi, json } from "./api.ts";

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
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

async function readPublic(
  rel: string,
): Promise<{ body: Uint8Array; type: string } | null> {
  const target = new URL(rel, PUBLIC_DIR);
  try {
    const stat = await Deno.stat(target);
    if (stat.isDirectory) return null;
    const body = await Deno.readFile(target);
    const dot = rel.lastIndexOf(".");
    const type = (dot >= 0 ? CONTENT_TYPES[rel.slice(dot)] : undefined) ??
      "application/octet-stream";
    return { body, type };
  } catch {
    return null;
  }
}

type ByteRange = { start: number; end: number };

function parseRange(header: string, size: number): ByteRange | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const [, s, e] = m;
  if (s === "" && e === "") return null;
  if (s === "") {
    const len = Number(e);
    if (!Number.isInteger(len) || len <= 0) return null;
    const start = Math.max(0, size - len);
    return { start, end: size - 1 };
  }
  const start = Number(s);
  if (!Number.isInteger(start) || start < 0 || start >= size) return null;
  let end = e === "" ? size - 1 : Number(e);
  if (!Number.isInteger(end) || end < start || end >= size) end = size - 1;
  return { start, end };
}

async function serveStatic(
  pathname: string,
  rangeHeader: string | null,
): Promise<Response> {
  // Normalize + block path traversal before touching the filesystem.
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const clean =
    rel.replace(/\\/g, "/").split("/").filter((s) =>
      s && s !== "." && s !== ".."
    ).join("/") || "index.html";

  let file = await readPublic(clean);
  // Clean URLs (mirrors `cleanUrls` on Vercel): /privacy -> privacy.html.
  if (!file && !clean.includes(".")) file = await readPublic(clean + ".html");
  if (file) {
    const headers = new Headers({
      "content-type": file.type,
      "accept-ranges": "bytes",
      "content-length": String(file.body.length),
    });

    if (rangeHeader) {
      const range = parseRange(rangeHeader, file.body.length);
      if (range) {
        const slice = file.body.slice(range.start, range.end + 1);
        headers.set("content-range", `bytes ${range.start}-${range.end}/${file.body.length}`);
        headers.set("content-length", String(slice.length));
        return new Response(slice, { status: 206, headers });
      }
      headers.set("content-range", `bytes */${file.body.length}`);
      return new Response(null, { status: 416, headers });
    }

    return new Response(file.body, { status: 200, headers });
  }

  // Unknown page route -> themed 404 with a real 404 status (FR-021).
  // (Vercel does the same natively: a 404.html in the output directory.)
  const themed = await readPublic("404.html");
  if (themed) {
    return new Response(themed.body, {
      status: 404,
      headers: { "content-type": themed.type },
    });
  }
  return new Response("Not Found", { status: 404 });
}

Deno.serve({
  port: PORT,
  onListen: ({ port }) =>
    console.info(`'92 Subaru running → http://localhost:${port}`),
}, (req) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/health") {
    return json({ ok: true, uptime: (Date.now() - STARTED) / 1000 });
  }

  if (pathname.startsWith("/api/")) return handleApi(req);

  if (req.method !== "GET" && req.method !== "HEAD") {
    return json({ ok: false, error: "Method Not Allowed" }, 405);
  }
  return serveStatic(pathname, req.headers.get("range"));
});
