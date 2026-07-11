# Handoff: '92 Subaru — "Xerox Rave" Band Website

## Overview
A single-page site for **'92 Subaru**, a Dallas–Fort Worth cover band that plays the top hits of the 1990s. Three views (Home, About, Contact) behind an in-page router, unified by a **photocopied rave-flyer** aesthetic: cream paper stock, black ink, one hot red, halftone dots, and hard offset shadows. The centerpiece is a **working cassette tape deck** — play/pause/stop, prev/next, Side A/B flip, a top-10 setlist that drives the playhead, animated reels, and a synthesized "bootleg-tape" four-on-the-floor loop generated live with the Web Audio API.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing the intended look and behavior, **not production code to copy directly**. They are authored as a "Design Component" (`.dc.html`) that runs on a small bespoke runtime (`support.js`) which is **specific to our design tool**. Do **not** ship `support.js` or the `.dc.html` format.

Your task is to **recreate this design in the target codebase's existing environment** (React, Vue, Svelte, SwiftUI, plain HTML/CSS/JS, etc.) using its established patterns, component library, and conventions. If no codebase exists yet, pick the most appropriate framework and implement there. Everything you need — layout, exact tokens, copy, interaction logic, and the audio synthesis recipe — is documented below and is readable directly from the prototype source.

### How to read the prototype source
- `xerox_rave_site.html` is the whole site. It has two parts:
  - The **template** (markup between `<x-dc>` and `</x-dc>`): inline-styled HTML. `{{ name }}` are data holes, `<sc-if>` is a conditional, `<sc-for>` is a list loop, `<dc-import name="Cassette">` mounts the cassette sub-component.
  - The **logic class** (`<script type="text/x-dc">`, `class Component extends DCLogic`): all state, routing, the tape transport, the Web Audio synth, and form handling. `renderVals()` returns the values the template binds to. This is plain JS — port it more or less as-is.
- `Cassette.dc.html` is a standalone SVG cassette, themed entirely through CSS custom properties (`--cass-*`). Recreate it as one SVG component that takes props/CSS vars.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, motion, and interactions. Recreate the UI pixel-perfectly using the target codebase's libraries and patterns. Exact hex values, fonts, and measurements are below.

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| Paper | `#efe8d6` | Page background, light UI on dark |
| Paper (bright) | `#fffdf5` | J-card / form / callout panels |
| Ink | `#17140f` | Text, borders, dark bands (nav, deck, gigs, footer) |
| Ink (cassette) | `#141210` | Cassette line work |
| Red (accent) | `#d83a2b` | Primary accent — CTAs, active states, drop-shadows, highlights |
| Red (cassette/progress) | `#df3b2c` | Cassette stripe + deck progress fill |
| Dashed line on dark | `#55503f` | Row dividers inside dark sections |
| Muted ink | `#8a856f` | "PLAYED" past-gig badge text/border |
| Lined-paper rule | `#e4dcc6` | The horizontal rules in the J-card background |

### Typography
- **Display:** `Anton`, sans-serif (single weight 400; it reads as heavy condensed caps). Google Fonts.
- **Body/mono:** `Courier Prime`, monospace, weights 400 & 700. Google Fonts.
- Import: `https://fonts.googleapis.com/css2?family=Anton&family=Courier+Prime:wght@400;700&display=swap`
- Type sizes (px): hero title 118; About/Contact page titles 96; section headers (The Mixtape / Gigs) 44; "now playing" track title 26; body 14–19; labels/eyebrows 11–13 with `letter-spacing` 1–5px.
- Hero + page titles use `text-transform:uppercase` and a hard red drop shadow: hero `text-shadow:7px 7px 0 #d83a2b`; page titles `6px 6px 0 #d83a2b`.

### Texture, borders, shadows
- **Halftone grain** (page background): `background-image: radial-gradient(#0000001a 1.1px, transparent 1.2px); background-size: 5px 5px;` over `#efe8d6`.
- **Lined J-card** (mixtape background): `repeating-linear-gradient(#fffdf5 0 30px, #e4dcc6 30px 31px)`.
- **Borders:** hard, no radius. `3px solid #17140f` for major frames/bands; `2px solid` for controls/inputs; `1px dotted #17140f` (mixtape rows) and `1px dashed #55503f` (gig rows) for dividers.
- **Hard offset shadows** (never soft/blurred): e.g. deck `8px 8px 0 rgba(23,20,15,.22)`, form `7px 7px 0 rgba(23,20,15,.25)`, submit button `5px 5px 0 #17140f`, small stamps `4px 4px 0 #17140f`.
- **Rotations** for the "stuck-on-by-hand" feel: BOOK button `-1.5deg`, tagline `-0.5deg`, cassette `-1.4deg`, tape strip `-2.5deg`, "DOORS" stamp `+4deg`, "SOLD OUT" `-4deg`, genre chips `±0.5–1deg`, redacted personnel bars `±0.5–1deg`.
- Text selection: `::selection { background:#d83a2b; color:#efe8d6; }`.

### Spacing / layout
- Content column max-width **1180px** (hero, deck, mixtape, gigs), **1080px** for About/Contact. Centered with `margin:0 auto`. Horizontal padding **44px**.
- Sticky nav height ~62px (`padding:15px 34px`).

---

## Screens / Views

The site is one page with a router. `state.page` is `'home' | 'about' | 'contact'`. Home is toggled via `display` (kept mounted so the tape keeps playing across nav); About and Contact are conditionally rendered. Changing page calls `window.scrollTo(0,0)`.

### Global — Top Nav (sticky, all views)
- `position:sticky; top:0; z-index:50`. Full-width dark band `#17140f`, text `#efe8d6`, `border-bottom:3px solid #17140f`.
- Left: wordmark **'92 SUBARU** (Anton, 26px) → Home.
- Right: **HOME / ABOUT / CONTACT** (Courier 700, 13px, letter-spacing 1.5px). Active item: full opacity + `border-bottom:3px solid #d83a2b`. Inactive: `opacity:0.55`.
- **BOOK** button: red `#d83a2b`, cream text, Anton, `padding:8px 15px`, rotated `-1.5deg` → Contact.

### Global — Footer (all views)
Dark band. Left: wordmark (Anton 22px). Center: `DALLAS // FORT WORTH · NORMAL BIAS 120µs EQ` (12px, opacity .65). Right: `© 2026 · REWIND SIDE B`.

### HOME
Vertical stack: Hero → Cassette → Deck → Mixtape → Gigs.

**1. Hero (centered flyer)** — `position:relative; overflow:hidden`, content centered, `text-align:center`, padding `60px 44px 40px`.
- **Scanner sweep** (toggleable): an absolutely-positioned 160px-tall gradient bar `linear-gradient(180deg, transparent, rgba(216,58,43,.13), transparent)` that animates top-to-bottom on a 7s linear loop (`@keyframes xscan { 0%{translateY(-160px)} 100%{translateY(700px)} }`), `pointer-events:none`, clipped by the hero. Evokes a photocopier scan light.
- **"DOORS 9 · ALL NIGHT" stamp** (toggleable): absolute top-right, red outline (`2px solid #d83a2b`), Anton 14px, rotated `+4deg`.
- **Eyebrow:** `◂ DALLAS · FORT WORTH · 12" MIX ▸` — Courier 700, 12px, letter-spacing 5px, red, pulsing opacity (`@keyframes xpulse` .5→1, 2s).
- **Title:** `'92 SUBARU` — Anton 118px, `line-height:.85`, red hard shadow `7px 7px 0`, subtle photocopy flicker (`@keyframes xflick`, brief opacity dips, 6s loop).
- **Tagline:** `// MAX VOLUME TRIBUTE TO THE DECADE OF THE DROP //` in a `2px dashed #17140f` box on `#fffdf5`, rotated `-0.5deg`.
- **"NEXT" show pill:** cream box, `2px solid #17140f`, hard shadow `4px 4px 0`, reading `NEXT ▸ AUG 14 · TREES` + a rotated `SOLD OUT` red-outline chip.
- **EQ meter:** a centered row of 9 bars (7px wide), alternating red/ink, heights 42–100%, each `transform-origin:bottom` running `@keyframes eqbar` (scaleY .22↔1) at .5s with staggered `animation-delay`s. Purely decorative; always animating.

**2. Cassette** — centered, `max-width:520px`, rotated `-1.4deg`, with a translucent "tape strip" rectangle (`rgba(220,214,196,.72)`, 150×34px, rotated `-2.5deg`) overlapping its top edge. This is the `Cassette` component (see below), driven by the deck state.

**3. The Deck** — dark card `#17140f`, cream text, `3px solid #17140f`, hard shadow `8px 8px 0`.
- Left: `▶ TAPE ROLLING — SIDE {A|B}` (red, 11px, letter-spacing 2px); active track **title** (Anton 26px, uppercase); `{trackNo} · {artist} · {year}` (12px, opacity .75).
- Right: transport controls — **prev / play·pause / stop / next**, plus an **A | B** side toggle.
  - prev/stop/next: 44×44px cream squares with black glyphs, `2px solid #efe8d6`.
  - play/pause: 56×56px red `#d83a2b` square, cream glyph; active state `transform:translate(2px,2px)`. Icon swaps between ▮▮ (playing) and ▶ (paused).
  - A/B toggle: `2px solid #efe8d6` bordered pair; active side = solid cream bg with ink text, inactive = transparent with cream text.
- Below: progress row — elapsed time (red) · a 14px-tall bar (`2px solid #efe8d6` over a `repeating-linear-gradient(90deg,#efe8d6 0 3px,transparent 3px 7px)` dashed track) with an absolute red `#df3b2c` fill at `{pct}%` · total duration (opacity .7). All times `M:SS`.

**4. The Mixtape (J-card)** — full-bleed lined-paper band, `border-top:3px solid #17140f`.
- Header: **THE MIXTAPE** (Anton 44px, uppercase, rotated `-1deg`) + a **SIDE A | SIDE B** toggle (active = `#17140f` bg / cream text).
- Track rows (5 for the current side): `{no}` (Courier 700, 30px-wide col) · `{title}` (Courier 700, 17px) + ` — {artist}, {year}` (12px, opacity .7) · `{dur}`. Row divider `1px dotted #17140f`; hover `background:#0000000a`. Clicking a row selects + plays that track.
- **Active row** adornment: a rotated translucent red highlight bar near the row bottom (`left:44px; right:70px; bottom:6px; height:6px; #d83a2b; opacity:.45; rotate(-.5deg)`) and a tiny 3-bar ink EQ (same `eqbar` animation).

**5. Gigs** — full-bleed dark band, `border-top:3px solid #17140f`.
- Header: **GIGS** (Anton 44px) + **UPCOMING | PAST** toggle (active = red bg, cream text).
- Rows: 3-col grid `120px 1fr 130px`, divider `1px dashed #55503f`. Date (Anton 20px, red) · venue (Courier 700, 16px) + ` / {city}` (12px, opacity .65) · right-aligned status **badge**:
  - `SOLD OUT` → `2px solid #d83a2b`, red text, rotated `-3deg`.
  - `GET TICKETS` → solid cream bg, ink text.
  - `PLAYED` → muted, `1px dashed #55503f`, text `#8a856f`.

### ABOUT ("Liner Notes")
Max-width 1080. Kicker tag `SIDE B // OFF THE RECORD` (ink bg, cream text, rotated `-1deg`). Title **LINER / NOTES** (Anton 96px, red shadow). Lead paragraph in a dashed callout box (19px, `line-height:1.7`) with the word "louder" highlighted (red bg, cream text). Two columns:
- **PERSONNEL** — VOCALS / GUITAR / BASS / DRUMS, each a label + dotted leader + a **redacted** black bar (`background` and `color` both `#17140f`, so the "████" is unreadable), rotated slightly. Caption: `// names withheld. the music speaks for itself.`
- **SPECS** — label/value rows: FORMED `1998 · Denton, TX`; BASED `Dallas–Fort Worth`; SET LENGTH `2 × 45 min`; FORMAT `C60 mixtape`; BIAS `Normal · 120µs EQ`; VOLUME `Too loud` (red).
Then **WHAT WE PLAY** — genre chips (bordered, rotated): GRUNGE, BRITPOP, POP-PUNK, **EURODANCE** (solid red), HIP-HOP, R&B. Two CTAs: `◂ HEAR THE TAPE` (ink → Home) and `BOOK US ▸` (red → Contact), both with hard shadows.

### CONTACT ("Book The Tape")
Max-width 1080. Kicker `BOOKING // TECHNICAL SPECS`. Title **BOOK THE / TAPE** (Anton 96px, red shadow). Two columns `1.4fr .9fr`:
- **Booking form** — framed panel `3px solid #17140f` on `#fffdf5`, hard shadow `7px 7px 0`; dark title bar `MODEL '92 — BOOKING REQUEST` + `FORM / SIDE A`. Fields: **EVENT DATE*** (`type=date`, `min=2026-07-11`), **EVENT TYPE** (select: Bar/Club, Private Party, Wedding, Corporate/Brand, Festival), **LOCATION / VENUE***, **BUDGET RANGE** (select: Under $1,500 / $1,500–3,000 / $3,000–6,000 / $6,000+ / Let's talk), **MESSAGE*** (textarea). Inputs: cream `#efe8d6`, `2px solid #17140f`; focus = red border + `box-shadow:0 0 0 3px rgba(216,58,43,.18)`. Submit **SEND TRANSMISSION ▸** (red, Anton 20px, hard shadow; active nudges `translate(3px,3px)`).
- **Info panel** — DIRECT LINE card (`booking@92subaru.fm`, `Dallas–Fort Worth & beyond`, response `< 48 hours` in red) and a dark ON THE DIAL card (instagram / youtube / bandcamp / tiktok @92subaru).

---

## Interactions & Behavior

### Routing
- `setPage('home'|'about'|'contact')` sets `state.page` and scrolls to top. Nav links + logo + BOOK/CTA buttons call these. Home stays mounted (via `display`) so audio/playhead persist; About/Contact mount only when active.

### Tape transport (state on the component)
- `playing:boolean, side:'A'|'B', idx:number(0–4), elapsed:seconds, flip:deg, tf:'upcoming'|'past'`.
- **play/pause** toggles `playing`, starts/stops a 250ms timer and the audio.
- **Timer:** every 250ms, `elapsed += 0.25`; when `elapsed >= track.duration`, advance `idx = (idx+1)%5`, reset elapsed, restart audio (auto-advance).
- **prev/next:** `idx = (idx+4)%5` / `(idx+1)%5`, reset elapsed; if playing, restart audio.
- **pick(i):** jump to track i and play.
- **Side A/B flip:** if new side, set `side`, reset `idx`/`elapsed`, and add `+360` to `flip` (spins the cassette). The cassette flips via a CSS `rotateY(var(--cass-flip))` with an `.8s cubic-bezier(.34,1.2,.4,1)` transition.
- **Reel spin:** cassette reels animate only while `playing` (`animation-play-state`), speed = `--reel-speed`.

### Animations (all CSS, infinite)
- `eqbar` (0.5–0.6s) scaleY 0.22↔1 — hero meter + active-row mini EQ.
- `xpulse` (2s) opacity 0.5↔1 — eyebrow.
- `xscan` (7s linear) translateY sweep — hero scanner light.
- `xflick` (6s) brief opacity dips — hero title photocopy flicker.
- Cassette flip transition 0.8s; reel spin `--reel-speed` linear.

### Form validation
- Required: **date, location, message**. On submit, if any is empty → set `err=true` and show `⚠ Fill in event date, location, and message.` (red).
- On success → set `sent=true`, scroll to top, and swap the form body for a confirmation: rotated `TAPE RECEIVED` stamp + "we'll rewind within 48 hours" + `◂ SEND ANOTHER` (resets form).
- Any field edit clears `err`.

## State Management
Single component holds it all:
- **Routing:** `page`.
- **Player:** `playing, side, idx, elapsed, flip, tf`. Derived per render: active track, duration, `pct = elapsed/dur*100`, current side's 5-track list, current tour list.
- **Form:** `form:{date,type,location,budget,message}, sent, err`.
- **Tweak props** (see below): `beatMs, sweep, doorsStamp`.
No data fetching — `tracks` (A/B, 5 each) and `tour` (upcoming/past) are hardcoded arrays in the class; lift them into your data layer as-is.

## Audio — synthesized "bootleg-tape rave" (Web Audio API)
Generated live; no audio files. Port the logic methods directly. Signal path: all voices → `master` gain → **tape lowpass** (`lowpass`, 5200Hz, Q 0.4) → destination, giving the whole loop a dull, off-a-worn-cassette character. Master ramps to 0.5 on play, to ~0 on stop.
- **Tape hiss:** looping white-noise buffer → `highpass` 4600Hz → gain 0.03 → master. Constant while playing.
- **Step sequencer:** a step counter ticks every `beatMs` (default 140ms). Each step (`raveStep`):
  - **Kick** on `step%4===0`: sine 140→45Hz pitch drop over 0.12s, gain env to 0.9, ~0.22s.
  - **Hat** on `step%2===1`: white noise → `highpass` 6800Hz, short 0.05s blip, gain 0.09.
  - **Bass** on even steps: sawtooth through `lowpass` 440Hz with a 5.5Hz detune **wobble** (±16 cents) for tape flutter; notes from `[0,0,7,5]` semitone offsets of 98Hz; 0.16s, gain 0.12.
  - **Lead** on `step%4!==2`: sawtooth through `lowpass` 2400Hz; notes from `[12,7,12,15,12,7,10,7]` semitone offsets of 220Hz; 0.11s, gain 0.055.
- Web Audio needs a user gesture — the AudioContext is created/resumed inside the play handler. Changing `beatMs` while playing restarts the loop at the new tempo.

Recreate with the platform's audio API (Web Audio on web; on native, either a lightweight synth or pre-render loops that match this recipe).

## Tweakable props (design knobs)
Exposed as component props with sensible defaults:
- **beatMs** — number, 100–220ms (default 140). Loop tempo; also scales the cassette reel speed (`reelSpeed = 1.05 * beatMs/140` seconds).
- **sweep** — boolean (default true). Show/hide the hero scanner-light sweep.
- **doorsStamp** — boolean (default true). Show/hide the "DOORS 9 · ALL NIGHT" hero stamp.

## The Cassette component
One responsive SVG (`viewBox 0 0 800 520`, scales to container width) themed entirely through CSS custom properties — recreate as a component that accepts these:
- Colors: `--cass-body, --cass-body-edge, --cass-body-hi, --cass-ink, --cass-ink-soft, --cass-label, --cass-stripe, --cass-accent, --cass-band, --cass-band-ink, --cass-gear, --cass-clutch, --cass-teal, --cass-teal-hi, --cass-window, --cass-hole`.
- `--cass-filter` — an SVG filter ref for the photocopy roughen effect (`#cass-rough`, a `feTurbulence`+`feDisplacementMap` defined in the SVG's `<defs>`). A `#cass-glow` filter also exists but is unused in this theme.
- `--cass-drop` — the drop-shadow filter on the whole SVG.
- **Motion:** `--reel-play` (`running`/`paused`) and `--reel-speed` drive the two reels' `cass-reel-spin` rotation; `--cass-flip` (deg) sets a `rotateY` on the outer wrapper for the Side A/B flip.

The exact **Xerox-theme values** are in the site's logic as `XPAL`:
```
--cass-body:#17150f; --cass-body-edge:#000; --cass-body-hi:#3a352b; --cass-ink:#141210;
--cass-ink-soft:#141210; --cass-label:#f3ecd9; --cass-stripe:#df3b2c; --cass-accent:#df3b2c;
--cass-band:#211f1a; --cass-band-ink:#f3ecd9; --cass-gear:#e7e0cd; --cass-clutch:#141210;
--cass-teal:#cdc7b4; --cass-teal-hi:#eae4d2; --cass-window:#8f897a; --cass-hole:#0c0b09;
--cass-filter:url(#cass-rough); --cass-drop:drop-shadow(0 8px 0 rgba(20,18,16,.20));
```

## Assets
No external image/icon assets. All iconography is inline SVG (transport controls) or pure CSS/type. Fonts are Google Fonts (Anton, Courier Prime). The cassette is inline SVG. Nothing to license or export.

## Files
- `xerox_rave_site.html` — the full site (template + logic). Primary reference.
- `Cassette.dc.html` — the SVG cassette sub-component (themable via CSS vars).
- `support.js` — the prototype runtime, included **for reference only so the prototype can be opened in a browser**. Do not port it; recreate components in your framework instead.

### Running the prototype locally
Serve the folder over HTTP (e.g. `npx serve .`) and open `xerox_rave_site.html`. Opening via `file://` may block the font/runtime loads. Click **play** on the deck to start audio (browser autoplay policy requires the gesture).
