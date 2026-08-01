# Architecture Decision Record (ADR): Autoplay First Song on Site Arrival

**Status**: ACCEPTED  
**Date**: 2026-08-01  
**Project**: '92 Subaru (`92-Subaru`)  
**Feature**: Autoplay First Song ("Dreams - The Cranberries") on `92subaruband.com` arrival  

---

## 1. Context & Problem Statement
Visitors landing on `92subaruband.com` should immediately experience the band's signature sound. However, modern web browsers (Chrome, Safari, iOS Safari, Firefox, Edge) strictly enforce Autoplay Policies that reject un-muted `.play()` calls on audio elements unless the user has previously interacted with the document.

The architecture must provide an immediate audio experience on permissive browsers while gracefully handling autoplay restrictions on security-enforced browsers without crashing, throwing unhandled JS promise rejections, or disrupting site navigation.

---

## 2. Decision Drivers
1. **User Experience (UX)**: Immediate audio delivery matching the retrowave car-cabin aesthetic.
2. **Browser Compliance**: Compliance with Chrome, Safari, and WebKit autoplay policies.
3. **Session Intelligence**: Avoid re-triggering audio restarts when users navigate between internal pages (`Home`, `About`, `Book`).
4. **User Preference**: Respect explicit user pause actions across visits.

---

## 3. Evaluation of Architectural Options

### Option 1: Direct Unmuted Play with Retro Gesture Fallback Overlay (SELECTED)
- **Description**: Attempt un-muted `audio.play()` immediately on main site initial load. If the browser permits it, audio plays instantly. If rejected by browser autoplay restrictions (`DOMException`), display a retro-styled '92 Subaru tape deck overlay modal ("TAP ANYWHERE TO START TAPE"). The first user tap/click triggers `play()` and dismisses the overlay.
- **Pros**:
  - Delivers unmuted audio immediately whenever allowed.
  - Zero raw browser error alerts; provides a stylized retro landing experience on restricted browsers.
  - Guaranteed user gesture capture for 100% reliability on mobile Safari and Chrome.
- **Cons**: Requires an extra modal overlay component on restricted browsers.

### Option 2: Muted Autoplay with Floating Unmute Toast
- **Description**: Start the audio player muted (`muted = true`, `.play()`) and display a persistent floating toast button prompting the user to unmute.
- **Pros**: Video/visualizers run immediately regardless of browser policy.
- **Cons**: Muted music defeats the primary goal of an immediate auditory music experience; unmuting requires finding and tapping a small toast.

### Option 3: Transport PLAY Button Pulse Only
- **Description**: Attempt `play()`; if blocked, highlight and pulse the existing cassette deck transport PLAY button.
- **Pros**: No full-screen overlay required.
- **Cons**: Users on small mobile screens may not notice the small PLAY button, leading to confusion as to why the site is silent.

---

## 4. Final Decision Outcome
**Selected Option 1: Direct Unmuted Play with Retro Gesture Fallback Overlay**.

### Implementation Details:
- Integrated `triggerAutoplayOnLoad()` into `public/app.js`.
- Utilized `sessionStorage.getItem('92subaru_autoplay_attempted')` to scope autoplay to initial tab session.
- Utilized `localStorage.getItem('92subaru_user_paused')` to honor manual pause choices across sessions.
- Added `#autoplay-overlay` modal in `public/index.html` styled with `#d83a2b`, `#efe8d6`, and glassmorphism backdrop in `public/styles.css`.

---

## 5. Constitution Verification (Articles I–VIII)
- **Article I (Specs as Source of Truth)**: Verified 1:1 mapping to `specs/002-autoplay-first-song/spec.md`.
- **Article II (Test-First & Error Handling)**: Verified `.play()` promise catch handling (`audio.play().catch(...)`); zero silent swallows or unhandled rejections.
- **Article III (Contract Integrity)**: Native HTML5 Audio engine interfaces clean and responsive.
- **Article IV (Runtime Integrity)**: Vanilla JavaScript ES6+ execution without heavy framework overhead.
- **Article V (Pruned State & Persistence)**: Clean `sessionStorage` and `localStorage` scoping.
- **Article VI (Idempotent State)**: Safe state transitions (`state.playing`, `state.idx`).
- **Article VII (Documentation & Traceability)**: Full ADR, specification, implementation plan, and walkthrough artifacts authored.
- **Article VIII (Visual Mutation & Styling)**: Consistent 90s retrowave design system.
