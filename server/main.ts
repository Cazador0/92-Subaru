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

async function serveStatic(pathname: string): Promise<Response> {
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
    return new Response(file.body, {
      headers: { "content-type": file.type },
    });
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
  return serveStatic(pathname);
});
