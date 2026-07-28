---
description: "Task list for Production Readiness — '92 Subaru site"
---
# Tasks: Production Readiness — '92 Subaru Site

**Input**: Design documents from `/specs/001-production-readiness-home/` (spec.md, plan.md)
**Schedule/priority**: see [`/BACKLOG.md`](../../BACKLOG.md) (Day 1 / Day 2 / Future). Each task notes its backlog ID.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: can run in parallel (different files, no dependency)
- **[Story]**: user story (US1 booking, US2 home/soundtrack/about, US3 EPK, US4 production)
- ⛔ = blocked on owner-provided input

---

## Phase 1: Foundational (blocking prerequisites)

- [x] T001 [US4] Configure Vercel deployment for the Deno app (runtime, static serving from `public/`, env/secrets); document in `README.md` (env vars: `BOOKING_EMAIL`, `RESEND_API_KEY`, `RECAPTCHA_SECRET_KEY`, Umami website ID); delete the Deno Deploy CI workflow, Dockerfile, and fly.toml (decided 2026-07-28 — one deploy story; git history preserves them). DoD (CHK043): app builds + serves locally under the Vercel-compatible entry point, `vercel.json` validates, `deno test` green, README documents link-account/deploy/env steps. — `vercel.json`, `.github/workflows/deno.yml`, `Dockerfile`, `fly.toml` (D1-17) — **highest risk, do first**
- [ ] T002 [US1] Remove Deno KV; make email the system of record. Delete KV store + its tests. — `server/data.ts`, `server/main.ts`, `server/data_test.ts` (D1-13)
- [ ] T003 [P] [US1] Add email-delivery module (Resend client + formatted booking template; `RESEND_API_KEY` env var). — `server/email.ts` (D1-10, FR-002)

## Phase 2: US1 — Book the band (Priority: P1) 🎯 MVP

- [x] T004 [US1] Rework booking form fields → First Name*, Last Name*, Email*, Phone(optional), Event Date*, Event Type (dropdown), Location/Venue*, Budget (dropdown), Message*; dropdown options per FR-001. — `public/index.html` (D1-09, FR-001)
- [ ] T005 [US1] Wire form submit → email endpoint; keep the "TAPE RECEIVED" confirmation. — `public/app.js`, `server/main.ts`, `server/email.ts` (D1-10, FR-002)
- [ ] T006 [US1] Server-side validation of required fields (incl. Event Date today-or-later, well-formed email, length caps) + email-failure handling (surface error, don't lose the request). — `server/main.ts` (FR-003, CHK001/CHK022)
- [ ] T007 [US1] Input sanitization so field content cannot inject into the outbound email. — `server/email.ts` (CHK024)
- [x] T008 [US1] Spam protection: Google reCAPTCHA v2 checkbox + honeypot + server-side rate limit; reCAPTCHA fails open if the script doesn't load; honeypot hit = fake success (confirmation shown, no email). DoD: E2E token verification under Google's public v2 test keys, pass + fail paths (FR-004). — `public/index.html`, `public/app.js`, `server/main.ts` (D1-12, FR-004)
- [ ] T009 [US1] Set the destination booking email env var: `BOOKING_EMAIL=92subaruband@gmail.com` (decided 2026-07-28; unblocked). — config (D1-11, FR-005)

**Checkpoint:** US1 is independently shippable — a valid booking emails the band; bots are blocked.

## Phase 3: US2 — Discover & experience the band (Priority: P1)

- [ ] T010 [US2] Rename "Mixtape" → "Soundtrack" in all user-facing text + `<title>`/meta. — `public/index.html`, `public/app.js`, `server/data.ts` (D1-04, FR-006)
- [ ] T011 [US2] Remove Side A/B (deck tabs, toggle, cassette flip); collapse to a single track list. — `public/index.html`, `public/app.js`, `server/data.ts` (D1-05, FR-007)
- [ ] T012 ⛔ [US2] Replace synth deck with embedded YouTube player; track selection loads the matching video. — `public/app.js`, `public/index.html` (D1-06, FR-008)
- [ ] T013 [P] [US2] Loading/error states for the soundtrack player. — `public/app.js` (D1-07, FR-009)
- [ ] T014 ⛔ [US2] Rewrite About as a simple page (theme, DFW gig availability, 90s-cover info); remove redacted personnel + specs table. — `public/index.html` (D1-02, FR-011)
- [ ] T015 [US2] Set location to "Dallas Fort Worth" everywhere. — `public/index.html`, `server/data.ts` (D1-03, FR-012)
- [ ] T016 [US2] Blank/hide placeholder social links. — `public/index.html` (D1-14, FR-014)
- [ ] T017 ⛔ [US2] Wire official social endpoints once provided. — `public/index.html` (D1-15)

## Phase 4: US3 — Press kit (Priority: P2)

- [ ] T018 ⛔ [US3] EPK / Press Kit — **EPIC, In Refinement** (#18; not launch-blocking until scoped). — `public/epk.html` (D1-16, FR-015)

## Phase 5: US4 — Fast, shareable, compliant site (Priority: P1)

- [x] T019 [P] [US4] SEO: favicon + Open Graph/Twitter meta + generated 1200×630 share image (⛔ owner approval of the image before launch, FR-017; absolute URLs use the `vercel.app` launch domain). — `public/index.html`, `public/assets/` (D1-18, FR-017)
- [ ] T020 [P] [US4] Install privacy-friendly analytics (Umami; no cookie banner). — `public/index.html` (D1-19, FR-018)
- [x] T021 [US4] Privacy policy page + consent line on the form (retains all nine submitted fields; discloses Google reCAPTCHA, Umami, Resend — per FR-019). ⛔ owner approval of the draft before first production deploy. — `public/privacy.html`, `public/index.html` (D1-20, FR-019)
- [x] T022 [US4] Mobile responsive pass (hero scaling, 2-col grids, deck/nav; booking form single-column, ≥44px tap targets) — no overflow at 360–414px on all pages incl. privacy + 404. — `public/styles.css`, `public/index.html` (D1-21, FR-020, SC-005)
- [x] T023 [P] [US4] Themed 404 page ("SIDE B NOT FOUND — rewind ◂") with home link, served with real HTTP 404 status; unknown API routes return JSON errors. — `public/404.html`, `server/main.ts` (D1-22, FR-021)

## Phase 6: Content & final polish

- [ ] T024 ⛔ [US2] 100% copy personalization pass across all pages (refinement session output). — all `public/*` (D1-01, FR-013)
- [ ] T025 ⛔ [US2] Host the band's own audio files (do last; reconcile with T012). — `public/`, `public/app.js` (D1-08, FR-010)

## Day 2

- [x] T026 Hide the Gigs panel via a single config flag (e.g., `SHOW_GIGS`) that removes it from nav + DOM; re-enable is a one-line flip. — `public/index.html`, `public/app.js` (D2-01)
- [ ] T030 ⛔ Swap reCAPTCHA test keys → production keys (register the vercel.app hostname in Google's reCAPTCHA admin console under `92subaruband@gmail.com` — no new vendor account needed; set `RECAPTCHA_SECRET_KEY` + site key on Vercel). Credential-wiring batch (FR-004, CHK040). — config

## Future

- [ ] T027 Headless CMS for owner-edited content. (FB-01)
- [ ] T028 `prefers-reduced-motion` support. — `public/styles.css` (FB-02)
- [ ] T029 Re-enable & populate Gigs with real dates + ticket links. (FB-03)

---

## Dependencies & order

- **T001–T003** (foundational) before feature work.
- **US1** (T004–T009) is the MVP and can ship before US2/US3/US4.
- **T010/T011** (rename + de-side) precede **T012/T013** (player rework).
- **T024** (copy) runs late, after structure settles; **T025** (audio) is last.
- Tasks marked ⛔ are blocked on owner input (YouTube URLs, socials, About bio, EPK assets, final copy, OG-image + privacy-draft approvals, reCAPTCHA key registration for T030). Booking email is decided (T009 unblocked).

## Parallel opportunities

- T003 ∥ T001/T002 · T013 ∥ T012 · T019 ∥ T020 ∥ T023 (different files).
