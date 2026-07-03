# Data Sources

## 1. ggplot2 `diamonds` Dataset

- **Source:** R `ggplot2` package, bundled dataset
- **Provider:** Hadley Wickham / tidyverse team
- **URL:** https://ggplot2.tidyverse.org/reference/diamonds.html
- **Access method:** Downloaded via the `pydataset` Python package (MIT license) which mirrors this dataset, or loaded directly from CSV via `ggplot2`-exported file.
- **License:** GPL-2 (ggplot2 package license); the dataset itself is derived from the AwesomeGems.com dataset (~2008) and is widely treated as public-domain for research/non-commercial use.
- **Rows:** ~53,940
- **Columns:** carat, cut, color, clarity, depth, table, price, x, y, z
- **Caveats:**
  - Prices are in USD, circa 2008–2010 listing data from a single retailer — not current market prices and not closed-transaction prices.
  - Lacks shape (all round/brilliant implied), fluorescence, and cert/lab fields.
  - Contains some zero-dimension outliers (x=0, y=0, z=0) that must be removed.

## 2. Kaggle Diamond Listings Dataset (if available)

- **Source:** Kaggle — "Diamond Dataset" by Shivam Agrawal (and similar community scrapes)
- **URL:** https://www.kaggle.com/datasets/shivam2503/diamonds
- **License:** CC0 (Public Domain) — no restrictions on use.
- **Access method:** Manual download from Kaggle; place raw CSV at `data/raw/kaggle_diamonds.csv`.
- **Rows:** ~53,940 (this particular dataset is the same ggplot2 dataset re-hosted; larger scrapes from Blue Nile / James Allen are not yet sourced)
- **Caveats:**
  - Like the ggplot2 source, this is listing/asking prices, not transaction prices.
  - Shape, fluorescence, and cert fields are absent in the base Kaggle version.
  - Larger certified-listing scrapes (GIA/IGI, multi-retailer) are the target for Phase 1 data enrichment.

## Listing-Price Caveat

**All data used in Phase 0 represents asking/listing prices from online retailers, not closed-transaction prices.** True transaction prices are typically 10–30% lower than listed prices due to negotiation. The model's confidence bands and all user-facing copy must be labeled as "fair-market estimate from public listing data, not a certified appraisal." A downward/uncertainty calibration adjustment should be applied in Phase 1 when richer data is available.

## Future Data Sources (Phase 1+)

- Blue Nile, James Allen, and Brilliant Earth scraped certified-listing data with shape, fluorescence, lab, and dimensions (requires scraping or licensed feeds — confirm legality before use).
- Rapaport price list — licensed data, out of scope for this phase (see CLAUDE.md Section 8).
- GIA grading report public data — limited subset available via GIA's public report check tool.
