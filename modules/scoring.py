"""
TenderLens AI — Composite Risk Scoring Module
Combines all risk dimensions into a unified fairness/risk score.

Composite Risk Formula:
  Risk Score = 0.30 × HHI + 0.25 × Network + 0.25 × Price + 0.20 × Winner
  Normalized to 0–100 scale.
"""

import pandas as pd
import numpy as np

from modules.concentration import compute_hhi, compute_market_share
from modules.network_analysis import compute_network_risk
from modules.pricing import compute_price_risk
from modules.winner_analysis import compute_dominance_risk

import joblib
import os


# Weight constants
W_HHI = 0.30
W_NETWORK = 0.25
W_PRICE = 0.25
W_WINNER = 0.20


def compute_tender_risk_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute composite risk score for each tender.
    Merges concentration, network, pricing, and winner risk dimensions.
    Returns DataFrame with tender-level risk scores (0–100).
    """

    # ── 1. Concentration risk (per category) ──
    hhi_df = compute_hhi(df, groupby_col="category")
    hhi_risk_map = hhi_df.set_index("category")["concentration_risk"].to_dict()
    hhi_label_map = hhi_df.set_index("category")["hhi_label"].to_dict()

    # ── 2. Network risk (per company) ──
    network_df = compute_network_risk(df)
    network_risk_map = network_df.set_index("company_id")["network_risk"].to_dict()

    # ── 3. Price risk (per tender) ──
    price_df = compute_price_risk(df)
    price_risk_map = price_df.set_index("tender_id")["price_risk"].to_dict()

    # ── 4. Winner dominance risk (per company) ──
    winner_df = compute_dominance_risk(df)
    winner_risk_map = winner_df.set_index("company_id")["dominance_risk"].to_dict()

    # ── Build tender-level results ──
    tenders = df[df["winner"] == 1].copy()
    tenders = tenders.drop_duplicates("tender_id")

    tenders["hhi_risk"] = tenders["category"].map(hhi_risk_map).fillna(0)
    tenders["hhi_label"] = tenders["category"].map(hhi_label_map).fillna("Unknown")
    tenders["network_risk"] = tenders["company_id"].map(network_risk_map).fillna(0)
    tenders["price_risk"] = tenders["tender_id"].map(price_risk_map).fillna(0)
    tenders["winner_risk"] = tenders["company_id"].map(winner_risk_map).fillna(0)

    # ── Composite score (using ML model) ──
    # Load model (with basic error handling if model is missing)
    model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "risk_model.joblib")
    
    # Extract features in the correct order for the model
    features = ["hhi_risk", "network_risk", "price_risk", "winner_risk"]
    X = tenders[features]
    
    try:
        model = joblib.load(model_path)
        predicted_scores = model.predict(X)
        tenders["composite_risk"] = predicted_scores / 100.0 # scale back to 0-1 for composite
        tenders["risk_score"] = np.clip(np.round(predicted_scores, 1), 0, 100)
    except Exception as e:
        print(f"Warning: Could not load ML model ({e}). Falling back to linear formula.")
        tenders["composite_risk"] = (
            W_HHI * tenders["hhi_risk"] +
            W_NETWORK * tenders["network_risk"] +
            W_PRICE * tenders["price_risk"] +
            W_WINNER * tenders["winner_risk"]
        )
        tenders["risk_score"] = np.clip(tenders["composite_risk"] * 100, 0, 100).round(1)

    # Fairness score = inverse of risk
    tenders["fairness_score"] = np.clip(100 - tenders["risk_score"], 0, 100).round(1)

    # Risk label
    tenders["risk_label"] = tenders["risk_score"].apply(_risk_category)

    return tenders


def compute_company_risk_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute composite risk score aggregated per company.
    """
    # Get per-tender risk scores
    tender_risks = compute_tender_risk_scores(df)

    # Aggregate per company (using winning tenders)
    company_risk = (
        tender_risks.groupby(["company_id", "company_name"])
        .agg(
            avg_risk_score=("risk_score", "mean"),
            max_risk_score=("risk_score", "max"),
            tenders_won=("tender_id", "count"),
            avg_fairness=("fairness_score", "mean"),
            avg_hhi_risk=("hhi_risk", "mean"),
            avg_network_risk=("network_risk", "mean"),
            avg_price_risk=("price_risk", "mean"),
            avg_winner_risk=("winner_risk", "mean"),
        )
        .reset_index()
    )

    company_risk["avg_risk_score"] = company_risk["avg_risk_score"].round(1)
    company_risk["risk_label"] = company_risk["avg_risk_score"].apply(_risk_category)

    return company_risk.sort_values("avg_risk_score", ascending=False)


def _risk_category(score: float) -> str:
    """Classify risk score into category."""
    if score >= 70:
        return "High"
    elif score >= 40:
        return "Medium"
    else:
        return "Low"


def get_scoring_summary(df: pd.DataFrame) -> dict:
    """
    Get overall scoring summary for dashboard KPIs.
    """
    tender_risks = compute_tender_risk_scores(df)
    company_risks = compute_company_risk_scores(df)

    high_risk_tenders = tender_risks[tender_risks["risk_label"] == "High"]
    high_risk_companies = company_risks[company_risks["risk_label"] == "High"]

    return {
        "tender_risks": tender_risks,
        "company_risks": company_risks,
        "avg_risk_score": tender_risks["risk_score"].mean(),
        "avg_fairness_score": tender_risks["fairness_score"].mean(),
        "n_high_risk_tenders": len(high_risk_tenders),
        "n_high_risk_companies": len(high_risk_companies),
        "n_total_tenders": len(tender_risks),
        "risk_distribution": tender_risks["risk_label"].value_counts().to_dict(),
    }
