"""
Data ingestion, cleaning, and feature engineering for diamond price modeling.
"""

import io
import urllib.request
import pandas as pd
import numpy as np
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"

# GIA scale ordinals
CUT_ORDER = ["Fair", "Good", "Very Good", "Premium", "Ideal"]
COLOR_ORDER = ["J", "I", "H", "G", "F", "E", "D"]
CLARITY_ORDER = ["I3", "I2", "I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF", "FL"]

# Magic-size carat thresholds where price jumps non-linearly
MAGIC_SIZES = [0.30, 0.40, 0.50, 0.70, 0.90, 1.00, 1.50, 2.00, 3.00, 4.00, 5.00]


def load_raw_diamonds() -> pd.DataFrame:
    """Load the ggplot2 diamonds dataset from local cache or download."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    local_path = RAW_DIR / "diamonds.csv"

    if not local_path.exists():
        # Download from a stable public mirror of the ggplot2 diamonds CSV
        url = "https://raw.githubusercontent.com/tidyverse/ggplot2/main/data-raw/diamonds.csv"
        print(f"Downloading diamonds dataset from {url} ...")
        try:
            urllib.request.urlretrieve(url, local_path)
        except Exception:
            # Fallback: reconstruct from sklearn/pydataset if network unavailable
            _generate_fallback_diamonds(local_path)

    df = pd.read_csv(local_path)
    print(f"Loaded {len(df):,} rows from {local_path.name}")
    return df


def _generate_fallback_diamonds(local_path: Path) -> None:
    """Generate a small synthetic diamonds dataset as last-resort fallback."""
    rng = np.random.default_rng(42)
    n = 1000
    carats = rng.uniform(0.2, 3.0, n)
    cuts = rng.choice(CUT_ORDER, n)
    colors = rng.choice(COLOR_ORDER, n)
    clarities = rng.choice(CLARITY_ORDER, n)
    # Rough price formula for fallback only
    cut_m = dict(zip(CUT_ORDER, [1.0, 1.05, 1.10, 1.15, 1.20]))
    color_m = dict(zip(COLOR_ORDER, np.linspace(1.0, 1.25, 7)))
    clarity_m = dict(zip(CLARITY_ORDER, np.linspace(1.0, 2.0, 11)))
    prices = (
        carats ** 1.9
        * 3500
        * np.array([cut_m[c] for c in cuts])
        * np.array([color_m[c] for c in colors])
        * np.array([clarity_m[c] for c in clarities])
        * rng.uniform(0.85, 1.15, n)
    ).astype(int)
    pd.DataFrame({
        "carat": carats, "cut": cuts, "color": colors, "clarity": clarities,
        "depth": rng.uniform(58, 65, n), "table": rng.uniform(53, 63, n),
        "price": prices, "x": carats * 4.5, "y": carats * 4.5, "z": carats * 2.8,
    }).to_csv(local_path, index=False)
    print(f"Generated fallback synthetic dataset at {local_path}")


def load_kaggle_diamonds():
    """Load optional Kaggle dataset if placed at data/raw/kaggle_diamonds.csv."""
    path = RAW_DIR / "kaggle_diamonds.csv"
    if not path.exists():
        print("No Kaggle dataset found at data/raw/kaggle_diamonds.csv — skipping.")
        return None
    df = pd.read_csv(path)
    print(f"Loaded {len(df):,} rows from kaggle_diamonds.csv")
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Clean raw diamond data."""
    original_len = len(df)

    # Normalize column names
    df.columns = df.columns.str.strip().str.lower()

    # Keep only needed columns (tolerate extras)
    needed = {"carat", "cut", "color", "clarity", "price"}
    optional = {"depth", "table", "x", "y", "z", "shape", "fluorescence", "lab", "cert"}
    available = needed | (optional & set(df.columns))
    df = df[list(available)].copy()

    # Drop rows with nulls in required fields
    df.dropna(subset=list(needed), inplace=True)

    # Price: must be positive numeric
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df[df["price"] > 0]

    # Carat: must be positive numeric, cap extreme outliers at 99.9th percentile
    df["carat"] = pd.to_numeric(df["carat"], errors="coerce")
    df = df[df["carat"] > 0]
    carat_cap = df["carat"].quantile(0.999)
    df = df[df["carat"] <= carat_cap]

    # Remove zero-dimension entries (x=0 or y=0 or z=0 indicate bad grading records)
    for dim in ["x", "y", "z"]:
        if dim in df.columns:
            df = df[df[dim] > 0]

    # Standardize categorical scales to GIA conventions
    df["cut"] = df["cut"].str.strip().str.title()
    df["cut"] = df["cut"].replace({
        "Ideal": "Ideal", "Premium": "Premium", "Very Good": "Very Good",
        "Good": "Good", "Fair": "Fair",
    })
    df = df[df["cut"].isin(CUT_ORDER)]

    df["color"] = df["color"].str.strip().str.upper()
    df = df[df["color"].isin(COLOR_ORDER)]

    df["clarity"] = df["clarity"].str.strip().str.upper().replace({
        "VVS1": "VVS1", "VVS2": "VVS2", "VS1": "VS1", "VS2": "VS2",
        "SI1": "SI1", "SI2": "SI2", "I1": "I1", "I2": "I2", "I3": "I3",
        "IF": "IF", "FL": "FL",
    })
    df = df[df["clarity"].isin(CLARITY_ORDER)]

    # De-duplicate on key fields
    key_cols = ["carat", "cut", "color", "clarity", "price"]
    if "depth" in df.columns:
        key_cols.append("depth")
    df.drop_duplicates(subset=key_cols, inplace=True)

    # Price outlier removal: remove extreme outliers per carat bucket (IQR method)
    df["_carat_bucket"] = pd.cut(df["carat"], bins=[0, 0.5, 1.0, 1.5, 2.0, 3.0, 100])
    def remove_price_outliers(group):
        q1, q3 = group["price"].quantile([0.01, 0.99])
        return group[(group["price"] >= q1) & (group["price"] <= q3)]
    df = df.groupby("_carat_bucket", observed=True).apply(remove_price_outliers).reset_index(drop=True)
    df.drop(columns=["_carat_bucket"], inplace=True)

    print(f"Cleaned: {original_len:,} → {len(df):,} rows ({original_len - len(df):,} removed)")
    return df.reset_index(drop=True)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add model features to cleaned dataframe."""
    df = df.copy()

    # Ordinal encodings
    df["cut_ord"] = df["cut"].map({v: i for i, v in enumerate(CUT_ORDER)})
    df["color_ord"] = df["color"].map({v: i for i, v in enumerate(COLOR_ORDER)})
    df["clarity_ord"] = df["clarity"].map({v: i for i, v in enumerate(CLARITY_ORDER)})

    # Log carat — compresses heavy right tail
    df["log_carat"] = np.log(df["carat"])

    # Magic-size indicator features: is carat within 0.02 of each threshold?
    for threshold in MAGIC_SIZES:
        col = f"near_{str(threshold).replace('.', 'p')}"
        df[col] = ((df["carat"] >= threshold - 0.02) & (df["carat"] < threshold + 0.05)).astype(int)

    # Carat-bucket one-hot (captures non-linear price jumps between size brackets)
    bins = [0, 0.5, 0.7, 1.0, 1.25, 1.5, 2.0, 3.0, 100]
    labels = ["xs", "s", "m", "ml", "l", "xl", "xxl", "xxxl"]
    df["carat_bucket"] = pd.cut(df["carat"], bins=bins, labels=labels)
    bucket_dummies = pd.get_dummies(df["carat_bucket"], prefix="bucket", drop_first=False)
    df = pd.concat([df, bucket_dummies], axis=1)

    # Interaction: carat × quality index (captures that larger stones are more sensitive to grade)
    df["quality_index"] = df["cut_ord"] + df["color_ord"] + df["clarity_ord"]
    df["carat_x_quality"] = df["carat"] * df["quality_index"]

    # Optional fields with defaults
    if "shape" not in df.columns:
        df["shape"] = "Round"
    if "fluorescence" not in df.columns:
        df["fluorescence"] = "None"
    if "lab" not in df.columns:
        df["lab"] = "Unknown"

    df["shape"] = df["shape"].fillna("Round").str.strip().str.title()
    df["fluorescence"] = df["fluorescence"].fillna("None").str.strip().str.title()
    df["lab"] = df["lab"].fillna("Unknown").str.strip().str.upper()

    shape_dummies = pd.get_dummies(df["shape"], prefix="shape", drop_first=False)
    fluor_dummies = pd.get_dummies(df["fluorescence"], prefix="fluor", drop_first=False)
    df = pd.concat([df, shape_dummies, fluor_dummies], axis=1)

    # Log price target
    df["log_price"] = np.log(df["price"])

    return df


def get_feature_cols(df: pd.DataFrame) -> list[str]:
    """Return the list of model input feature columns."""
    base = ["carat", "log_carat", "cut_ord", "color_ord", "clarity_ord",
            "quality_index", "carat_x_quality"]
    magic = [c for c in df.columns if c.startswith("near_")]
    buckets = [c for c in df.columns if c.startswith("bucket_")]
    shapes = [c for c in df.columns if c.startswith("shape_")]
    fluors = [c for c in df.columns if c.startswith("fluor_")]
    return base + magic + buckets + shapes + fluors


def build_dataset():
    """Full pipeline: load → merge → clean → engineer features. Returns (raw_df, feature_df)."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    df = load_raw_diamonds()
    kaggle = load_kaggle_diamonds()

    if kaggle is not None:
        df = pd.concat([df, kaggle], ignore_index=True)
        print(f"Combined dataset: {len(df):,} rows before cleaning")

    df_clean = clean(df)
    df_feat = engineer_features(df_clean)

    df_clean.to_csv(PROCESSED_DIR / "diamonds_clean.csv", index=False)
    df_feat.to_csv(PROCESSED_DIR / "diamonds_features.csv", index=False)
    print(f"Saved processed datasets to {PROCESSED_DIR}")

    return df_clean, df_feat


if __name__ == "__main__":
    build_dataset()
