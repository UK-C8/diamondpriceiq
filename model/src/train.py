"""
Train XGBoost/LightGBM baseline models with calibrated prediction intervals.
Outputs model artifacts and evaluation metrics to /artifacts.
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_percentage_error
import xgboost as xgb
import lightgbm as lgb

from data_pipeline import build_dataset, get_feature_cols

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42
# Quantile levels for low/mid/high prediction band
Q_LOW = 0.05
Q_MID = 0.50
Q_HIGH = 0.95


# ---------------------------------------------------------------------------
# Split
# ---------------------------------------------------------------------------

def make_splits(df: pd.DataFrame, feature_cols: list[str]):
    """Stratified split: 70% train / 15% val / 15% test with no leakage."""
    # Stratify on carat bucket to ensure large stones are in all splits
    df = df.copy()
    bins = [0, 0.5, 1.0, 1.5, 2.0, 3.0, 100]
    df["_strat"] = pd.cut(df["carat"], bins=bins, labels=False)

    X = df[feature_cols].astype(float)
    y = df["log_price"]
    strat = df["_strat"]

    X_trainval, X_test, y_trainval, y_test, strat_tv, _ = train_test_split(
        X, y, strat, test_size=0.15, random_state=RANDOM_STATE, stratify=strat
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval, test_size=0.15 / 0.85, random_state=RANDOM_STATE,
        stratify=strat_tv
    )
    print(f"Split sizes — train: {len(X_train):,}  val: {len(X_val):,}  test: {len(X_test):,}")
    return X_train, X_val, X_test, y_train, y_val, y_test


# ---------------------------------------------------------------------------
# XGBoost mid-point model
# ---------------------------------------------------------------------------

def train_xgb_point(X_train, y_train, X_val, y_val):
    """Train XGBoost model predicting log(price) (median-like point estimate)."""
    model = xgb.XGBRegressor(
        n_estimators=800,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        early_stopping_rounds=50,
        eval_metric="mae",
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )
    print(f"XGBoost best iteration: {model.best_iteration}")
    return model


# ---------------------------------------------------------------------------
# LightGBM quantile models for prediction intervals
# ---------------------------------------------------------------------------

def train_lgb_quantile(X_train, y_train, X_val, y_val, quantile: float):
    """Train a LightGBM quantile regression model."""
    params = dict(
        objective="quantile",
        alpha=quantile,
        n_estimators=1000,
        learning_rate=0.05,
        num_leaves=63,
        min_child_samples=30,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=-1,
    )
    model = lgb.LGBMRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(-1)],
    )
    return model


# ---------------------------------------------------------------------------
# Evaluation helpers
# ---------------------------------------------------------------------------

def mape_on_price(model, X, y_log_true) -> float:
    """Evaluate MAPE on the original (non-log) price scale."""
    log_pred = model.predict(X)
    price_pred = np.exp(log_pred)
    price_true = np.exp(y_log_true)
    return mean_absolute_percentage_error(price_true, price_pred)


def band_coverage(
    X, y_log_true,
    model_low, model_mid, model_high,
) -> float:
    """Fraction of test stones whose true price falls inside [low, high] band."""
    price_true = np.exp(y_log_true.values)
    price_low = np.exp(model_low.predict(X))
    price_high = np.exp(model_high.predict(X))
    inside = (price_true >= price_low) & (price_true <= price_high)
    return float(inside.mean())


def mape_large_stones(model, X, y_log_true, df_orig: pd.DataFrame) -> float:
    """MAPE restricted to stones >2.0ct."""
    mask = df_orig.loc[y_log_true.index, "carat"] > 2.0
    if mask.sum() < 10:
        print(f"Warning: only {mask.sum()} test stones > 2.0ct — MAPE estimate unreliable")
    log_pred = model.predict(X[mask])
    price_pred = np.exp(log_pred)
    price_true = np.exp(y_log_true[mask])
    if len(price_true) == 0:
        return float("nan")
    return mean_absolute_percentage_error(price_true, price_pred)


# ---------------------------------------------------------------------------
# Main training entry point
# ---------------------------------------------------------------------------

def main():
    print("=== Phase 0 — DiamondPrice IQ Model Training ===\n")

    _, df = build_dataset()
    feature_cols = get_feature_cols(df)

    print(f"\nFeatures ({len(feature_cols)}): {feature_cols[:8]} ...")
    print(f"Total dataset size: {len(df):,} rows\n")

    X_train, X_val, X_test, y_train, y_val, y_test = make_splits(df, feature_cols)

    # Keep original df aligned with test indices for large-stone subsetting
    df_orig = df.copy()

    print("\n--- Training XGBoost point model (log-price target) ---")
    xgb_model = train_xgb_point(X_train, y_train, X_val, y_val)

    print("\n--- Training LightGBM quantile models (10th / 50th / 90th) ---")
    lgb_low = train_lgb_quantile(X_train, y_train, X_val, y_val, Q_LOW)
    lgb_mid = train_lgb_quantile(X_train, y_train, X_val, y_val, Q_MID)
    lgb_high = train_lgb_quantile(X_train, y_train, X_val, y_val, Q_HIGH)
    print("Quantile models trained.")

    # --- Evaluation ---
    print("\n=== Evaluation on Held-Out Test Set ===")
    mape_overall = mape_on_price(xgb_model, X_test, y_test)
    mape_large = mape_large_stones(xgb_model, X_test, y_test, df_orig)
    coverage = band_coverage(X_test, y_test, lgb_low, lgb_mid, lgb_high)

    mape_overall_lgb = mape_on_price(lgb_mid, X_test, y_test)

    print(f"\nXGBoost  MAPE overall:       {mape_overall:.2%}")
    print(f"XGBoost  MAPE >2.0ct stones: {mape_large:.2%}")
    print(f"LightGBM MAPE overall (mid): {mape_overall_lgb:.2%}")
    print(f"Band coverage [5th–95th]:    {coverage:.2%}")

    # --- Save artifacts ---
    joblib.dump(xgb_model, ARTIFACTS_DIR / "xgb_point_model.joblib")
    joblib.dump(lgb_low, ARTIFACTS_DIR / "lgb_q05_model.joblib")
    joblib.dump(lgb_mid, ARTIFACTS_DIR / "lgb_q50_model.joblib")
    joblib.dump(lgb_high, ARTIFACTS_DIR / "lgb_q95_model.joblib")
    joblib.dump(feature_cols, ARTIFACTS_DIR / "feature_cols.joblib")

    metrics = {
        "xgb_mape_overall": round(mape_overall, 4),
        "xgb_mape_gt2ct": round(mape_large, 4) if not np.isnan(mape_large) else None,
        "lgb_mid_mape_overall": round(mape_overall_lgb, 4),
        "band_coverage_q05_q95": round(coverage, 4),
        "n_train": len(X_train),
        "n_val": len(X_val),
        "n_test": len(X_test),
        "feature_count": len(feature_cols),
        "targets": {
            "mape_overall_target": 0.12,
            "mape_gt2ct_target": 0.18,
            "band_coverage_target": 0.80,
        }
    }
    with open(ARTIFACTS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nArtifacts saved to {ARTIFACTS_DIR}")
    print("\n--- Target Check ---")
    print(f"MAPE overall    {'✓ PASS' if mape_overall <= 0.12 else '✗ FAIL'} "
          f"(target ≤12%, got {mape_overall:.2%})")
    if not np.isnan(mape_large):
        print(f"MAPE >2.0ct     {'✓ PASS' if mape_large <= 0.18 else '✗ FAIL'} "
              f"(target ≤18%, got {mape_large:.2%})")
    print(f"Band coverage   {'✓ PASS' if coverage >= 0.80 else '✗ FAIL'} "
          f"(target ≥80%, got {coverage:.2%}  [5th–95th quantiles])")

    return metrics


if __name__ == "__main__":
    main()
