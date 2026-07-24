# '92 Subaru — Production Backlog

**Goal:** Get the '92 Subaru 90s-cover-band site production-ready.
**Launch target:** ~2026-07-27 (3 days).
**Deploy target:** Vercel (built in Deno). **Maintainer:** owner (headless CMS is a future goal).
**Formal spec:** [`specs/001-production-readiness/spec.md`](specs/001-production-readiness/spec.md) · quality checklists live in that folder (`/speckit-checklist`).

## Rules
- Everything is a **Day 1** item unless explicitly tagged `**Day 2**` or `**Future**`.
- `[needs your input]` = blocked on owner-provided content/copy/credentials.
- IDs: `D1-##` Day 1, `D2-##` Day 2, `FB-##` Future. Check a box when done.

## Decisions (resolved)
- **Booking form fields:** **keep** Event Type and Budget (add contact fields; see D1-09).
- **Storage:** **email is the system of record — remove Deno KV** (no datastore on Vercel). See D1-10/D1-13.
- **Scope:** full Day 1 load kept as-is (EPK + audio-file hosting stay Day 1).
- **Analytics:** Umami (self-host) or Plausible — final pick in D1-19.
- **Spam:** Cloudflare Turnstile + honeypot + rate limit (D1-12).

---

## Day 1 — launch-blocking

### Content & copy
- [ ] **D1-01 — Personalize 100% of site copy for '92 Subaru.** Replace all remaining generic/placeholder language via a **copy refinement session** with owner. `[needs your input]`
  - _Accept:_ every user-facing string reviewed + approved; no sample text remains.
- [ ] **D1-02 — Rewrite the About page as a simple page:** band theme, available for gigs across **Dallas Fort Worth**, 90s-cover-band info. Remove the redacted "PERSONNEL ████" block and the SPECS table.
  - _Accept:_ About shows theme + DFW gig availability + 90s-cover info; no placeholder personnel/specs.
- [ ] **D1-03 — Set location to "Dallas Fort Worth"** everywhere (was "1998 · Denton, TX", etc.).
  - _Accept:_ location reads "Dallas Fort Worth" site-wide.

### Home / Soundtrack (formerly "Mixtape")
- [ ] **D1-04 — Rename "Mixtape" → "Soundtrack"** across the entire site (headings, labels, copy, `<title>`/meta, user-facing identifiers).
  - _Accept:_ no user-visible "Mixtape" remains; "Soundtrack" used consistently.
- [ ] **D1-05 — Remove "Side A / Side B" entirely:** deck A/B tabs, SIDE A/SIDE B toggle, cassette flip. Collapse the two-sided data into a **single track list**.
  - _Accept:_ no A/B controls anywhere; one continuous soundtrack list; cassette still renders (no flip).
- [ ] **D1-06 — Replace the synth deck with an embedded YouTube player.** Track selection loads the matching YouTube video/playlist. `[needs your input: YouTube URLs]`
  - _Accept:_ playing a track plays real audio via embedded YouTube; controls reflect play/pause.
- [ ] **D1-07 — Loading / error states for the soundtrack player** (embed not ready, offline, invalid video).
  - _Accept:_ graceful message instead of a broken/empty player.
- [ ] **D1-08 — Host the band's own audio files** (owner-provided) as the soundtrack source/alternative to YouTube. **Do this last.** `[needs your input: audio files]`
  - _Accept:_ owner audio plays on the deck.

### Booking / Contact
- [ ] **D1-09 — Rework booking form fields** to: First Name*, Last Name*, Email*, Phone (optional), Event Date*, **Event Type**, Location/Venue*, **Budget**, Message*. (Event Type + Budget kept.)
  - _Accept:_ form collects contact info; required = First/Last/Email/Date/Location/Message.
- [ ] **D1-10 — Build email delivery of booking submissions** (system of record). On submit, email the booking to the band's inbox (server-side, e.g. Resend/SMTP).
  - _Accept:_ a submitted booking arrives as a formatted email; user sees the "TAPE RECEIVED" confirmation.
- [ ] **D1-11 — [User follow-up] Provide the real destination email** (replace `booking@92subaru.fm`). `[needs your input]`
- [ ] **D1-12 — Spam protection:** Cloudflare Turnstile + honeypot + server-side rate limit.
  - _Accept:_ bot submissions blocked; legitimate submits pass invisibly.
- [ ] **D1-13 — Remove Deno KV.** Email (D1-10) is the system of record; no datastore on Vercel. Delete KV code/tasks/tests tied to persistence.
  - _Accept:_ bookings work on Vercel with no Deno-KV dependency; no KV code paths remain.

### Social / contact endpoints
- [ ] **D1-14 — Blank out placeholder social links** (guessed instagram/youtube/bandcamp URLs). Remove/hide until real ones exist.
  - _Accept:_ no fake social URLs shipped.
- [ ] **D1-15 — [User follow-up] Provide official social endpoints** (platforms + real URLs/handles). `[needs your input]`

### Pages
- [ ] **D1-16 — EPK / Press Kit page.** Bio, photos, what-they-play, booking CTA, downloadable assets. `[needs your input: bio, photos]`
  - _Accept:_ a linkable EPK page suitable to send to venues.

### Production & ops
- [ ] **D1-17 — Vercel deployment setup for the Deno app** (runtime/adapter, static serving from `public/`, env vars/secrets). Park/remove the existing Deno Deploy CI + Fly.io config.
  - _Accept:_ site deploys and runs on Vercel; path documented in README.
- [ ] **D1-18 — SEO basics:** favicon + Open Graph / Twitter Card meta + share preview image.
  - _Accept:_ sharing the URL shows a branded preview; favicon present.
- [ ] **D1-19 — Install analytics** (Umami self-hosted, or Plausible). Privacy-friendly, no cookie banner.
  - _Accept:_ page views tracked; no consent banner required.
- [ ] **D1-20 — Privacy policy page + consent line on the booking form.** Data retained: First Name, Last Name, Email, Phone (optional).
  - _Accept:_ privacy page live and linked (footer); form notes what's collected.
- [ ] **D1-21 — Mobile responsive pass.** Hero scaling, 2-col grids stacking, deck/soundtrack + nav controls on small screens.
  - _Accept:_ no horizontal overflow at 360–414px; controls usable on phones.
- [ ] **D1-22 — Themed 404 page** ("SIDE B NOT FOUND — rewind ◂").
  - _Accept:_ unknown routes render the themed 404, not a raw error.

---

## Day 2

- [ ] **D2-01 — Hide the Gigs panel** for now (stakeholder will publish later). Keep code/data so it can be re-enabled.
  - _Accept:_ Gigs section not visible on Home; easily toggled back on.

---

## Future

- [ ] **FB-01 — Headless CMS** for owner-edited content (soundtrack, gigs, EPK, copy).
- [ ] **FB-02 — `prefers-reduced-motion` support** — respect OS "reduce motion" for scan sweep / flicker / EQ / auto-play (full motion stays for everyone else).
- [ ] **FB-03 — Re-enable & populate Gigs** with real dates + optional ticket links once approved.
