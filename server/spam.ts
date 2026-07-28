/**
 * Booking-form spam protection (spec FR-004):
 *
 *   1. Google reCAPTCHA v2 checkbox — token verified server-side. If the
 *      client script never loaded, the form fails OPEN: no token arrives and
 *      the submission proceeds, still guarded by 2. and 3.
 *   2. Honeypot — a hidden "website" field humans never see. A filled
 *      honeypot gets a fake success (confirmation shown, no email sent).
 *   3. Rate limit — per-IP sliding window, in-memory. On serverless each
 *      instance keeps its own window; good enough for scaffolding.
 *
 * RECAPTCHA_SECRET_KEY defaults to Google's public v2 TEST secret, which
 * verifies every token (and pairs with the test site key in index.html).
 * Swapping in production keys is issue #30.
 */

/** Google's published universal v2 test secret — always verifies. */
export const RECAPTCHA_TEST_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export interface RecaptchaResult {
  success: boolean;
  errorCodes: string[];
}

/** Verify a reCAPTCHA v2 token with Google. `fetchFn` is injectable for
 * deterministic tests; default secret is the public test key (issue #30). */
export async function verifyRecaptcha(
  token: string,
  opts: { secret?: string; fetchFn?: typeof fetch } = {},
): Promise<RecaptchaResult> {
  const secret = opts.secret ??
    Deno.env.get("RECAPTCHA_SECRET_KEY") ?? RECAPTCHA_TEST_SECRET;
  const fetchFn = opts.fetchFn ?? fetch;
  const res = await fetchFn(SITEVERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  if (!res.ok) {
    throw new Error(`reCAPTCHA verify HTTP ${res.status}`);
  }
  const body = await res.json();
  return {
    success: body.success === true,
    errorCodes: Array.isArray(body["error-codes"]) ? body["error-codes"] : [],
  };
}

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
