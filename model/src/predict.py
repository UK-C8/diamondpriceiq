"""
Inference helper for DiamondPrice IQ.
Loads artifacts and produces a price band, enforcing low <= mid <= high
via post-hoc sorting to avoid quantile crossing from independent LGB models.
"""

import numpy as np
import joblib
from pathlib import Path

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"

_cache = {}


def _load():
    if _cache:
        return _cache
    _cache["xgb"] = joblib.load(ARTIFACTS_DIR / "xgb_point_model.joblib")
    _cache["lgb_low"] = joblib.load(ARTIFACTS_DIR / "lgb_q05_model.joblib")
    _cache["lgb_mid"] = joblib.load(ARTIFACTS_DIR / "lgb_q50_model.joblib")
    _cache["lgb_high"] = joblib.load(ARTIFACTS_DIR / "lgb_q95_model.joblib")
    _cache["feature_cols"] = joblib.load(ARTIFACTS_DIR / "feature_cols.joblib")
    return _cache


def predict_band(df_features) -> dict:
    """
    Given an engineered feature DataFrame (one row), return a dict:
      { "low": float, "mid": float, "high": float }  (USD, original price scale)
    Band is guaranteed: low <= mid <= high.
    """
    m = _load()
    X = df_features[m["feature_cols"]].astype(float)

    raw_low = np.exp(m["lgb_low"].predict(X)[0])
    raw_mid = np.exp(m["lgb_mid"].predict(X)[0])
    raw_high = np.exp(m["lgb_high"].predict(X)[0])

    # Post-hoc sort to prevent quantile crossing
    low, mid, high = sorted([raw_low, raw_mid, raw_high])

    return {"low": round(low, 2), "mid": round(mid, 2), "high": round(high, 2)}
