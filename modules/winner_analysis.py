"""
TenderLens AI — Winner Analysis Module
Detects dominant vendors, win-rate anomalies, and rotational bidding patterns.
"""

import pandas as pd
import numpy as np


def compute_win_rates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute win rate per company.
    Win rate = (tenders won / tenders participated) × 100
    """
    # Total bids per company
    participations = (
        df.groupby(["company_id", "company_name"])
        .size()
        .reset_index(name="total_bids")
    )
    # Total wins per company
    wins = (
        df[df["winner"] == 1]
        .groupby(["company_id", "company_name"])
        .size()
        .reset_index(name="total_wins")
    )

    result = participations.merge(wins, on=["company_id", "company_name"], how="left")
    result["total_wins"] = result["total_wins"].fillna(0).astype(int)
    result["win_rate"] = (result["total_wins"] / result["total_bids"] * 100).round(2)

    # Total contract value won
    won_values = (
        df[df["winner"] == 1]
        .groupby("company_id")["bid_amount"]
        .sum()
        .reset_index()
        .rename(columns={"bid_amount": "total_won_value"})
    )
    result = result.merge(won_values, on="company_id", how="left")
    result["total_won_value"] = result["total_won_value"].fillna(0)

    return result.sort_values("win_rate", ascending=False)


def detect_dominant_winners(df: pd.DataFrame, threshold: float = 60.0) -> pd.DataFrame:
    """
    Detect companies with win rate above threshold (default 60%).
    """
    rates = compute_win_rates(df)
    dominant = rates[rates["win_rate"] >= threshold].copy()
    dominant["dominance_flag"] = True
    return dominant


def detect_rotation_pattern(df: pd.DataFrame) -> pd.DataFrame:
    """
    Detect potential rotational winning patterns.
    Checks if a small group repeatedly alternates winning in the same category.
    """
    winners = df[df["winner"] == 1].copy()
    winners = winners.sort_values(["category", "date"])

    rotation_results = []

    for category, group in winners.groupby("category"):
        winner_sequence = group["company_id"].tolist()
        n_unique = len(set(winner_sequence))
        n_tenders = len(winner_sequence)

        if n_tenders >= 3 and n_unique <= 3:
            # Check for alternating pattern
            is_rotation = _check_rotation(winner_sequence)
            rotation_results.append({
                "category": category,
                "winner_sequence": winner_sequence,
                "unique_winners": n_unique,
                "total_tenders": n_tenders,
                "rotation_detected": is_rotation,
            })

    return pd.DataFrame(rotation_results) if rotation_results else pd.DataFrame()


def _check_rotation(sequence: list) -> bool:
    """
    Check if a sequence shows rotational pattern.
    Returns True if winners cycle in a small group.
    """
    if len(sequence) < 3:
        return False
    unique = list(set(sequence))
    if len(unique) > 3:
        return False
    # Check if distribution is roughly even (within 40%)
    from collections import Counter
    counts = Counter(sequence)
    values = list(counts.values())
    if max(values) > 0:
        ratio = min(values) / max(values)
        return ratio > 0.4  # Relatively even split indicates rotation
    return False


def compute_dominance_risk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute normalized dominance risk per company.
    High win rate → high risk.
    """
    rates = compute_win_rates(df)

    # Normalize win rate to 0–1 (win rate > 60% maps to higher risk)
    rates["dominance_risk"] = (rates["win_rate"] / 100).clip(0, 1)

    # Boost risk for companies with both high win rate AND high participation
    median_bids = rates["total_bids"].median()
    rates["volume_factor"] = (rates["total_bids"] / median_bids).clip(0, 2) / 2
    rates["dominance_risk"] = (
        0.7 * rates["dominance_risk"] + 0.3 * rates["volume_factor"]
    ).clip(0, 1)

    return rates


def get_winner_summary(df: pd.DataFrame) -> dict:
    """
    Return summary of winner analysis.
    """
    rates = compute_win_rates(df)
    dominant = detect_dominant_winners(df)
    rotation = detect_rotation_pattern(df)

    return {
        "win_rates": rates,
        "dominant_companies": dominant,
        "rotation_patterns": rotation,
        "n_dominant": len(dominant),
        "avg_win_rate": rates["win_rate"].mean(),
        "max_win_rate": rates["win_rate"].max(),
    }
