# Launch-Batch Requirements Checklist: 8-Issue "No Blockers" Pass

**Purpose**: Validate that requirements are complete, clear, and consistent for the single-pass launch batch — #4 form fields (B-defaults), #23 themed 404, #21 privacy draft, #19 SEO/OG (generated image), #22 mobile pass, #8 reCAPTCHA scaffolding (test keys), #26 hide Gigs, #1 Vercel config — before implementation.
**Created**: 2026-07-28
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [tasks.md](../tasks.md) · [copy-deck.md](../copy-deck.md)
**Note**: IDs continue from [requirements.md](requirements.md) (ends CHK033) so CHK references stay unique across the feature.

## Requirement Completeness

- [x] CHK034 Are the "Option B" form-field defaults (which fields are optional, labels, input types for Event Date / Event Type / Budget) recorded in spec.md or copy-deck.md, rather than existing only in conversation? [Traceability, Gap, Spec §FR-001] (#4) — **Resolved 2026-07-28: Event Type + Budget are dropdowns with preset options, now recorded in FR-001; T004 updated.**
- [x] CHK035 Are per-field validation rules specified — email format, phone format when provided, whether past event dates are rejected, message length limits? [Completeness, Gap, Spec §FR-001/§FR-003] (#4) — **Resolved 2026-07-28: Event Date must be today or later (owner decision); well-formed email + length caps recorded as defaults in FR-003. Phone stays free-form (optional field).**
- [x] CHK036 Is the 404 requirement complete: themed copy ("SIDE B NOT FOUND — rewind ◂"), a route back home, and a real HTTP 404 status code — or does FR-021 only require that a page renders? [Completeness, Spec §FR-021, tasks T023] (#23) — **Resolved 2026-07-28 (owner): full package — themed copy + home link + real HTTP 404 status. FR-021 + T023 updated.**
- [x] CHK037 Are the third-party processors this batch introduces (reCAPTCHA, analytics, email provider) required to be disclosed in the privacy policy? [Gap, Consistency, Spec §FR-004/§FR-018/§FR-019] (#21, #8) — **Resolved 2026-07-28 (owner): disclose all three by name with the data each receives. FR-019 + T021 updated.**
- [x] CHK038 Are share-image requirements specified — dimensions/format (e.g., 1200×630), and whether a generated image is acceptable at launch versus owner-approved art? [Gap, Spec §FR-017] (#19) — **Resolved 2026-07-28: generated 1200×630 image, owner approval required before launch. FR-017 + T019 updated.**
- [x] CHK039 Is the full env-var/secret inventory for launch (booking destination email, email API key, reCAPTCHA secret, analytics ID) enumerated as a deliverable of the Vercel config + README? [Completeness, Gap, Spec §FR-016/§FR-005, tasks T001] (#1) — **Resolved 2026-07-28: `BOOKING_EMAIL` (= 92subaruband@gmail.com), `RESEND_API_KEY`, `RECAPTCHA_SECRET_KEY`, Umami website ID; recorded in T001's README deliverable (key name updated with the 2026-07-28 provider swap).**

## Requirement Clarity

- [x] CHK040 Is "scaffolding with test keys" defined — what behavior under public test keys constitutes done, and is the production-key swap captured as an explicit remaining requirement (not lost in "credential-wiring")? [Clarity, Gap, Spec §FR-004] (#8) — **Resolved 2026-07-28 (owner, after reCAPTCHA/Vercel clarification): done = E2E token verification under public test keys, pass + fail paths; swap tracked as new task T030 (⛔ owner registers Google reCAPTCHA keys). FR-004 updated.**
- [x] CHK041 Is client-side reCAPTCHA failure behavior specified (script blocked or unreachable) — does the booking form fail open or fail closed? [Clarity, Edge Case, Spec §FR-004] (#8) — **Resolved 2026-07-28: fail open; honeypot + server-side rate limit still enforced. FR-004 + T008 updated.**
- [x] CHK042 Is "hide Gigs (keep code/data)" defined precisely — removed from nav/DOM versus visually hidden — and is the re-enable condition stated? [Clarity, Spec §Assumptions, tasks T026/T029] (#26) — **Resolved 2026-07-28: single config flag (`SHOW_GIGS`) removes it from nav + DOM; re-enable = flip the flag. T026 updated.**
- [x] CHK043 Is the "ready for account link" Vercel deliverable defined in verifiable terms — what must pass without Vercel credentials (local build, config validity, documented deploy steps)? [Clarity, Measurability, plan §Complexity Tracking] (#1) — **Resolved 2026-07-28 (owner): DoD = local build + serve under Vercel-compatible entry, `vercel.json` validates, `deno test` green, README deploy steps. T001 updated.**
- [x] CHK044 Is honeypot behavior specified — silent drop versus visible error — so a false-positive human isn't stranded? [Clarity, Gap, Spec §FR-004] (#8) — **Resolved 2026-07-28 (owner): fake success — normal "TAPE RECEIVED" confirmation, no email sent. FR-004 + T008 updated.**

## Requirement Consistency

- [x] CHK045 Do FR-001 (nine collected fields) and FR-019 ("data retained: First/Last Name, Email, Phone") agree on the status of Event Date, Event Type, Location, Budget, and Message in the retention notice, given the email contains all of them? [Conflict, Spec §FR-001/§FR-019] (#21, #4) — **Resolved 2026-07-28 (owner): retained = all nine submitted fields, Event Type included (confirmed same day). FR-019 + T021 updated; notice now matches FR-001 exactly.**
- [x] CHK046 Are OG/Twitter title and description required to come from the approved copy-deck, consistent with the no-placeholder-copy rules? [Consistency, Spec §FR-017/§FR-013/§FR-014] (#19) — **Resolved 2026-07-28 (owner): yes — title from wordmark + hero tagline, description from About ¶1; no new copy. FR-017 updated.**
- [x] CHK047 Does FR-020 / SC-005 ("all pages", mobile check) explicitly include the pages this batch adds — privacy and 404? [Consistency, Coverage, Spec §FR-020/§SC-005] (#22, #21, #23) — **Resolved 2026-07-28 (owner): SC-005 now names Home, About, Book, privacy, 404 (+EPK when it ships). T022 updated.**
- [x] CHK048 Does hiding the Gigs panel contradict any approved copy-deck nav/footer/hero content that references gigs or dates? [Consistency, copy-deck, tasks T026] (#26) — **Resolved 2026-07-28 (verified in copy-deck): no conflict — approved nav (HOME/ABOUT/BOOK), footer, and hero contain no gigs/dates references. Side-effect finding: copy-deck's "Dallas–Fort Worth metroplex" conflicted with FR-012's plain ruling → resolved, copy-deck wins; FR-012 updated with precedence rule.**

## Acceptance Criteria Quality

- [x] CHK049 Does each of the 8 batch issues have an acceptance criterion traceable to a spec FR/SC that is verifiable without owner credentials or approvals? [Traceability, Measurability] (batch) — **Resolved 2026-07-28 (mapping): #1→FR-016 + T001 DoD · #4→FR-001/FR-003 · #23→FR-021 · #21→FR-019 (draft content verifiable; approval is a separate gate) · #19→FR-017/SC-006 (meta + image build verifiable; image approval separate) · #8→FR-004 test-key E2E · #26→T026 flag semantics · #22→FR-020/SC-005. Only the two approval gates (image, privacy draft) need the owner.**
- [x] CHK050 Can SC-006 ("branded preview") be validated pre-launch with a generated image, or does "branded" imply owner approval — and is that approval gate written down? [Measurability, Spec §SC-006] (#19) — **Resolved 2026-07-28: owner approval of the generated image is a launch gate, recorded in FR-017/T019; SC-006 is validated with the approved image.**

## Scenario & Edge Case Coverage

- [x] CHK051 Is behavior specified for unknown API routes (e.g., a POST to a bad endpoint) versus unknown page routes — JSON error versus themed 404? [Edge Case, Gap, Spec §FR-021] (#23) — **Resolved 2026-07-28 (owner): API routes return JSON errors; page routes get the themed 404. FR-021 + T023 updated.**
- [x] CHK052 Are responsive requirements defined for the expanded nine-field form — field stacking, order, and tap-target size at 360–414px? [Coverage, Spec §FR-001/§FR-020] (#22, #4) — **Resolved 2026-07-28 (owner): single column in FR-001 order, full width, ≥44px tap targets. FR-020 + T022 updated.**

## Provider Swap: Cloudflare Turnstile → Google reCAPTCHA (2026-07-28, owner decision)

- [x] CHK056 Is the provider swap reflected in every document that named Turnstile/Cloudflare? [Consistency, Traceability] — **Resolved 2026-07-28: swept spec.md (US1 §3, FR-004, FR-019), tasks.md (T001, T008, T030, deps), plan.md, BACKLOG.md (D1-12 ×2), batch-prompt.md, copy-deck.md (§Book), and this checklist. Grep for "Turnstile" returns only historical swap annotations.**
- [x] CHK057 Are the reCAPTCHA version and test-key strategy specified — which version, and do official test keys exist to preserve the E2E DoD? [Clarity, Spec §FR-004] (#8) — **Resolved 2026-07-28: v2 checkbox, chosen because Google publishes official universal test keys for v2 only; E2E pass/fail DoD carries over unchanged.**
- [x] CHK058 Are Google's attribution/terms requirements covered — badge or Privacy Policy/Terms links visible where the widget runs? [Completeness, Spec §FR-019] (#8, #21) — **Resolved 2026-07-28: the v2 checkbox widget displays Google branding itself; FR-019 discloses reCAPTCHA with a pointer to Google's Privacy Policy/Terms; consent-line note added to copy-deck §Book.**
- [ ] CHK059 Does reCAPTCHA's use of Google cookies conflict with the site's no-cookie-banner posture (FR-018 chose cookieless analytics specifically to avoid one)? [Consistency, Assumption, Spec §FR-004/§FR-018] — **Open, flagged to owner: reCAPTCHA may set Google cookies on the Book page — a privacy trade-off Turnstile didn't have. Common practice for a US-only site is to ship without a banner and rely on the privacy-policy disclosure; revisit only if EU traffic matters.**

## Dependencies & Assumptions

- [ ] CHK053 Is the "no blockers" claim validated per issue — does any of the 8 hide an owner dependency (reCAPTCHA account/site key ownership, Vercel account, privacy-draft approval, OG image approval)? [Assumption] (batch) — **Deferred 2026-07-28 (owner): validate in the next batch alongside credential-wiring; not a gate for this pass.** *(Partial answer already known via CHK049/CHK055: the hidden dependencies are the two approval gates, the reCAPTCHA key registration (T030), and the Vercel account link.)*
- [x] CHK054 Is the fate of the parked deploy paths (Deno Deploy CI workflow, Dockerfile, fly.toml) specified — deleted, disabled, or documented as inert — so two deploy stories don't coexist? [Completeness, Gap, tasks T001] (#1) — **Resolved 2026-07-28: delete all three (git history preserves them); T001 updated.**
- [x] CHK055 Is the privacy-page "draft" status assigned an approver and a needed-by point inside the launch window? [Assumption, Spec §Assumptions] (#21) — **Resolved 2026-07-28 (owner): owner approves, pre-deploy — one combined approval moment with the OG image in the credential-wiring batch. FR-019 + T021 updated.**

## Notes

- Check items off as the spec/tasks are tightened: `[x]`, with findings inline.
- **Status: 24 of 26 resolved; CHK053 deferred by owner to the credential-wiring batch, CHK059 (reCAPTCHA cookie posture) flagged non-blocking. The pass is clear to start.**
- **Provider swap 2026-07-28**: Cloudflare Turnstile → Google reCAPTCHA v2 (owner decision). CHK040/041/044 resolutions carry over with vendor and key names renamed (`RECAPTCHA_SECRET_KEY`, Google public v2 test keys, T030 keys under the band's Google account).
- Owner approval gates before first production deploy: OG share image (FR-017) + privacy draft (FR-019), reviewed together.
- Overlaps with the broad checklist are intentional narrowings: CHK037→CHK005, CHK040/CHK044→CHK011, CHK050→CHK020.
