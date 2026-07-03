# Phase 0 Results — DiamondPrice IQ Model Spike

## Dataset

| Property | Value |
|---|---|
| Source | ggplot2 `diamonds` dataset (~54k rows, circa 2008–2010 listing prices) |
| After cleaning | 50,576 rows |
| Removed | 3,364 rows (zero-dimension entries, price outliers per carat bucket, invalid categorical values) |
| Kaggle supplement | Not yet available — see DATA_SOURCES.md |
| Split | 70% train / 15% val / 15% test, stratified on carat bucket |

## Model Architecture

- **Point estimate:** XGBoost regressor on `log(price)` target, 800 trees, early stopping on validation MAE (best iteration: ~420)
- **Prediction band:** Three independent LightGBM quantile regression models at the 5th, 50th, and 95th percentiles of `log(price)`. Post-hoc sort applied at inference time to prevent quantile crossing (inherent artifact of training independent models).
- **Features (28 total):** `carat`, `log(carat)`, ordinal-encoded cut/color/clarity, quality index (sum of ordinals), `carat × quality_index` interaction, magic-size binary indicators at 11 GIA carat thresholds (0.30–5.00ct), carat-bucket one-hot (8 bins), shape dummies, fluorescence dummies.
- **Training target:** `log(price)` → exponentiated at inference for original USD scale.

## Evaluation Results

| Metric | Target | Result | Status |
|---|---|---|---|
| MAPE overall (XGBoost) | ≤ 12% | **7.51%** | ✓ PASS |
| MAPE > 2.0ct stones (XGBoost) | ≤ 18% | **9.19%** | ✓ PASS |
| Band coverage [5th–95th pct] | ≥ 80% | **87.48%** | ✓ PASS |
| LightGBM mid MAPE overall | — | 7.28% | — |

All three Phase 0 targets from CLAUDE.md are met by the baseline model.

## Monotonicity Tests

All 6 CI sanity tests pass:
- Cut, color, and clarity monotonicity: predicted price strictly non-decreasing as grade improves (2% tolerance for near-tied predictions)
- Carat monotonicity: predicted price strictly increasing across [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0]ct
- Band ordering: low ≤ mid ≤ high guaranteed by post-hoc sort in `predict.py`
- MAPE targets: asserted programmatically from `artifacts/metrics.json`

## Listing-Price vs. Transaction-Price Caveat

**This is the most important interpretability constraint for the product.**

All data used in Phase 0 — the ggplot2 `diamonds` dataset and publicly available Kaggle mirrors — represents **asking/listing prices from online retailers, not closed-transaction prices.** Key implications:

1. **Systematic upward bias:** True transaction prices are typically **10–30% below listed prices** due to negotiation, promotions, and retailer margin. The model's "mid" price will be closer to a retailer's asking price than to what a buyer actually pays.
2. **Single-retailer period data:** The ggplot2 dataset appears to originate from a single US online retailer circa 2008–2010. Market conditions, retailer mix, and cut-grade definitions have shifted since then.
3. **Calibration decision for Phase 1:** Before shipping the API, apply a downward calibration shift of approximately –15% to mid/low predictions (TBD based on richer multi-retailer data) **or** explicitly label the output as "listing price estimate" in all user-facing copy. Per CLAUDE.md Section 12, do not soften or drop the "not an appraisal" framing.
4. **Copy requirement (non-negotiable):** Every price result and PDF must display: *"This is a fair-market estimate from public listing data, not a certified appraisal."*

## Confidence Band Design

The [5th–95th percentile] band is appropriate for Phase 0 calibration. However:

- **Sparse combinations** (e.g., >2ct, FL clarity, rare shapes) have fewer training examples and will naturally produce wider bands. The "limited data — wider range" flag (FR-5) should be triggered when the `high/low` ratio exceeds a threshold (suggested: 2.5×) or when the carat+clarity segment has fewer than ~50 training examples.
- Quantile crossing is resolved at inference via post-hoc sorting — this is a standard approach for independent quantile models. A future improvement (Phase 1) could use a single joint quantile model or monotone quantile regression to eliminate crossing at the model level.

## Feature Decisions

| Feature | Rationale |
|---|---|
| `log(carat)` | Compresses right tail; diamond price scales non-linearly with carat |
| Magic-size indicators | Price jumps at 0.5, 1.0, 1.5, 2.0ct are well-documented in diamond markets ("magic sizes") |
| `carat × quality_index` | Larger diamonds are more sensitive to grade — a 3ct I3 and a 0.3ct I3 are priced differently per unit quality |
| Ordinal encoding for cut/color/clarity | Respects the inherent GIA scale ordering; avoids dummy variable explosion |

## Open Questions for Phase 1

1. **Lab-grown diamonds:** The current data is natural-diamond only. If a lab-grown flag is added, it should be a separate model or a clearly marked prediction path — mixing natural and lab data would distort estimates significantly.
2. **Calibration shift:** Quantify the listing→transaction discount with multi-source data before going live. Even a simple –15% scalar adjustment improves user trust.
3. **Shape and fluorescence data:** These optional fields default to "Round" / "None" when omitted. With richer data sources (Blue Nile, James Allen scrapes), these features can carry real predictive signal.
4. **Conformal prediction:** Consider replacing the quantile-regression band with a conformal prediction interval in Phase 1 — it provides guaranteed coverage at finite-sample sizes without assuming the training distribution is representative of the serving distribution.

## Artifacts

| File | Description |
|---|---|
| `artifacts/xgb_point_model.joblib` | XGBoost point estimator (log-price) |
| `artifacts/lgb_q05_model.joblib` | LightGBM 5th-percentile model |
| `artifacts/lgb_q50_model.joblib` | LightGBM 50th-percentile model |
| `artifacts/lgb_q95_model.joblib` | LightGBM 95th-percentile model |
| `artifacts/feature_cols.joblib` | Ordered feature column list |
| `artifacts/metrics.json` | Numeric metrics for CI assertions |
| `data/processed/diamonds_clean.csv` | Cleaned dataset (50,576 rows) |
| `data/processed/diamonds_features.csv` | Engineered feature matrix |
