# Code Review Handoff — 8-Issue Launch Batch ('92 Subaru)

Copy everything below into a fresh session (or hand to a review agent) to review
the launch batch implemented 2026-07-28.

---

Review the 8-issue launch batch for the '92 Subaru site on branch
`001-production-readiness-home`.

**Scope**: commit range `aa7a993..HEAD` — 8 conventional commits, one per task:

| Commit | Task | Area |
|---|---|---|
| `9ab6f94` | T001/#1 | Vercel config: `vercel.json`, `api/[...slug].ts`, shared `server/api.ts`, README; deleted deno.yml CI / Dockerfile / fly.toml |
| `4d4f69d` | T004/#4 | Nine FR-001 booking fields end to end (form → `app.js` → `server/api.ts` → `server/email.ts`) |
| `768a2cc` | T023/#23 | Themed 404 (`public/404.html`) with real HTTP 404; JSON errors for unknown API routes |
| `b8d69fe` | T021/#21 | Privacy draft (`public/privacy.html`), form consent line, footer link |
| `6bab4ca` | T019/#19 | Favicon, OG/Twitter meta, generated `public/assets/og.png` |
| `7cf264f` | T008/#8 | reCAPTCHA v2 scaffolding (`server/spam.ts`), honeypot, per-IP rate limit |
| `d95e3c5` | T026/#26 | `SHOW_GIGS` flag removes Gigs from the DOM |
| `ef4caba` | T022/#22 | Mobile responsive pass (`public/styles.css` media queries + class hooks) |

**Requirements are settled — review against them, don't re-litigate them.** The
sources of truth, in order:

- `specs/001-production-readiness-home/spec.md` — FRs carry "decided 2026-07-28" annotations
- `specs/001-production-readiness-home/tasks.md` — batch tasks are checked `[x]` with DoD notes
- `specs/001-production-readiness-home/checklists/launch-batch.md` — resolved CHK items = the decision record
- `specs/001-production-readiness-home/copy-deck.md` — APPROVED strings are verbatim-contractual

## Review priorities (highest first)

1. **Deploy correctness (T001) — highest risk, least verified.** The
   `vercel-deno@3.1.0` community runtime and `vercel.json` semantics
   (`outputDirectory`, `cleanUrls`, functions glob matching `api/[...slug].ts`,
   automatic root `404.html` handling) could NOT be verified against a real
   Vercel build — there is no linked account. Check config validity, the
   assumption that Vercel serves `public/404.html` with a real 404 status under
   `cleanUrls`, and that the function's relative import of `../server/*.ts`
   survives bundling. Anything that would break on first deploy is the most
   valuable finding this review can produce.
2. **Spam-protection semantics (T008, FR-004).** Fail-open is intentional and
   decided: no token → proceed; Google unreachable server-side → proceed;
   honeypot hit → 201 fake success with no email; verified-fail → 403. Check
   the implementation matches exactly (`server/api.ts` + `server/spam.ts`),
   that order of checks (rate limit → honeypot → captcha → validation) has no
   bypass, and that the rate limiter can't be trivially evaded via
   `x-forwarded-for` in ways Vercel's header handling wouldn't already prevent.
3. **Email safety (FR-002/CHK024).** All nine fields now flow into the outbound
   email, plus a new `reply_to` set from user input. Verify header-injection
   sanitization covers every new field and that `reply_to` with a hostile value
   can't do anything the tests don't cover (`server/email.ts`, `email_test.ts`).
4. **Spec/copy compliance.** FR-001 dropdown options exact; OG title/description
   only from approved copy-deck strings (wordmark + hero tagline; About ¶1);
   FR-012 location precedence (copy-deck strings win; plain "Dallas Fort Worth"
   elsewhere — no en-dash, no "DFW" outside approved strings); FR-019 nine-field
   consent line matches FR-001 exactly.
5. **Front-end regressions.** `app.js` was touched for form state, reCAPTCHA,
   and `SHOW_GIGS` DOM removal — check for null-element listeners, the
   `resetRecaptcha`/single-use-token flow, and that hidden-view rendering still
   works. The mobile pass uses `!important` overrides against inline styles —
   check for desktop (>700px) visual regressions.

## Known judgment calls (already reported to the owner — flag only if you find them *wrong*, not merely notable)

- `BOOKING_EMAIL_TO` → `BOOKING_EMAIL` rename (aligns FR-005).
- OG absolute URLs assume Vercel project name `92-subaru` (documented in README).
- Server-side validation only checks required-field presence; FR-003 depth
  (date bounds, email format, length caps) is deliberately deferred to T006.
- Rate limiter is in-memory per serverless instance (accepted for scaffolding).
- Client date input `min` set to today (partial FR-003, client-only).

## Out of scope — do not flag

- ⛔ approval gates: OG image + privacy draft await owner sign-off (known, tracked).
- T006 (deep validation), T012 (YouTube player — synth audio is a known
  placeholder), T014/T024 (owner copy), T020 (Umami script install), T030
  (real reCAPTCHA keys), custom domain.
- Pre-existing code untouched by the range (e.g., the Web Audio synth,
  cassette SVG, `server/data.ts` placeholder tracks).

## How to verify

- `deno task test` (17 tests; includes live reCAPTCHA E2E against Google's
  siteverify with the public v2 test keys) · `deno lint` · `deno fmt --check`
- Local run: `BOOKING_DEV_LOG=1 deno task start` → smoke `/`, `/privacy`,
  `/definitely-not-here` (expect themed 404 + status 404), `POST /api/bookings`
  (valid → 201 + logged email; missing fields → 422 naming them; honeypot
  `website` field set → 201 with no email; `recaptchaToken` under a bogus
  `RECAPTCHA_SECRET_KEY` env → 403).
- Mobile: measure `document.documentElement.scrollWidth` at 360/390/414px via a
  same-origin iframe harness (direct headless windows below ~485px are
  impossible on macOS Chrome — don't trust naive `--window-size` screenshots).

## Report format

For each finding: file:line, severity (blocker / should-fix / nit), what's
wrong, the FR/CHK it violates (if any), and whether it blocks launch. End with
a verdict: safe to merge to `main` and deploy once the two owner approvals and
the credential-wiring batch (T030, keys, Vercel link) land — yes or no.
