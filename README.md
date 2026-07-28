# '92 Subaru

**'92 Subaru** — website for the Dallas Fort Worth '90s/early-2000s cover band:
a retro cassette-deck landing page with a Soundtrack player and a booking form
that emails the band (email is the system of record — no database).

This repo turns the Claude Design scaffold (`web/*.dc.html`) into a running Deno
web app. The design prototype's tool-specific runtime (`support.js`) is **not**
shipped; the UI is recreated as a standalone vanilla-JS app.

## Run it

Requires [Deno](https://deno.com) 2.x (tested on 2.8).

```bash
deno task start      # -> http://localhost:8000
deno task dev        # same, with --watch auto-reload
deno task test       # server tests (merge precondition)
```

Local booking emails: set `BOOKING_DEV_LOG=1` to log the outbound email to the
console instead of sending it.

## Architecture

```
deno.json           Deno tasks (start / dev / test) + imports/fmt/lint
vercel.json         Vercel deployment (static from public/ + Deno API function)
api/
  [...slug].ts      Vercel serverless entry — delegates every /api/* route
server/
  main.ts           Local Deno.serve server — static files + the shared API
  api.ts            Shared JSON API handler (used by both entry points)
  email.ts          Booking → email delivery (Resend)
  data.ts           Content model (soundtrack tracks + gigs)
public/
  index.html        App shell + inline cassette SVG
  styles.css        Keyframes, pseudo-states, responsive rules
  app.js            Routing, tape transport, soundtrack, booking form
web/                Original Claude Design references (.dc.html) — reference only
research/           Firebase seed script from an earlier prototype (gitignored)
```

### HTTP API

| Method | Path            | Purpose                                        |
|--------|-----------------|------------------------------------------------|
| GET    | `/api/content`  | `{ tracks, tour }` soundtrack + gig data       |
| POST   | `/api/bookings` | Submit a booking request (delivered by email)  |
| GET    | `/health`       | Liveness `{ ok, uptime }` (local server only)  |

Unknown `/api/*` routes return a JSON error; unknown page routes get the
themed 404 page. Bookings are **not persisted** — the email to the band is the
system of record.

## Deploy (Vercel)

One deploy story: Vercel serves the static site from `public/` and runs the
booking API as a serverless function under the community
[`vercel-deno`](https://github.com/vercel-community/deno) runtime (pinned in
`vercel.json`). Launch domain is the free `92-subaru.vercel.app` subdomain —
a custom domain attaches later.

One-time setup:

1. Install the CLI: `npm i -g vercel` (or use `npx vercel`).
2. Link the repo to a Vercel project: `vercel link` (project name `92-subaru`
   — the name determines the `<project>.vercel.app` domain and the absolute
   Open Graph URLs in `public/index.html`).
3. Set the environment variables below: `vercel env add <NAME>` (or the
   Vercel dashboard → Project → Settings → Environment Variables).
4. Deploy: `vercel deploy` for a preview, `vercel deploy --prod` for
   production. Pushing to `main` with the Vercel Git integration enabled does
   the same automatically.

### Environment variables

| Variable | Value / notes |
|---|---|
| `BOOKING_EMAIL` | Destination inbox for booking requests: `92subaruband@gmail.com`. |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key. The Resend account **must** be created under `92subaruband@gmail.com`: with no custom domain the `onboarding@resend.dev` sender can only deliver to the account owner's address. |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v2 secret. Until the production keys are registered (issue #30), the server falls back to [Google's public v2 test keys](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do), which pass every verification. |
| `BOOKING_EMAIL_FROM` | Optional sender override; defaults to `onboarding@resend.dev`. |
| `BOOKING_DEV_LOG` | Local dev only — `1` logs booking emails instead of sending. |

Umami analytics (issue #20, credential wiring): when the Umami site is created,
its **website ID** goes into the tracking `<script>` tag in `public/index.html`
— it is a public ID embedded in markup, not a server env var.

## Provenance

Recreated from `web/xerox_rave_site.html` and `web/Cassette.dc.html`
per the handoff in `web/README.md`. Exact tokens, copy, transport logic, and
the visual design are ported from those references.
