"""
Model loading and inference service.
Wraps the Phase 0 artifacts (XGBoost point + LightGBM quantile models).
Thread-safe: models are loaded once at startup and shared across requests.
"""

from __future__ import annotations
import sys
import logging
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from functools import lru_cache

from app.config import settings
from app.models.schemas import StoneRequest, PriceBand, ConfidenceLevel

logger = logging.getLogger(__name__)

# Add model/src to path so we can reuse the feature engineering code
MODEL_SRC = Path(settings.model_dir).parent / "src"
if str(MODEL_SRC) not in sys.path:
    sys.path.insert(0, str(MODEL_SRC))

from data_pipeline import engineer_features, get_feature_cols  # noqa: E402

# Sparse-region thresholds
LOW_CONF_CARAT_MIN = 2.0          # >2ct is sparse in training data
LOW_CONF_BAND_RATIO = 2.5         # high/low > 2.5x → low confidence
LOW_CONF_RARE_CLARITY = {"FL", "IF"}


class ModelService:
    def __init__(self):
        self._xgb = None
        self._lgb_low = None
        self._lgb_mid = None
        self._lgb_high = None
        self._feature_cols = None

    def is_loaded(self) -> bool:
        return self._xgb is not None

    def load(self) -> None:
        """Load all model artifacts from disk. Called once at startup."""
        d = Path(settings.model_dir)
        missing = [
            name for name in [
                "xgb_point_model.joblib", "lgb_q05_model.joblib",
                "lgb_q50_model.joblib", "lgb_q95_model.joblib", "feature_cols.joblib",
            ]
            if not (d / name).exists()
        ]
        if missing:
            raise RuntimeError(
                f"Model artifacts missing from {d}: {missing}. "
                "Set MODEL_DIR to the correct path or restore the artifacts."
            )
        self._xgb = joblib.load(d / "xgb_point_model.joblib")
        self._lgb_low = joblib.load(d / "lgb_q05_model.joblib")
        self._lgb_mid = joblib.load(d / "lgb_q50_model.joblib")
        self._lgb_high = joblib.load(d / "lgb_q95_model.joblib")
        self._feature_cols = joblib.load(d / "feature_cols.joblib")
        logger.info("Model artifacts loaded from %s", d)

    def _stone_to_df(self, stone: StoneRequest) -> pd.DataFrame:
        """Convert a StoneRequest to a feature-engineered DataFrame row."""
        row = {
            "carat": stone.carat,
            "cut": stone.cut.value,
            "color": stone.color.value,
            "clarity": stone.clarity.value,
            "price": 0,  # placeholder — not used in prediction
            "shape": stone.shape.value if stone.shape else "Round",
            "fluorescence": stone.fluorescence.value if stone.fluorescence else "None",
        }
        df = pd.DataFrame([row])
        df = engineer_features(df)
        # Align to trained feature columns, filling any unseen dummies with 0
        for col in self._feature_cols:
            if col not in df.columns:
                df[col] = 0
        return df

    def _predict_raw(self, X: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Return (log_low, log_mid, log_high) arrays for a feature matrix."""
        Xf = X[self._feature_cols].astype(float)
        return (
            self._lgb_low.predict(Xf),
            self._lgb_mid.predict(Xf),
            self._lgb_high.predict(Xf),
        )

    def _low_confidence_check(self, stone: StoneRequest, band: PriceBand) -> tuple[bool, str | None]:
        """Detect sparse input regions that warrant a low-confidence flag."""
        reasons = []
        if stone.carat > LOW_CONF_CARAT_MIN:
            reasons.append(f"stones above {LOW_CONF_CARAT_MIN}ct are rare in our training data")
        if stone.clarity.value in LOW_CONF_RARE_CLARITY:
            reasons.append(f"{stone.clarity.value} clarity is rare — fewer comparable listings")
        if band.low > 0 and (band.high / band.low) > LOW_CONF_BAND_RATIO:
            reasons.append("high price variability for this combination")
        if reasons:
            return True, "Limited data: " + "; ".join(reasons) + ". Band is wider than usual."
        return False, None

    def _confidence_level(self, low_conf: bool, band: PriceBand) -> ConfidenceLevel:
        ratio = band.high / band.low if band.low > 0 else 99
        if low_conf or ratio > 3.0:
            return ConfidenceLevel.low
        if ratio > 1.8:
            return ConfidenceLevel.medium
        return ConfidenceLevel.high

    def estimate_one(self, stone: StoneRequest) -> tuple[PriceBand, ConfidenceLevel, bool, str | None]:
        """Predict price band for a single stone. Returns (band, confidence, low_conf, reason)."""
        df = self._stone_to_df(stone)
        log_low, log_mid, log_high = self._predict_raw(df)

        # Exponentiate and guarantee ordering (post-hoc sort prevents quantile crossing)
        low, mid, high = sorted([np.exp(log_low[0]), np.exp(log_mid[0]), np.exp(log_high[0])])

        band = PriceBand(
            low=round(low, 2),
            mid=round(mid, 2),
            high=round(high, 2),
            per_carat_low=round(low / stone.carat, 2),
            per_carat_mid=round(mid / stone.carat, 2),
            per_carat_high=round(high / stone.carat, 2),
        )
        low_conf, reason = self._low_confidence_check(stone, band)
        conf_level = self._confidence_level(low_conf, band)
        return band, conf_level, low_conf, reason

    def estimate_batch(self, stones: list[StoneRequest]) -> list[tuple[PriceBand, ConfidenceLevel, bool, str | None]]:
        """Vectorized batch prediction for efficiency."""
        dfs = [self._stone_to_df(s) for s in stones]
        X = pd.concat(dfs, ignore_index=True)
        for col in self._feature_cols:
            if col not in X.columns:
                X[col] = 0
        log_lows, log_mids, log_highs = self._predict_raw(X)

        results = []
        for i, stone in enumerate(stones):
            low, mid, high = sorted([np.exp(log_lows[i]), np.exp(log_mids[i]), np.exp(log_highs[i])])
            band = PriceBand(
                low=round(low, 2), mid=round(mid, 2), high=round(high, 2),
                per_carat_low=round(low / stone.carat, 2),
                per_carat_mid=round(mid / stone.carat, 2),
                per_carat_high=round(high / stone.carat, 2),
            )
            low_conf, reason = self._low_confidence_check(stone, band)
            conf_level = self._confidence_level(low_conf, band)
            results.append((band, conf_level, low_conf, reason))
        return results


# Module-level singleton — loaded once at startup via lifespan
model_service = ModelService()
