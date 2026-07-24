# Requirements Quality Checklist: Production Readiness — '92 Subaru Site

**Purpose**: Validate that the requirements in `spec.md` are complete, clear, consistent, and measurable before implementation ("unit tests for the requirements").
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)

## Requirement Completeness

- [ ] CHK001 Is the requester-facing outcome specified when the email provider fails *after* validation passes (delivery error vs. silent loss)? [Gap, Spec §Edge Cases / FR-002]
- [ ] CHK002 Are requirements defined for the content of the booking confirmation ("TAPE RECEIVED") and the follow-up expectation shown to the user? [Completeness, Spec §US1]
- [ ] CHK003 Is the number of songs and the source of the soundtrack track list specified (how many, chosen by whom)? [Gap, Spec §FR-008]
- [ ] CHK004 Are the EPK "downloadable assets" enumerated with format(s) (e.g., PDF one-sheet, hi-res photos)? [Gap, Spec §FR-015]
- [ ] CHK005 Does the spec state what the privacy policy must contain, not just that it is linked? [Gap, Spec §FR-019]
- [ ] CHK006 Are favicon and Open Graph/Twitter asset requirements specified (sizes, formats, image content)? [Gap, Spec §FR-017]
- [ ] CHK007 Are the specific analytics events/pages-to-track defined, or only that analytics exists? [Gap, Spec §FR-018]
- [ ] CHK008 Are requirements defined for how hiding the Gigs panel (Day 2) preserves Home layout/flow? [Coverage, Spec §Assumptions / BACKLOG D2-01]

## Requirement Clarity

- [ ] CHK009 Is "100% personalized / no placeholder copy" given an objective, per-page definition of done? [Clarity, Spec §FR-013 / SC-003]
- [ ] CHK010 Are the soundtrack player "loading and error states" defined with specific triggers and messages? [Clarity, Spec §FR-009]
- [ ] CHK011 Is "protected from automated abuse" quantified (rate-limit threshold, honeypot behavior, what counts as blocked)? [Clarity, Spec §FR-004]
- [ ] CHK012 Is "privacy-friendly analytics with no cookie-consent banner" tied to a concrete acceptance condition? [Clarity, Spec §FR-018 / SC-006]
- [ ] CHK013 Is "Dallas Fort Worth" location wording specified consistently (spacing/en-dash vs. plain) to avoid drift? [Clarity, Spec §FR-012]

## Requirement Consistency

- [ ] CHK014 Do the form fields (FR-001) and the "data retained" list (Key Entities / FR-019) agree on which fields are stored vs. only emailed? [Consistency, Spec §FR-001 / §FR-019]
- [ ] CHK015 Does "email is the system of record; not persisted" conflict with any implied read-back of past bookings (e.g., a GET listing)? [Conflict, Spec §FR-002 / Key Entities]
- [ ] CHK016 Is the primary page name consistent ("Book" vs "Contact") across user stories and requirements? [Consistency, Spec §US1 / §FR]
- [ ] CHK017 Are FR-008 (embedded YouTube) and FR-010 (owner audio files) reconciled on which is authoritative and when? [Consistency, Spec §FR-008 / §FR-010]

## Acceptance Criteria & Measurability

- [ ] CHK018 Is SC-001 ("email within 1 minute") measurable given delivery depends on a third-party provider? [Measurability, Spec §SC-001]
- [ ] CHK019 Is SC-003 ("0 placeholder strings") backed by an enumerable inventory of pages/strings to check? [Measurability, Spec §SC-003]
- [ ] CHK020 Is SC-006 ("branded preview on at least one major platform") specific about which platform validates success? [Clarity, Spec §SC-006]
- [ ] CHK021 Is spam-protection success (SC-007) measurable beyond "blocked in testing" (e.g., a defined bot scenario)? [Measurability, Spec §SC-007]

## Scenario & Edge Case Coverage

- [ ] CHK022 Are recovery requirements defined for a failed email send after the user has seen success? [Recovery, Gap, Spec §Edge Cases]
- [ ] CHK023 Is the JS-disabled fallback for the booking form captured as an actual requirement, not only an edge-case note? [Coverage, Spec §Edge Cases]
- [ ] CHK024 Are input-safety requirements defined so message/field content cannot inject into the outbound email? [Coverage, Spec §Edge Cases / FR-003]
- [ ] CHK025 Are alternate flows (edit-before-submit, resubmit after a validation error) specified? [Coverage, Gap, Spec §US1]

## Non-Functional Requirements

- [ ] CHK026 Are page load / performance targets quantified anywhere? [Gap, NFR]
- [ ] CHK027 Are accessibility requirements specified (contrast, keyboard focus, alt text) given motion is intentionally kept? [Gap, NFR, Spec §Assumptions]
- [ ] CHK028 Are data-handling/retention requirements for emailed PII (First/Last Name, Email, Phone) specified beyond "not persisted on the server"? [Gap, NFR/Privacy, Spec §FR-019]

## Dependencies & Assumptions

- [ ] CHK029 Is the Vercel + Deno feasibility treated as a validated dependency or an open risk with a fallback? [Assumption, plan.md Complexity Tracking]
- [ ] CHK030 Is each owner-provided input (booking email, YouTube URLs, socials, final copy, EPK bio/photos) tied to a needed-by point within the 3-day window? [Assumption, Spec §Assumptions]
- [ ] CHK031 Is the email provider chosen (e.g., Resend vs SMTP), since FR-002 depends on it? [Dependency, Ambiguity, Spec §FR-002]
- [ ] CHK032 Is the analytics tool decided (Umami vs Plausible), since FR-018 leaves it open? [Ambiguity, Spec §FR-018]

## Ambiguities & Open Clarifications

- [ ] CHK033 Are all `[NEEDS CLARIFICATION]` markers (FR-005, FR-008, FR-010, FR-013, FR-014, FR-015, FR-018) tracked with an owner and a resolution path? [Ambiguity, Spec §Requirements]

## Notes

- Check items off as the spec is tightened: `[x]`. Add findings inline.
- Most items here are resolved by the copy/decisions refinement session (D1-01) — feed answers back into `spec.md`.
