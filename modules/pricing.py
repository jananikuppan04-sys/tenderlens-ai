"""
TenderLens AI — Price Intelligence Module
Detects pricing anomalies: low variance tenders, Z-score outliers, bid clustering.
"""

import pandas as pd
import numpy as np


def compute_tender_price_stats(df: pd.DataFrame) -> pd.DataFrame:
    """
    For each tender, compute:
    - Mean bid
    - Standard deviation
    - Coefficient of variation (CV)
    - Bid spread (max - min as % of estimated value)
    - Number of bidders
    """
    stats = df.groupby("tender_id").agg(
        mean_bid=("bid_amount", "mean"),
        std_bid=("bid_amount", "std"),
        min_bid=("bid_amount", "min"),
        max_bid=("bid_amount", "max"),
        n_bidders=("bid_amount", "count"),
        estimated_value=("estimated_value", "first"),
        department=("department", "first"),
        category=("category", "first"),
    ).reset_index()

    # Coefficient of variation — lower means tighter clustering
    stats["cv"] = (stats["std_bid"] / stats["mean_bid"]).fillna(0)

    # Bid spread as percentage
    stats["bid_spread_pct"] = (
        (stats["max_bid"] - stats["min_bid"]) / stats["estimated_value"] * 100
    ).fillna(0)

    # Flag low variance tenders (CV < 3% is suspicious)
    stats["low_variance_flag"] = stats["cv"] < 0.03

    return stats


def compute_zscore_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute Z-scores for each bid within its tender.
    Flag bids with |Z| > 2 as outliers.
    """
    result = df.copy()

    # Calculate Z-score per tender group
    tender_stats = df.groupby("tender_id")["bid_amount"].agg(["mean", "std"]).reset_index()
    tender_stats.columns = ["tender_id", "tender_mean", "tender_std"]

    result = result.merge(tender_stats, on="tender_id")
    result["z_score"] = np.where(
        result["tender_std"] > 0,
        (result["bid_amount"] - result["tender_mean"]) / result["tender_std"],
        0,
    )
    result["is_outlier"] = result["z_score"].abs() > 2

    return result


def compute_price_risk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute normalized price risk per tender.
    High risk = low variance (tight clustering) + bids near estimated value.
    """
    stats = compute_tender_price_stats(df)

    # Inverse CV: lower variance → higher risk
    max_cv = stats["cv"].max()
    if max_cv > 0:
        stats["variance_risk"] = 1 - (stats["cv"] / max_cv)
    else:
        stats["variance_risk"] = 0.5

    # Proximity risk: how close mean bid is to estimated value
    stats["proximity_ratio"] = (stats["mean_bid"] / stats["estimated_value"]).clip(0, 2)
    stats["proximity_risk"] = 1 - abs(stats["proximity_ratio"] - 1)  # Closer to 1 = higher risk
    stats["proximity_risk"] = stats["proximity_risk"].clip(0, 1)

    # Combined price risk (0–1)
    stats["price_risk"] = (
        0.65 * stats["variance_risk"] +
        0.35 * stats["proximity_risk"]
    ).clip(0, 1)

    return stats


def get_pricing_summary(df: pd.DataFrame) -> dict:
    """
    Return summary of pricing analysis.
    """
    stats = compute_price_risk(df)
    zscore_df = compute_zscore_anomalies(df)

    low_var_tenders = stats[stats["low_variance_flag"]]["tender_id"].tolist()
    outlier_bids = zscore_df[zscore_df["is_outlier"]]

    return {
        "tender_stats": stats,
        "zscore_data": zscore_df,
        "low_variance_tenders": low_var_tenders,
        "n_low_variance": len(low_var_tenders),
        "n_outlier_bids": len(outlier_bids),
        "avg_price_risk": stats["price_risk"].mean(),
    }
