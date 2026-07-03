# PHASE_PROMPTS.md — DiamondPrice IQ

Detailed, phase-by-phase prompts to run in Claude Code. Paste one phase at a time into a Claude Code session that has CLAUDE.md in its project root. Do not skip ahead to a later phase until the current phase's acceptance criteria pass.

Each prompt assumes Claude Code has read CLAUDE.md first.

---

## Phase 0 — Data & Model Spike

```
Read CLAUDE.md in full before starting.

Goal: produce a cleaned, de-duplicated public diamond dataset and a baseline
XGBoost/LightGBM regression model with documented MAPE, so we can decide on
feature set, log-price target, and confidence-band method before building
the API.

Set up a Python project under /model with:
1. A data pipeline that ingests the ggplot2 "diamonds" dataset (~54k rows)
   and, if available, a Kaggle GIA/IGI-certified listings dataset with
   shape, fluorescence, and cert fields. Document exact source and license
   for each dataset in /model/DATA_SOURCES.md.
2. Cleaning steps: de-duplication, outlier handling, missing-value strategy,
   and feature engineering — carat-threshold/bucket features to capture
   "magic size" price jumps, categorical encoding for cut/color/clarity/
   shape/fluorescence.
3. A train/validation/held-out test split with no leakage across splits.
4. A baseline XGBoost (or LightGBM) regression trained on log(price) as the
   target. Report MAPE overall and for the >2.0ct segment separately.
5. A first pass at calibrated prediction intervals (quantile regression or
   conformal prediction) producing low/mid/high bands, not just a point
   estimate.
6. Monotonicity sanity checks: verify that, holding other features fixed,
   improving clarity, color, or cut does not decrease predicted price.
   Write these as automated tests in /model/tests/.
7. A short RESULTS.md summarizing MAPE overall, MAPE for >2.0ct stones,
   band coverage (% of held-out stones falling inside the predicted band),
   and an honest note on the listing-price-vs-transaction-price caveat
   (per CLAUDE.md Section 6) and how it affects interpretation.

Target from CLAUDE.md: MAPE <= 12% overall, <= 18% for stones >2.0ct,
>= 80% band coverage. If the baseline misses these targets, note the gap
in RESULTS.md and propose next steps rather than silently lowering scope.

Do not build the API or frontend yet. This phase is data/model only.
```

---

## Phase 1 — Pricing API & Calibration

```
Read CLAUDE.md in full before starting. Assume Phase 0's model and
calibration approach are complete and validated (see /model/RESULTS.md).

Goal: a FastAPI service exposing a documented, versioned /estimate endpoint
that serves calibrated price predictions with p95 latency < 400ms, plus
Postgres query logging.

Build under /api:
1. FastAPI app serving POST /estimate. Request schema: carat (required,
   numeric), cut/color/clarity (required, GIA scale enums), shape/
   fluorescence/certificate (optional). Response schema: low/mid/high price
   (total and per-carat), confidence level, low-confidence flag boolean,
   model version, and a request id. Version the schema explicitly
   (e.g. /v1/estimate) per FR-10.
2. Load the trained model artifact from Phase 0 and serve predictions using
   the calibrated interval method already validated.
3. Low-confidence handling (FR-5): when the input falls in a sparse region
   of the training distribution, return a widened band and
   low_confidence: true rather than a falsely tight estimate.
4. Input validation and rate limiting on the endpoint (NFR: Security).
   Return clear 4xx errors for invalid input, not 500s.
5. CORS configuration that allows the Next.js frontend origin, structured
   so a future external widget/API consumer can be added without rework.
6. Anonymized query logging to Postgres per FR-11: inputs, outputs, latency,
   session id, timestamp. No PII. Use a migration tool (e.g. Alembic) for
   schema management.
7. A parcel/batch endpoint or batch mode on the same endpoint to support
   Phase 3's parcel feature later — at minimum, confirm the schema can
   accept an array of stones without a breaking change.
8. Load-test or benchmark the endpoint locally and report p95 latency.
   Target: p95 < 400ms.
9. Re-run the monotonicity/sanity tests from Phase 0 against the live API
   responses (not just the raw model) and wire them into a CI-runnable
   test suite under /api/tests/.
10. Basic API documentation (FastAPI's auto-generated OpenAPI docs are
    sufficient) reachable at /docs.

Do not build the frontend yet. This phase is API only, but the API must be
fully callable and testable via curl or the /docs UI by the end of it.
```

---

## Phase 2 — Web App & Core UX

```
Read CLAUDE.md in full before starting. Assume the /estimate API from
Phase 1 is running and callable.

Goal: a Next.js (App Router) + TypeScript + Tailwind CSS mobile-first web
app delivering the single-stone estimate flow end to end, deployed to
Vercel.

Build under /web:
1. Landing page with the one-line promise and the 4Cs input form above the
   fold (FR-1). Required fields: carat (numeric input), cut, color,
   clarity — use GIA scale dropdowns/sliders (cut Excellent-Poor, color
   D-Z, clarity FL-I3) with inline tooltips explaining each term. Validate
   input client-side before submit.
2. An expandable "Refine" section for optional inputs: shape, fluorescence,
   certificate/lab (FR-2).
3. On submit, call the /estimate API. Show a skeleton/loading state for
   under ~1s while waiting (per the UX flow in CLAUDE.md Section 2).
4. Result view: render the low/mid/high price band (total and per-carat)
   using Recharts (FR-3). If low_confidence is true in the API response,
   visibly show the "limited data - wider range" flag with a wider band
   (FR-5).
5. "Fair deal?" input: let the user enter a quoted price and show a
   deterministic verdict (below/fair/above market) with a % delta and
   one-line plain-English explanation, computed from the band percentiles
   already returned by the API (FR-4).
6. A persistent, always-visible disclaimer: "This is a fair-market estimate
   from public listing data, not a certified appraisal." Link it to a
   /methodology page.
7. Build the /methodology page (FR-9): data sources, model summary,
   accuracy figures pulled from /model/RESULTS.md, the listing-vs-
   transaction caveat, and the disclaimer, written for a general audience.
8. Mobile-first responsive layout; verify on narrow viewports first, then
   widen. No login or account creation anywhere in this flow.
9. Meet performance targets: Lighthouse performance >= 90, LCP < 2.5s.
   Optimize images, fonts, and bundle size accordingly.
10. Accessibility pass: keyboard-navigable form, labeled inputs, sufficient
    color contrast, and a text-based fallback summary of the chart for
    screen readers (WCAG 2.1 AA per NFR table).
11. Deploy to Vercel and confirm the live URL serves the full single-stone
    flow against the Phase 1 API.

Do not build parcel mode, email/PDF capture, or the share card yet — those
are Phase 3. This phase delivers the internal MVP milestone from
CLAUDE.md Section 10: single-stone estimate, price band + Recharts,
methodology page, sub-10s, basic disclaimers.
```

---

## Phase 3 — Lead Capture, Parcel Mode, Share Card

```
Read CLAUDE.md in full before starting. Assume Phase 2's single-stone flow
is live and working.

Goal: add email-gated PDF lead capture, bulk parcel mode, shareable result
cards, full analytics instrumentation, and SEO landing pages — reaching the
Beta and then v1 milestones from CLAUDE.md Section 10.

1. Email-gated PDF report (FR-8): add an email input with an explicit
   consent checkbox. On submit, generate a branded PDF report of the
   estimate server-side and either trigger a download or email it. Push
   the lead (email + estimate context) to Centr8's CRM/email tool via
   whatever integration is configured — stub this with a clearly marked
   TODO and a working webhook/API call shape if no live CRM credentials
   are available yet. The estimate itself must remain fully viewable
   without submitting an email — the PDF/extra detail is the only gate.
2. Shareable result card (FR-7): server-side generate a branded OG image
   summarizing the stone and its price band, plus a short shareable link.
   Set correct OG meta tags so the link unfurls with a rich preview on
   WhatsApp/social platforms.
3. Parcel mode (FR-6): add a toggle for trade/bulk mode. Support both
   manually added editable rows and CSV upload, using the batch capability
   built into the API in Phase 1. Provide a downloadable CSV template.
   Cap the number of rows accepted per submission (default 500, confirm
   this against CLAUDE.md Section 11's open question on rate limits) and
   validate/sanitize CSV content before processing to prevent abuse.
   Return per-stone values plus an aggregate parcel total and summary
   stats (min/max/mean, count by confidence level).
4. Wire parcel mode into the same PDF and share-card flows as single-stone
   mode where applicable.
5. Analytics instrumentation: implement every event listed in CLAUDE.md
   Section 7 (page_view, estimate_started, estimate_returned,
   fair_deal_checked, low_confidence_flag_shown, share_card_generated,
   lead_captured, pdf_downloaded, parcel_run, api_interest_clicked,
   currency_changed, estimate_error) with the exact payload fields
   specified. Wire into GA4 or the configured product analytics tool.
6. SEO landing pages: build at least one or two additional landing pages
   targeting the keywords mentioned in CLAUDE.md (e.g. "diamond price
   calculator", "1 carat diamond price"), each linking into the core
   estimate flow, with proper meta tags and schema markup.
7. Footer CTA (per the UX flow, step 10): a clear call-to-action inviting
   jewelers, lenders, and insurers to register interest in the future
   API/embeddable widget. Wire the api_interest_clicked event to this.

By the end of this phase, verify against CLAUDE.md Section 9's acceptance
criteria for lead capture, parcel mode, and share cards specifically.
```

---

## Phase 4 — Hardening & Launch

```
Read CLAUDE.md in full before starting. Assume Phases 0-3 are complete and
the app is feature-complete per CLAUDE.md.

Goal: harden the app for public launch and verify every acceptance
criterion in CLAUDE.md Section 9 passes.

1. Run a full accessibility audit (WCAG 2.1 AA) across every page: landing,
   result view, parcel mode, methodology, and any SEO landing pages. Fix
   all failures.
2. Run a full performance audit: confirm Lighthouse performance >= 90,
   LCP < 2.5s on the core flow, and /estimate API p95 < 400ms under
   realistic load (target ~50 req/s burst per NFR table). Add CDN/edge
   caching for static assets if not already in place.
3. Privacy and compliance pass: verify consent-based email capture, a
   clear privacy notice, purpose limitation, and a working
   deletion-on-request path for DPDP/GDPR/CCPA compliance. Confirm no PII
   is logged beyond consented email.
4. Confirm the "not an appraisal" disclaimer appears on every result view
   and on the PDF, exactly as specified in CLAUDE.md — do not let this be
   dropped or softened anywhere in the UI.
5. Verify graceful degradation: if the inference API is down or slow, the
   frontend must show a clear retry message rather than a broken page or
   an infinite loading state.
6. Confirm rate limiting is active and tested on /estimate and the CSV
   parcel upload path.
7. Run the full acceptance criteria checklist from CLAUDE.md Section 9
   end to end and report pass/fail on each item explicitly.
8. Set up basic APM/error tracking on the API and frontend if not already
   in place, per the Maintainability/observability NFR.
9. Final QA pass across the last 2 versions of Chrome, Safari, Firefox,
   and Edge, on both mobile and desktop viewports.
10. Prepare a short launch checklist summarizing what is live, what
    remains an open question from CLAUDE.md Section 11, and what is
    explicitly deferred to v1.1 (INR/multi-currency, monthly retrain and
    monitoring dashboard, B2B API/widget interest funnel) so nothing gets
    silently built out of scope.

Do not add any user accounts, dashboards, billing, or B2B API
productization work in this phase — those remain out of scope per
CLAUDE.md Section 8 until explicitly requested in a future phase.
```

---

## Notes for running these phases

- Keep /model, /api, and /web as separate concerns within the repo (or separate repos, following the pattern used for ExportInvoice Pro's admin/main split, if preferred).
- Re-read CLAUDE.md at the start of each phase — do not rely on memory of earlier phases within a long session.
- If a phase's acceptance criteria do not pass, stay in that phase and fix it before moving on. Do not silently defer failing criteria to a later phase without flagging it explicitly.
- Any scope change (e.g. deciding to include lab-grown diamonds, changing the CSV row cap) should be reflected back into CLAUDE.md, not just implemented ad hoc.
