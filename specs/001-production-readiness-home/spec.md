# Feature Specification: Production Readiness — '92 Subaru Site

**Feature Branch**: `001-production-readiness-home`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "Production readiness: Home, About, Contact/Book, Soundtrack, EPK for the 92 Subaru 90s cover band site."

**Related:** delivery backlog + prioritization in [`/BACKLOG.md`](../../BACKLOG.md) (Day 1 / Day 2 / Future). This spec is the requirements source; the backlog is the schedule.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Book the band (Priority: P1)

A prospective client (venue booker, event planner, private host) lands on the site, opens **Book** (nav: HOME / ABOUT / BOOK — there is no separate "Contact" page), fills a short form, and submits a booking request. The band receives it by email and follows up.

**Why this priority**: Bookings are the site's core conversion — the reason it exists. Without reliable delivery, nothing else matters.

**Independent Test**: Submit the booking form with valid data and confirm (a) the requester sees a success confirmation and (b) a formatted email arrives at the band inbox.

**Acceptance Scenarios**:

1. **Given** a visitor on the Book page, **When** they submit with First Name, Last Name, Email, Event Date, Location, and Message filled, **Then** they see the "TAPE RECEIVED" confirmation and the band receives an email with all fields.
2. **Given** a visitor who omits a required field, **When** they submit, **Then** an inline error names the missing field(s) and no email is sent.
3. **Given** an automated bot, **When** it submits the form, **Then** the submission is rejected (reCAPTCHA/honeypot/rate limit) and no email is sent.

---

### User Story 2 - Discover & experience the band (Priority: P1)

A first-time visitor lands on **Home**, reads the hero, plays the **Soundtrack** (the band's actual songs via embedded YouTube), and reads **About** to learn the theme, that they cover 90s hits, and that they play across Dallas–Fort Worth.

**Why this priority**: First impression and credibility; drives visitors toward booking.

**Independent Test**: Load Home, press play on a Soundtrack track, confirm real audio plays; open About and confirm it describes a 90s DFW cover band with no placeholder content.

**Acceptance Scenarios**:

1. **Given** the Home page, **When** it loads, **Then** all copy is '92-Subaru-specific (no sample/placeholder text) and there is no "Side A/Side B" or "Mixtape" wording.
2. **Given** the Soundtrack player, **When** a visitor selects a track, **Then** the corresponding song plays via embedded YouTube; loading/error states are shown if the embed is unavailable.
3. **Given** the About page, **When** viewed, **Then** it states the band theme, 90s-cover focus, and Dallas–Fort Worth availability, without redacted personnel or a technical specs table.

---

### User Story 3 - Review the press kit (Priority: P2)

A venue or promoter opens the **EPK / Press Kit** to evaluate the band: bio, photos, what they play, and how to book.

**Why this priority**: Enables professional bookings, but the core booking flow (US1) can ship first.

**Independent Test**: Open the EPK page and confirm bio, photos, repertoire summary, and a booking CTA are present and downloadable/linkable.

**Acceptance Scenarios**:

1. **Given** the EPK page, **When** viewed, **Then** it presents bio, photos, repertoire, and a booking CTA suitable to send to a venue.

---

### User Story 4 - Reach a fast, shareable, compliant site (Priority: P1)

Any visitor reaches a production-deployed site that loads on mobile, shows a proper preview when shared, handles unknown URLs gracefully, and respects privacy.

**Why this priority**: Launch-blocking baseline for a public site.

**Independent Test**: Deploy to the production host; share the URL (preview renders); load on a phone (no overflow); visit a bad URL (themed 404); confirm the privacy policy is linked and the form states what data it collects.

**Acceptance Scenarios**:

1. **Given** the production URL, **When** shared on social/chat, **Then** a branded title, description, and image preview appear; a favicon is present.
2. **Given** a phone (360–414px), **When** any page loads, **Then** there is no horizontal overflow and all controls are usable.
3. **Given** an unknown path, **When** requested, **Then** a themed 404 renders instead of a raw error.
4. **Given** the booking form, **When** viewed, **Then** it links a privacy policy and states the data retained (all nine submitted fields: First Name, Last Name, Email, Phone, Event Date, Event Type, Location/Venue, Budget, Message).

### Edge Cases

- Booking email provider is down → requester still sees a clear outcome; submission is not silently lost (retry or surfaced error).
- YouTube embed blocked/unavailable → soundtrack shows a graceful fallback, not a broken frame.
- Duplicate/rapid submissions → rate limiting prevents spam without blocking a genuine resubmit.
- Very long message or unusual characters in the form → handled safely (no injection into the email).
- JavaScript disabled → the booking form still communicates how to reach the band.

## Requirements *(mandatory)*

### Functional Requirements

**Booking (US1)**
- **FR-001**: The booking form MUST collect First Name*, Last Name*, Email*, Phone (optional), Event Date*, Event Type, Location/Venue*, Budget, and Message* (\* = required). Event Type and Budget are dropdowns (decided 2026-07-28): Event Type = Wedding / Corporate / Private party / Venue-bar / Other; Budget = <$1k / $1–2.5k / $2.5–5k / $5k+ / Not sure.
- **FR-002**: On valid submission, the system MUST deliver the booking notification to the band's inbox (`92subaruband@gmail.com`) via Google's official Gmail SMTP server (`smtp.gmail.com:465`) using a 16-character Google App Password (`GMAIL_USER`, `GMAIL_APP_PASSWORD`). Third-party services (Resend) are removed.
- **FR-003**: The system MUST validate required fields server-side and reject incomplete submissions with a clear message. Event Date MUST be today or later (decided 2026-07-28); Email must be well-formed; field lengths are capped at sane defaults.
- **FR-004**: The form MUST be protected from automated abuse (Google reCAPTCHA v2 checkbox + honeypot + rate limiting; provider swapped from Cloudflare Turnstile 2026-07-28, owner decision). If the reCAPTCHA script fails to load client-side, the form MUST fail open — submission proceeds without a token, with honeypot and server-side rate limiting still enforced (decided 2026-07-28). A honeypot hit returns the normal confirmation but sends no email (fake success, decided 2026-07-28). reCAPTCHA scaffolding is done when the widget renders and tokens verify server-side end-to-end under Google's public v2 test keys (pass and fail paths both exercised); the production-key swap is a tracked credential-wiring task (T030, keys created under the band's Google account).
- **FR-005**: The destination booking email MUST be configurable via env var (`BOOKING_EMAIL`); destination is `92subaruband@gmail.com` (decided 2026-07-28).
- **FR-022**: On booking submission, the system MUST invoke Google Gemini LLM (`gemini-2.5-flash` / `GEMINI_API_KEY`) to generate an **AI Booking Intelligence & Entity Research Briefing** appended to the notification email. The AI briefing MUST research the venue/location, analyze client domain/entity context, and recommend setlist/reply strategies for the band. If `GEMINI_API_KEY` is not present or Gemini API fails, email delivery MUST fall back gracefully to the standard booking template.

**Home / Soundtrack (US2)**
- **FR-006**: The site MUST use the term "Soundtrack" (not "Mixtape") in all user-facing text.
- **FR-007**: The Home page MUST NOT present "Side A / Side B" controls; tracks MUST be a single list.
- **FR-008**: The Soundtrack player MUST play the band's actual songs via embedded YouTube. [NEEDS CLARIFICATION: YouTube video/playlist URLs per track]
- **FR-009**: The player MUST show loading and error states when an embed is unavailable.
- **FR-010**: The site MAY later use owner-provided audio files as the soundtrack source (do last). [NEEDS CLARIFICATION: audio files]

**About / copy (US2)**
- **FR-011**: The About page MUST describe the band theme, '90s/early-2000s cover focus, and Dallas–Fort Worth gig availability, without a redacted personnel block or a specs table. Owner copy received 2026-07-26 — approved verbatim in [copy-deck.md](copy-deck.md) §About.
- **FR-012**: Approved copy-deck strings take precedence for location wording ("Dallas–Fort Worth metroplex" in About prose; "DALLAS // FORT WORTH" in the footer). Where no approved string exists (meta tags, form labels, privacy page), location reads plain "Dallas Fort Worth" — no en-dash, not "DFW" (decided 2026-07-28, superseding the earlier plain-everywhere ruling).
- **FR-013**: 100% of user-facing copy MUST be personalized for '92 Subaru with no sample/placeholder text. [NEEDS CLARIFICATION: final copy — requires owner refinement session]
- **FR-014**: Social links MUST be deleted entirely (hero eyebrow included); the owner will reconstruct the link architecture later. Approved copy for Home, nav, and footer is in [copy-deck.md](copy-deck.md) and is authoritative.

**EPK (US3)**
- **FR-015**: The site MUST provide an EPK/Press Kit page with bio, photos, repertoire, and a booking CTA. [NEEDS CLARIFICATION: bio text + photos]

**Production readiness (US4)**
- **FR-016**: The site MUST deploy and run on Vercel (built in Deno), serving static assets and the booking endpoint. Launch domain is the free `<project>.vercel.app` subdomain (decided 2026-07-28); a custom domain attaches later.
- **FR-017**: The site MUST include a favicon and Open Graph / Twitter Card metadata with a share preview image (1200×630). The launch image is generated, but MUST receive owner approval before launch (decided 2026-07-28). Absolute OG URLs point at the `vercel.app` launch domain. OG/Twitter title and description MUST use approved copy-deck strings (wordmark + hero tagline; description drawn from About ¶1) — no new copy (decided 2026-07-28).
- **FR-018**: The site MUST include privacy-friendly analytics that do not require a cookie-consent banner: Umami (decided 2026-07-28; cookieless, free hobby cloud tier).
- **FR-019**: The site MUST include a privacy policy (linked in the footer) and a form notice of data retained: all nine submitted fields (First/Last Name, Email, Phone, Event Date, Event Type, Location/Venue, Budget, Message — decided 2026-07-28; matches FR-001 exactly). The policy MUST disclose the third-party processors: Google reCAPTCHA (IP/browser signals, subject to Google's Privacy Policy and Terms), Umami (anonymized page views), and Resend (the booking fields). The draft MUST receive owner approval before the first production deploy (both decided 2026-07-28).
- **FR-020**: All pages MUST be responsive with no horizontal overflow at 360–414px widths. The booking form MUST render single-column in FR-001 field order with ≥44px tap targets at these widths (decided 2026-07-28).
- **FR-021**: Unknown page routes MUST render a themed 404 page ("SIDE B NOT FOUND — rewind ◂") with a link back home, served with a real HTTP 404 status; unknown API routes MUST return a JSON error instead of the themed page (decided 2026-07-28).

### Key Entities

- **Booking Request**: First Name, Last Name, Email, Phone (optional), Event Date, Event Type, Location/Venue, Budget, Message. Delivered by email; not persisted.
- **Soundtrack Track**: title, artist, year, and a YouTube reference. Single ordered list (no A/B sides).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of submitted valid bookings arrive by email within 1 minute; 0 valid bookings lost.
- **SC-002**: A visitor can go from Home to a submitted booking in under 90 seconds.
- **SC-003**: 0 user-facing strings contain placeholder/sample content at launch (spot-checked across all pages).
- **SC-004**: 0 "Mixtape" / "Side A/B" references remain in the shipped UI.
- **SC-005**: All pages — Home, About, Book, privacy, 404 (and EPK when it ships) — pass a mobile check (no horizontal overflow) at 360px, 390px, and 414px.
- **SC-006**: Shared links render a branded preview (title, description, image) on at least one major platform.
- **SC-007**: Automated bot submissions are blocked in testing; a genuine submission succeeds.

## Assumptions

- Launch window is ~3 days (target ~2026-07-27); the Day 1 backlog is in scope, Gigs is deferred (Day 2).
- Email is the booking system of record; no database is required (removes the Deno KV dependency and its Vercel incompatibility).
- The owner will provide, during the launch window: final copy, official social URLs, YouTube links for the soundtrack, and EPK bio/photos. (Booking email decided 2026-07-28: `92subaruband@gmail.com`.)
- Motion/animation is intentionally kept; a `prefers-reduced-motion` accommodation is deferred (Future).
- The owner maintains content directly for now; a headless CMS is a future goal.
