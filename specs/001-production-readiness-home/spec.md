# Feature Specification: Production Readiness — '92 Subaru Site

**Feature Branch**: `001-production-readiness-home`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "Production readiness: Home, About, Contact/Book, Soundtrack, EPK for the 92 Subaru 90s cover band site."

**Related:** delivery backlog + prioritization in [`/BACKLOG.md`](../../BACKLOG.md) (Day 1 / Day 2 / Future). This spec is the requirements source; the backlog is the schedule.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Book the band (Priority: P1)

A prospective client (venue booker, event planner, private host) lands on the site, opens **Book/Contact**, fills a short form, and submits a booking request. The band receives it by email and follows up.

**Why this priority**: Bookings are the site's core conversion — the reason it exists. Without reliable delivery, nothing else matters.

**Independent Test**: Submit the booking form with valid data and confirm (a) the requester sees a success confirmation and (b) a formatted email arrives at the band inbox.

**Acceptance Scenarios**:

1. **Given** a visitor on the Book page, **When** they submit with First Name, Last Name, Email, Event Date, Location, and Message filled, **Then** they see the "TAPE RECEIVED" confirmation and the band receives an email with all fields.
2. **Given** a visitor who omits a required field, **When** they submit, **Then** an inline error names the missing field(s) and no email is sent.
3. **Given** an automated bot, **When** it submits the form, **Then** the submission is rejected (Turnstile/honeypot/rate limit) and no email is sent.

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
4. **Given** the booking form, **When** viewed, **Then** it links a privacy policy and states the data retained (First Name, Last Name, Email, Phone).

### Edge Cases

- Booking email provider is down → requester still sees a clear outcome; submission is not silently lost (retry or surfaced error).
- YouTube embed blocked/unavailable → soundtrack shows a graceful fallback, not a broken frame.
- Duplicate/rapid submissions → rate limiting prevents spam without blocking a genuine resubmit.
- Very long message or unusual characters in the form → handled safely (no injection into the email).
- JavaScript disabled → the booking form still communicates how to reach the band.

## Requirements *(mandatory)*

### Functional Requirements

**Booking (US1)**
- **FR-001**: The booking form MUST collect First Name*, Last Name*, Email*, Phone (optional), Event Date*, Event Type, Location/Venue*, Budget, and Message* (\* = required).
- **FR-002**: On valid submission, the system MUST deliver the booking to the band by email as the system of record (no separate datastore).
- **FR-003**: The system MUST validate required fields server-side and reject incomplete submissions with a clear message.
- **FR-004**: The form MUST be protected from automated abuse (Cloudflare Turnstile + honeypot + rate limiting).
- **FR-005**: The destination booking email MUST be configurable. [NEEDS CLARIFICATION: real destination email address — placeholder `booking@92subaru.fm`]

**Home / Soundtrack (US2)**
- **FR-006**: The site MUST use the term "Soundtrack" (not "Mixtape") in all user-facing text.
- **FR-007**: The Home page MUST NOT present "Side A / Side B" controls; tracks MUST be a single list.
- **FR-008**: The Soundtrack player MUST play the band's actual songs via embedded YouTube. [NEEDS CLARIFICATION: YouTube video/playlist URLs per track]
- **FR-009**: The player MUST show loading and error states when an embed is unavailable.
- **FR-010**: The site MAY later use owner-provided audio files as the soundtrack source (do last). [NEEDS CLARIFICATION: audio files]

**About / copy (US2)**
- **FR-011**: The About page MUST describe the band theme, 90s-cover focus, and Dallas–Fort Worth gig availability, without a redacted personnel block or a specs table.
- **FR-012**: Location MUST read "Dallas Fort Worth" wherever location appears.
- **FR-013**: 100% of user-facing copy MUST be personalized for '92 Subaru with no sample/placeholder text. [NEEDS CLARIFICATION: final copy — requires owner refinement session]
- **FR-014**: Placeholder social links MUST be removed/hidden until official endpoints are provided. [NEEDS CLARIFICATION: official social platforms + URLs]

**EPK (US3)**
- **FR-015**: The site MUST provide an EPK/Press Kit page with bio, photos, repertoire, and a booking CTA. [NEEDS CLARIFICATION: bio text + photos]

**Production readiness (US4)**
- **FR-016**: The site MUST deploy and run on Vercel (built in Deno), serving static assets and the booking endpoint.
- **FR-017**: The site MUST include a favicon and Open Graph / Twitter Card metadata with a share preview image.
- **FR-018**: The site MUST include privacy-friendly analytics that do not require a cookie-consent banner. [NEEDS CLARIFICATION: Umami vs Plausible — final choice]
- **FR-019**: The site MUST include a privacy policy (linked in the footer) and a form notice of data retained (First/Last Name, Email, Phone).
- **FR-020**: All pages MUST be responsive with no horizontal overflow at 360–414px widths.
- **FR-021**: Unknown routes MUST render a themed 404 page.

### Key Entities

- **Booking Request**: First Name, Last Name, Email, Phone (optional), Event Date, Event Type, Location/Venue, Budget, Message. Delivered by email; not persisted.
- **Soundtrack Track**: title, artist, year, and a YouTube reference. Single ordered list (no A/B sides).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of submitted valid bookings arrive by email within 1 minute; 0 valid bookings lost.
- **SC-002**: A visitor can go from Home to a submitted booking in under 90 seconds.
- **SC-003**: 0 user-facing strings contain placeholder/sample content at launch (spot-checked across all pages).
- **SC-004**: 0 "Mixtape" / "Side A/B" references remain in the shipped UI.
- **SC-005**: All pages pass a mobile check (no horizontal overflow) at 360px, 390px, and 414px.
- **SC-006**: Shared links render a branded preview (title, description, image) on at least one major platform.
- **SC-007**: Automated bot submissions are blocked in testing; a genuine submission succeeds.

## Assumptions

- Launch window is ~3 days (target ~2026-07-27); the Day 1 backlog is in scope, Gigs is deferred (Day 2).
- Email is the booking system of record; no database is required (removes the Deno KV dependency and its Vercel incompatibility).
- The owner will provide, during the launch window: final copy, real booking email, official social URLs, YouTube links for the soundtrack, and EPK bio/photos.
- Motion/animation is intentionally kept; a `prefers-reduced-motion` accommodation is deferred (Future).
- The owner maintains content directly for now; a headless CMS is a future goal.
