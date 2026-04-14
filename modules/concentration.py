"""
TenderLens AI — Market Concentration Module
Computes Herfindahl-Hirschman Index (HHI) and market share analysis.

HHI Thresholds:
  < 1500    → Competitive
  1500–2500 → Moderate concentration
  > 2500    → High concentration
"""

import pandas as pd
import numpy as np


def compute_market_share(df: pd.DataFrame, groupby_col: str = "category") -> pd.DataFrame:
    """
    Calculate market share per company within each category.
    Market share = total contract value won / total category value.
    """
    # Only consider winners
    winners = df[df["winner"] == 1].copy()

    # Total bid amount per company per category
    company_share = (
        winners.groupby([groupby_col, "company_id", "company_name"])["bid_amount"]
        .sum()
        .reset_index()
    )
    # Total per category
    category_total = (
        winners.groupby(groupby_col)["bid_amount"]
        .sum()
        .reset_index()
        .rename(columns={"bid_amount": "category_total"})
    )

    company_share = company_share.merge(category_total, on=groupby_col)
    company_share["market_share_pct"] = (
        company_share["bid_amount"] / company_share["category_total"] * 100
    )

    return company_share


def compute_hhi(df: pd.DataFrame, groupby_col: str = "category") -> pd.DataFrame:
    """
    Compute HHI per category.
    HHI = sum of squared market shares (percentages).
    """
    market_shares = compute_market_share(df, groupby_col)

    hhi_df = (
        market_shares.groupby(groupby_col)
        .apply(lambda g: (g["market_share_pct"] ** 2).sum(), include_groups=False)
        .reset_index()
        .rename(columns={0: "hhi"})
    )

    # Label HHI
    hhi_df["hhi_label"] = hhi_df["hhi"].apply(_label_hhi)

    # Normalize to 0–1 risk score (0 = competitive, 1 = monopolistic)
    # Max theoretical HHI = 10000 (100% monopoly)
    hhi_df["concentration_risk"] = (hhi_df["hhi"] / 10000).clip(0, 1)

    return hhi_df


def _label_hhi(hhi_value: float) -> str:
    """Classify HHI into market structure label."""
    if hhi_value < 1500:
        return "Competitive"
    elif hhi_value <= 2500:
        return "Moderate"
    else:
        return "High Concentration"


def get_concentration_summary(df: pd.DataFrame) -> dict:
    """
    Return a summary dict with overall concentration metrics.
    """
    hhi_df = compute_hhi(df)
    market_shares = compute_market_share(df)

    return {
        "hhi_by_category": hhi_df,
        "market_shares": market_shares,
        "avg_hhi": hhi_df["hhi"].mean(),
        "max_hhi": hhi_df["hhi"].max(),
        "high_concentration_categories": hhi_df[hhi_df["hhi_label"] == "High Concentration"][
            "category"
        ].tolist(),
    }
