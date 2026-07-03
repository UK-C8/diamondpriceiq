# CLAUDE.md — DiamondPrice IQ

This file anchors context for Claude Code sessions building DiamondPrice IQ. Read this first in every session before writing code.

---

## 1. Project Summary

**DiamondPrice IQ** is a free, mobile-first web tool built by **Centr8 LLP** that turns a diamond's 4Cs (carat, cut, color, clarity) into an instant, model-backed fair price range.

Tagline: *"A diamond's fair price in 10 seconds, from the diamond capital."*

**Business purpose:** This is a Phase-1 showcase/lead-gen tool for Centr8, not a standalone product. It proves three Centr8 service lines in one live artifact — AI/ML, Web & Mobile Development, and Data & Analytics — while capturing high-intent leads via email-gated PDF reports. It is also architected from day one to become a white-label B2B diamond-pricing API for jewelers, lenders, and insurers (not built in this phase, just designed for it).

**Owner:** Centr8 LLP, Surat, Gujarat. Admin contact: urvilk1542@gmail.com

---

## 2. Core User Flow

1. User lands on the page, sees a one-line promise + 4Cs input form above the fold.
2. User enters **carat** (numeric) and selects **cut, color, clarity** (required, GIA scales) via guided dropdowns/sliders with inline explainers.
3. User optionally expands "Refine" to add **shape, fluorescence, certificate/lab**.
4. User taps "Get price" → request hits `/estimate` API → skeleton loading state (<~1s).
5. Result renders: per-carat and total price band (low–mid–high) on a Recharts visualization, with confidence band. If data is sparse for that combination, show a "limited data — wider range" flag.
6. User optionally enters a jeweler's quoted price → instant "fair deal?" verdict (below / fair / above market) with % delta and one-line explanation.
7. User can (a) generate a shareable branded card/link, or (b) enter email (with consent) to receive a branded PDF report → lead pushed to CRM.
8. A persistent disclaimer is always visible: *"This is a fair-market estimate from public listing data, not a certified appraisal."* Links to the methodology page.
9. **Parcel mode** (trade buyers): toggle to add multiple stones via rows or CSV upload → batch estimate → per-stone values + aggregate parcel total.
10. Footer CTA invites jewelers/lenders/insurers to register interest in the future API/embeddable widget.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS | Deployed on Vercel; SSR/edge rendering for SEO |
| Data visualization | Recharts | Price band + confidence interval, mobile-friendly |
| ML / inference API | Python + FastAPI serving XGBoost/LightGBM regression | Gradient-boosted trees for tabular 4Cs data |
| Modeling approach | Log-price target; carat-threshold features; categorical encoding for cut/color/clarity/shape/fluorescence; calibrated prediction intervals (quantile regression or conformal prediction) | Captures carat non-linearity ("magic sizes"); produces honest bands, not point estimates |
| Datastore | Postgres | Anonymized query logs, lead records, aggregates |
| Documents & sharing | Server-side PDF generation + OG-image card renderer | Branded PDF for lead capture; branded share cards |
| Analytics | GA4 / product analytics + server APM | North-star + supporting metrics, latency/error monitoring |
| Email / CRM | Transactional email provider + Centr8 CRM | Deliver PDF, route leads to nurture/sales |
| Currency | USD at launch | INR/others as fast-follow; configurable FX rate |

Do not introduce authentication, user accounts, billing, or API key management in this phase — explicitly out of scope (see Section 8).

---

## 4. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Single-stone input form: carat (numeric), cut, color, clarity as required fields, GIA scales (cut Excellent–Poor; color D–Z; clarity FL–I3), with validation and tooltips | Must |
| FR-2 | Optional inputs: shape, fluorescence (None–Strong), certificate/lab (GIA, IGI, HRD, none). When omitted, model uses marginal/typical values and widens the band | Should |
| FR-3 | Return low/mid/high price (total + per-carat) with confidence band; render via Recharts | Must |
| FR-4 | "Fair deal?" verdict: user enters quoted price → classify below/fair/above market with % delta and one-line explanation. Thresholds tied to band percentiles, not arbitrary | Must |
| FR-5 | Low-confidence handling: sparse input combos show "limited data — wider range" flag and expanded band | Must |
| FR-6 | Bulk parcel mode: editable rows or CSV upload → per-stone estimates + aggregate parcel value + summary stats. CSV template provided; cap rows (e.g. 500) | Should |
| FR-7 | Shareable result card: branded image + short link, OG tags for rich previews (WhatsApp/social) | Should |
| FR-8 | Email-gated PDF report: consent checkbox → branded PDF + lead pushed to CRM. Estimate itself remains viewable without email | Must |
| FR-9 | Methodology / "How it works" page: data sources, model summary, accuracy figures, listing-vs-transaction caveat, "not an appraisal" disclaimer | Must |
| FR-10 | Public REST `/estimate` endpoint (FastAPI), versioned JSON schema, rate-limited, CORS-aware, documented — architected to become the future B2B API | Should |
| FR-11 | Anonymized query logging to Postgres (inputs, outputs, timing, session id) for analytics/retraining. No PII unless email consented | Could |
| FR-12 | Currency display: USD at launch, formatted; structure to add INR/others later | Could |

---

## 5. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Estimate API p95 < 400ms; landing-to-first-band ≤ 10s on mid-tier mobile; Lighthouse ≥ 90; LCP < 2.5s |
| Scalability | Handle ~50 req/s burst via stateless inference + CDN/edge caching; parcel jobs batched server-side |
| Security | HTTPS only; input validation + rate limiting on `/estimate`; no client-side secrets; sanitized logged data; CSV upload size/row caps and content checks |
| Privacy & compliance | India DPDP, GDPR, CCPA compliant: consent-based email capture, clear privacy notice, purpose limitation, deletion-on-request; minimize PII |
| Accessibility | WCAG 2.1 AA: keyboard navigation, labeled inputs, sufficient contrast, screen-reader-friendly chart summaries (text fallback for the band) |
| Availability | ≥ 99.5% uptime; graceful degradation — if inference is down, show a clear retry message, never a broken page |
| Compatibility | Responsive, last 2 versions of Chrome/Safari/Firefox/Edge; mobile-first; no login required |
| Maintainability | Reproducible training pipeline, versioned model artifacts; CI sanity/monotonicity tests gate deploys; basic APM + error tracking |

---

## 6. Data & Modeling Notes

- **Data sources:** the classic ~54k-row ggplot2 `diamonds` dataset, plus larger Kaggle scrapes of GIA/IGI-certified listings (Blue Nile, James Allen, etc.) with shape, fluorescence, and cert fields. Requires cleaning, de-duplication, and feature engineering.
- **Critical caveat to bake into copy and calibration:** public data is mostly *listing/asking* prices, not closed-transaction prices. The confidence band and all user-facing copy must account for this honestly (risk R-1 in BRD). Consider a downward/uncertainty calibration adjustment.
- **Target accuracy:** MAPE ≤ 12% overall, ≤ 18% for stones > 2.0ct; ≥ 80% of held-out test stones fall inside the displayed band.
- **Sanity/monotonicity tests required in CI before deploy:** e.g. better clarity/color/cut must not lower predicted price, all else equal.
- **Scope of stones:** natural white diamonds first. Lab-grown only as a best-effort flag if data supports it (open question — confirm with product owner before building). Fancy-colored diamonds and non-diamond gemstones are out of scope.

---

## 7. Analytics Events

Instrument all of the following:

| Event | Payload | Purpose |
|---|---|---|
| `page_view` | landing / methodology / parcel | Traffic & SEO |
| `estimate_started` | `{has_optional_inputs}` | Funnel entry |
| `estimate_returned` | `{carat_bucket, color, clarity, cut, shape, confidence_level, latency_ms}` | North-star count, accuracy/latency tracking |
| `fair_deal_checked` | `{verdict, pct_delta}` | Verdict usage |
| `low_confidence_flag_shown` | `{segment}` | Data-gap monitoring |
| `share_card_generated` | `{channel}` | Share-rate metric |
| `lead_captured` | `{source: single\|parcel}` | Lead-conversion metric |
| `pdf_downloaded` | — | Lead value |
| `parcel_run` | `{stone_count, source: rows\|csv}` | Trade-utility metric |
| `api_interest_clicked` | — | B2B productization intent |
| `currency_changed` | `{currency}` | Localization signal |
| `estimate_error` | `{type}` | Reliability monitoring |

North-star metric: **completed estimates per month (single + parcel), target ≥ 12,000/month by day 90.**

---

## 8. Explicitly Out of Scope (this phase)

Do not build any of the following unless separately requested:

- Computer-vision 4Cs grading from photos/360 video (belongs to a separate future project, LucidCarat)
- Authenticated user accounts, login, saved history, or a user-facing dashboard beyond the email-capture PDF flow
- Live marketplace, inventory, or actual buy/sell transaction execution
- Lab-grown vs. natural full modeling (natural-first; lab-grown flag only best-effort)
- Provenance/certificate verification or blockchain passport
- Paid B2B API billing, API-key management, tiered plans, contractual SLAs (validate demand here, build later)
- Colored/fancy diamonds and non-diamond gemstones
- Official Rapaport list integration (licensed data)
- Native mobile apps (responsive web only)

An **internal Centr8 admin/analytics dashboard** (leads, KPIs, model health) is a reasonable post-launch addition (v1.1, day 90–120) but is not part of this build.

---

## 9. Acceptance Criteria

- Valid carat/cut/color/clarity input returns a price band + confidence interval in ≤ 10s; `/estimate` API p95 < 400ms.
- Offline eval on held-out public data: MAPE ≤ 12% overall; ≥ 80% of test stones inside the displayed band; monotonicity tests pass.
- Entering a quoted price produces a deterministic verdict with % delta consistent with band percentiles.
- Sparse combos (e.g. >2ct, FL, rare shape) show "limited data — wider range" with a visibly wider band.
- Submitting email with consent delivers a branded PDF and creates a CRM lead record; estimate remains viewable without email.
- Parcel mode accepts CSV template and manual rows (up to cap), returns per-stone values + correct aggregate total.
- Shareable card/link generates with correct OG preview and Centr8 branding.
- Every result and PDF displays the "fair-market estimate, not an appraisal" disclaimer with a link to methodology.
- Lighthouse performance ≥ 90, LCP < 2.5s, WCAG 2.1 AA checks pass on core flow.
- Public `/estimate` endpoint returns documented versioned JSON schema and enforces rate limiting.

---

## 10. Build Phases (reference — see PHASE_PROMPTS.md for detailed prompts)

| Phase | Outcome | Target |
|---|---|---|
| Phase 0 — Data & model spike | Cleaned/de-duplicated dataset; baseline XGBoost/LightGBM with documented MAPE; decision on feature set, log-price target, confidence-band method | Week 1 |
| Phase 1 — Pricing API & calibration | FastAPI `/estimate` endpoint, calibrated prediction intervals, sanity/monotonicity tests, Postgres query logging, p95 < 400ms | Weeks 2–3 |
| Phase 2 — Web app & core UX | Next.js/Tailwind single-stone flow, Recharts price band, "fair deal?" verdict, mobile-first, sub-10s; methodology page | Weeks 3–4 |
| Phase 3 — Lead capture, parcel mode, share card | Email-gated PDF + CRM wiring, bulk/CSV parcel mode, shareable card, analytics events, SEO landing pages | Weeks 4–5 |
| Phase 4 — Hardening & launch | Accessibility, performance, privacy/disclaimers, QA, public launch | Week 6 |

MVP (internal, end of week 4): single-stone required-Cs estimate, price band + Recharts, FastAPI endpoint, methodology stub, sub-10s, basic disclaimers.

Beta (private link, end of week 5): + optional inputs, fair-deal verdict, low-confidence flag, email-PDF capture, analytics, accessibility pass.

v1 (public launch, week 6): + parcel mode/CSV, shareable card, SEO pages, performance/privacy hardening, public `/estimate`, distribution push.

---

## 11. Open Questions to Resolve Before/During Build

- Include lab-grown diamonds at launch (separate flag/model) or restrict v1 to natural white diamonds only?
- What CSV row cap and rate limits balance trade utility against free-tier cost and abuse?
- Which retrain cadence and data-refresh source keep accuracy current without scraping/licensing risk?

---

## 12. Development Conventions

- Follow the same numbered FR-based approach used for ExportInvoice Pro and SiteScore: build phase-by-phase against this spec, do not skip ahead.
- Keep the estimate API and the frontend as separate concerns (FastAPI service + Next.js app) so the API can be productized independently later.
- Every model change must pass the CI monotonicity/sanity tests before merge.
- All user-facing copy involving price must carry the "not an appraisal" framing — do not soften or drop this language for UX reasons.
- No PII is stored beyond consented email; log anonymized session data only.
