/**
 * Booking-form spam protection (spec FR-004):
 *
 *   1. Honeypot — a hidden "website" field humans never see. A filled
 *      honeypot gets a fake success (confirmation shown, no email sent).
 *   2. Rate limit — per-IP sliding window, in-memory. On serverless each
 *      instance keeps its own window; good enough for scaffolding.
 */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/** Per-IP sliding-window limiter: at most `max` hits per `windowMs`. */
export class RateLimiter {
  #hits = new Map<string, number[]>();
  constructor(
    readonly max = RATE_LIMIT_MAX,
    readonly windowMs = RATE_LIMIT_WINDOW_MS,
  ) {}

  /** Record a hit for `ip` at `now`; returns false when over the limit. */
  allow(ip: string, now = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const recent = (this.#hits.get(ip) ?? []).filter((t) => t > cutoff);
    if (recent.length >= this.max) {
      this.#hits.set(ip, recent);
      return false;
    }
    recent.push(now);
    this.#hits.set(ip, recent);
    return true;
  }
}

/** Requester IP for rate limiting: first x-forwarded-for hop (set by
 * Vercel), falling back to a shared bucket locally. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "local";
}
