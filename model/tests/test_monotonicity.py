"""
Monotonicity sanity checks for the DiamondPrice IQ model.

Rules (all else equal):
  - Higher cut grade  → higher or equal predicted price
  - Better color grade → higher or equal predicted price
  - Better clarity grade → higher or equal predicted price
  - Larger carat weight → higher predicted price

These tests gate every model deploy (CI requirement per CLAUDE.md Section 6).
"""

import sys
import json
import numpy as np
import pandas as pd
import joblib
import pytest
from pathlib import Path

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "xgb_point_model.joblib"
FEATURE_COLS_PATH = ARTIFACTS_DIR / "feature_cols.joblib"

# Import pipeline from src
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
from data_pipeline import (
    CUT_ORDER, COLOR_ORDER, CLARITY_ORDER, engineer_features, get_feature_cols
)


def load_model_and_features():
    if not MODEL_PATH.exists():
        pytest.skip("Model artifacts not found — run train.py first")
    model = joblib.load(MODEL_PATH)
    feature_cols = joblib.load(FEATURE_COLS_PATH)
    return model, feature_cols


def make_base_stone(**overrides) -> pd.DataFrame:
    """Create a single reference stone as a DataFrame, applying any overrides."""
    base = {
        "carat": 1.0,
        "cut": "Ideal",
        "color": "G",
        "clarity": "VS1",
        "price": 5000,  # placeholder, not used in prediction
    }
    base.update(overrides)
    df = pd.DataFrame([base])
    return engineer_features(df)


def predict_price(df: pd.DataFrame, model, feature_cols: list[str]) -> float:
    X = df[feature_cols].astype(float)
    log_pred = model.predict(X)[0]
    return float(np.exp(log_pred))


class TestCutMonotonicity:
    """Predicted price must not decrease as cut quality improves (all else equal)."""

    def test_cut_monotonic(self):
        model, feature_cols = load_model_and_features()
        prices = []
        for cut in CUT_ORDER:
            df = make_base_stone(cut=cut)
            prices.append(predict_price(df, model, feature_cols))

        for i in range(len(prices) - 1):
            assert prices[i] <= prices[i + 1] * 1.02, (
                f"Cut monotonicity violated: {CUT_ORDER[i]} (${prices[i]:.0f}) > "
                f"{CUT_ORDER[i+1]} (${prices[i+1]:.0f}) — 2% tolerance exceeded"
            )


class TestColorMonotonicity:
    """Predicted price must not decrease as color grade improves (D > J)."""

    def test_color_monotonic(self):
        model, feature_cols = load_model_and_features()
        prices = []
        for color in COLOR_ORDER:  # J (worst) → D (best)
            df = make_base_stone(color=color)
            prices.append(predict_price(df, model, feature_cols))

        for i in range(len(prices) - 1):
            assert prices[i] <= prices[i + 1] * 1.02, (
                f"Color monotonicity violated: {COLOR_ORDER[i]} (${prices[i]:.0f}) > "
                f"{COLOR_ORDER[i+1]} (${prices[i+1]:.0f}) — 2% tolerance exceeded"
            )


class TestClarityMonotonicity:
    """Predicted price must not decrease as clarity grade improves (FL > I3)."""

    def test_clarity_monotonic(self):
        model, feature_cols = load_model_and_features()
        prices = []
        for clarity in CLARITY_ORDER:  # I3 (worst) → FL (best)
            df = make_base_stone(clarity=clarity)
            prices.append(predict_price(df, model, feature_cols))

        for i in range(len(prices) - 1):
            assert prices[i] <= prices[i + 1] * 1.02, (
                f"Clarity monotonicity violated: {CLARITY_ORDER[i]} (${prices[i]:.0f}) > "
                f"{CLARITY_ORDER[i+1]} (${prices[i+1]:.0f}) — 2% tolerance exceeded"
            )


class TestCaratMonotonicity:
    """Predicted price must strictly increase with carat weight (all else equal)."""

    def test_carat_monotonic(self):
        model, feature_cols = load_model_and_features()
        carat_values = [0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0]
        prices = []
        for carat in carat_values:
            df = make_base_stone(carat=carat)
            prices.append(predict_price(df, model, feature_cols))

        for i in range(len(prices) - 1):
            assert prices[i] < prices[i + 1], (
                f"Carat monotonicity violated: {carat_values[i]}ct (${prices[i]:.0f}) >= "
                f"{carat_values[i+1]}ct (${prices[i+1]:.0f})"
            )


class TestBandOrdering:
    """Low quantile prediction must always be ≤ mid ≤ high for any input."""

    def test_band_ordering(self):
        if not (ARTIFACTS_DIR / "lgb_q05_model.joblib").exists():
            pytest.skip("Quantile model artifacts not found — run train.py first")

        from predict import predict_band  # uses post-hoc sort to prevent crossing

        test_cases = [
            {"carat": 0.5, "cut": "Good", "color": "J", "clarity": "I1"},
            {"carat": 1.0, "cut": "Ideal", "color": "D", "clarity": "FL"},
            {"carat": 2.5, "cut": "Very Good", "color": "G", "clarity": "VS2"},
        ]

        for case in test_cases:
            df = make_base_stone(**case)
            band = predict_band(df)
            assert band["low"] <= band["mid"] <= band["high"], (
                f"Band ordering violated for {case}: "
                f"low=${band['low']:.0f} mid=${band['mid']:.0f} high=${band['high']:.0f}"
            )


class TestMapeTargets:
    """Verify that saved metrics meet the project targets from CLAUDE.md."""

    def test_mape_targets_met(self):
        metrics_path = ARTIFACTS_DIR / "metrics.json"
        if not metrics_path.exists():
            pytest.skip("metrics.json not found — run train.py first")

        with open(metrics_path) as f:
            metrics = json.load(f)

        mape = metrics.get("xgb_mape_overall", 1.0)
        assert mape <= 0.12, (
            f"MAPE overall {mape:.2%} exceeds target of 12%. "
            "See RESULTS.md for proposed next steps."
        )

        coverage = metrics.get("band_coverage_q05_q95", 0.0)
        assert coverage >= 0.80, (
            f"Band coverage {coverage:.2%} is below target of 80%. "
            "See RESULTS.md for proposed next steps."
        )
