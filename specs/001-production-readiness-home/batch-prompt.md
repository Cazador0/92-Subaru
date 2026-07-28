# Kickoff prompt — 8-issue launch batch

Paste everything below the line into a fresh Claude Code session started in the repo root
(`/Users/cazador_the_first/source/92-Subaru`), or run:
`claude "$(sed '1,/^---$/d' specs/001-production-readiness-home/batch-prompt.md)"`

---

We are executing the 8-issue launch batch for the '92 Subaru site on branch `001-production-readiness-home`. All requirements decisions are already made and encoded — do not re-open them; read them from:

- `specs/001-production-readiness-home/spec.md` (FRs carry "decided 2026-07-28" annotations)
- `specs/001-production-readiness-home/tasks.md` (batch = T001, T004, T008, T019, T021, T022, T023, T026)
- `specs/001-production-readiness-home/checklists/launch-batch.md` (resolved items = the decision record; open items list the defaults to apply)
- `specs/001-production-readiness-home/copy-deck.md` (authoritative copy for nav/home/footer)

Run these speckit commands in order:

1. `/speckit-git-validate` — confirm we're on `001-production-readiness-home` (never commit to main).
2. Safety check: `git status` should be clean — the decision record is already committed (`b2c2e21`). If anything is uncommitted, `/speckit-git-commit` it before touching code.
3. `/speckit-implement` scoped to **only** these tasks, in this order (mobile pass last so it covers pages created earlier; Vercel first as the highest-risk item):
   - **T001** (#1) Vercel config: `vercel.json` + README (env vars `BOOKING_EMAIL`, `RESEND_API_KEY`, `RECAPTCHA_SECRET_KEY`, Umami website ID; launch domain is `<project>.vercel.app`). Delete `.github/workflows/deno.yml`, `Dockerfile`, `fly.toml`.
   - **T004** (#4) Booking form fields per FR-001 — Event Type and Budget are dropdowns with the exact options listed in FR-001.
   - **T023** (#23) Themed 404 ("SIDE B NOT FOUND — rewind ◂"), served with a real HTTP 404 status; unknown API routes return JSON errors, unknown page routes get the themed page (CHK036/CHK051).
   - **T021** (#21) Privacy page draft + form consent line — retained data = all nine submitted fields (FR-019); disclose third parties by name with the data each receives: Resend, Google reCAPTCHA, Umami. Draft ships to the branch but is ⛔ owner-approved before first production deploy — flag it for review like the OG image.
   - **T019** (#19) SEO/OG: favicon, OG/Twitter meta, generated 1200×630 share image; absolute URLs use the vercel.app domain. Title/description come from approved copy-deck strings only (wordmark + hero tagline; description from About ¶1) — write no new copy. The image ships only after owner approval — build it, but flag it for review.
   - **T008** (#8) Google reCAPTCHA v2 checkbox scaffolding with Google's public **v2 test keys** (provider swapped from Turnstile 2026-07-28) — DoD is E2E token verification, pass + fail paths (FR-004); fail open if the script doesn't load; honeypot = fake success (confirmation shown, no email); server-side rate limit. The real-key swap is T030 (next batch — do not attempt).
   - **T026** (#26) Hide Gigs behind a single `SHOW_GIGS`-style config flag that removes it from nav + DOM.
   - **T022** (#22) Mobile responsive pass — no horizontal overflow at 360/390/414px on **all** pages including the new privacy and 404 pages (SC-005); booking form renders single-column in FR-001 order with ≥44px tap targets (FR-020). Location wording follows FR-012's precedence rule: approved copy-deck strings win; plain "Dallas Fort Worth" elsewhere.
4. Verify: `deno test` green (merge precondition) plus a manual smoke of the booking form and 404.
5. `/speckit-git-commit` per task or logical group, conventional format.

Out of scope — do not touch: T012 (YouTube player), T014/T024 (owner copy), T018 (EPK epic), T020 (Umami install is credential-wiring), real reCAPTCHA/Resend keys, custom domain. Anything marked ⛔ in tasks.md stays blocked.

Finish by reporting: which tasks completed, test results, the two items now awaiting owner approval (OG image, privacy draft), and anything that had to deviate from spec.
