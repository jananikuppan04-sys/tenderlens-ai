"""
TenderLens AI — Utility Helpers
Provides shared helper functions for data loading, styling, risk labeling, and color coding.
"""

import pandas as pd
import numpy as np
import os
import streamlit as st
from datetime import datetime, timedelta
import random

# ─────────────────────────────────────────────
# COLOR CONSTANTS
# ─────────────────────────────────────────────
COLOR_HIGH_RISK = "#FF4B4B"
COLOR_MEDIUM_RISK = "#FFC857"
COLOR_LOW_RISK = "#2ECC71"
COLOR_PRIMARY = "#3B82F6"
COLOR_BG_DARK = "#0F1117"
COLOR_BG_CARD = "#1A1D26"
COLOR_TEXT = "#E8E8E8"

# ─────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────

@st.cache_data
def load_data(filepath: str = None) -> pd.DataFrame:
    """
    Load procurement data from CSV.
    If file doesn't exist, generate synthetic data and save it.
    """
    if filepath is None:
        filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "procurement_data.csv")

    if not os.path.exists(filepath):
        df = generate_synthetic_data()
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        df.to_csv(filepath, index=False)
        return df

    df = pd.read_csv(filepath, parse_dates=["date"])
    return df


# ─────────────────────────────────────────────
# SYNTHETIC DATA GENERATOR
# ─────────────────────────────────────────────

def generate_synthetic_data(n_rows: int = 600) -> pd.DataFrame:
    """
    Generate realistic synthetic procurement data with:
    - Competitive tenders (normal spread)
    - Collusive tenders (low bid spread / coordinated)
    - Repeated winners
    - Shared directors across companies
    """
    np.random.seed(42)
    random.seed(42)

    departments = [
        "Public Works", "Health & Sanitation", "Education",
        "Transport", "IT & Digital", "Defense", "Energy"
    ]
    categories = [
        "Construction", "Medical Equipment", "IT Services",
        "Consulting", "Supplies", "Infrastructure", "Software",
        "Maintenance", "Training", "Security Services"
    ]
    # Director pool (some are intentionally shared across companies)
    directors = [
        "Rajesh Kumar", "Priya Shah", "Amit Patel",
        "Suman Reddy", "Neha Gupta", "Vikram Singh",
        "Anand Mehta", "Suresh Iyer", "Kavita Joshi",
        "Ravi Nair", "Deepa Verma", "Mohan Das",
        "Lakshmi Rao", "Arun Sharma", "Pooja Bhat"
    ]
    companies = {
        "COMP001": ("Apex Infrastructure Ltd", ["Rajesh Kumar", "Priya Shah"]),
        "COMP002": ("BlueHorizon Services", ["Amit Patel", "Suman Reddy"]),
        "COMP003": ("CrestLine Solutions", ["Priya Shah", "Neha Gupta"]),     # Shared director with COMP001
        "COMP004": ("Delta Engineering Co", ["Vikram Singh", "Anand Mehta"]),
        "COMP005": ("Evergreen Constructions", ["Suresh Iyer", "Kavita Joshi"]),
        "COMP006": ("FusionTech Systems", ["Anand Mehta", "Ravi Nair"]),       # Shared director with COMP004
        "COMP007": ("GlobalEdge Infra", ["Deepa Verma", "Mohan Das"]),
        "COMP008": ("HighPoint Services", ["Mohan Das", "Lakshmi Rao"]),       # Shared director with COMP007
        "COMP009": ("InfraPrime Ltd", ["Arun Sharma", "Pooja Bhat"]),
        "COMP010": ("JetStream Solutions", ["Rajesh Kumar", "Vikram Singh"]),   # Shared directors
        "COMP011": ("KingsBridge Corp", ["Suman Reddy", "Deepa Verma"]),
        "COMP012": ("Lumencraft Industries", ["Lakshmi Rao", "Amit Patel"]),   # Shared director
        "COMP013": ("Meridian Works", ["Kavita Joshi", "Ravi Nair"]),
        "COMP014": ("NovaTech Engineering", ["Pooja Bhat", "Neha Gupta"]),
        "COMP015": ("OmniGroup Services", ["Arun Sharma", "Rajesh Kumar"]),    # Shared director
    }

    rows = []
    tender_counter = 1000

    # Generate ~100 tenders with varying bidder counts
    n_tenders = 100
    for _ in range(n_tenders):
        tender_id = f"TND-{tender_counter}"
        tender_counter += 1
        dept = random.choice(departments)
        cat = random.choice(categories)
        est_value = round(np.random.uniform(500000, 50000000), 2)
        date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 700))

        # Decide tender type
        tender_type = random.choices(
            ["competitive", "collusive", "dominant"],
            weights=[0.50, 0.30, 0.20],
            k=1
        )[0]

        # Number of bidders (3–8)
        n_bidders = random.randint(3, 8)
        bidder_ids = random.sample(list(companies.keys()), min(n_bidders, len(companies)))

        if tender_type == "competitive":
            # Normal spread: bids between 80% and 110% of estimated value
            bids = [round(est_value * np.random.uniform(0.80, 1.10), 2) for _ in bidder_ids]
            winner_idx = np.argmin(bids)

        elif tender_type == "collusive":
            # Tight bid clustering: bids between 95% and 102% of estimated value
            base = est_value * np.random.uniform(0.93, 0.98)
            bids = [round(base + np.random.uniform(-est_value * 0.02, est_value * 0.02), 2) for _ in bidder_ids]
            # Predetermined winner — slightly lower
            winner_idx = 0
            bids[0] = round(min(bids) - est_value * 0.005, 2)

        else:  # dominant — one company always wins with similar low bid
            bids = [round(est_value * np.random.uniform(0.82, 1.08), 2) for _ in bidder_ids]
            # Force dominant company (COMP001 or COMP002)
            dominant = random.choice(["COMP001", "COMP002"])
            if dominant in bidder_ids:
                winner_idx = bidder_ids.index(dominant)
                bids[winner_idx] = round(min(bids) * 0.97, 2)
            else:
                bidder_ids[0] = dominant
                winner_idx = 0
                bids[0] = round(min(bids) * 0.97, 2)

        for i, comp_id in enumerate(bidder_ids):
            comp_name, comp_dirs = companies[comp_id]
            rows.append({
                "tender_id": tender_id,
                "department": dept,
                "category": cat,
                "company_id": comp_id,
                "company_name": comp_name,
                "bid_amount": bids[i],
                "estimated_value": est_value,
                "winner": 1 if i == winner_idx else 0,
                "director_name": random.choice(comp_dirs),
                "date": date.strftime("%Y-%m-%d"),
            })

    df = pd.DataFrame(rows)
    return df


# ─────────────────────────────────────────────
# RISK LABELING & COLOR HELPERS
# ─────────────────────────────────────────────

def risk_label(score: float) -> str:
    """Return risk label based on 0–100 score."""
    if score >= 70:
        return "🔴 High Risk"
    elif score >= 40:
        return "🟡 Medium Risk"
    else:
        return "🟢 Low Risk"


def risk_color(score: float) -> str:
    """Return hex color based on 0–100 risk score."""
    if score >= 70:
        return COLOR_HIGH_RISK
    elif score >= 40:
        return COLOR_MEDIUM_RISK
    else:
        return COLOR_LOW_RISK


def risk_badge_html(score: float) -> str:
    """Return styled HTML badge for a risk score."""
    color = risk_color(score)
    label = risk_label(score).split(" ", 1)[1]  # Remove emoji
    emoji = risk_label(score).split(" ", 1)[0]
    return f'<span style="background:{color};color:#fff;padding:4px 12px;border-radius:20px;font-weight:600;font-size:14px;">{emoji} {label} ({score:.0f})</span>'


def normalize_score(values: pd.Series, lower: float = 0, upper: float = 1) -> pd.Series:
    """Min-max normalize a series to [lower, upper] range."""
    min_val = values.min()
    max_val = values.max()
    if max_val == min_val:
        return pd.Series([0.5] * len(values), index=values.index)
    return lower + (values - min_val) / (max_val - min_val) * (upper - lower)


def generate_ai_remark(risk_score: float, hhi_label: str, price_risk: float, network_risk: float) -> str:
    """Generate an AI-style interpretive remark for a tender."""
    remarks = []

    # Composite summary is driven primarily by the risk_score, but if the score is
    # low we still want to call out any concerning sub‑scores so the message
    # doesn't contradict itself (e.g. a green check followed by two warning lines).
    if risk_score >= 70:
        remarks.append("⚠️ Elevated composite risk detected.")
    elif risk_score >= 40:
        remarks.append("⚡ Moderate risk indicators observed.")
    else:
        # low overall risk – check for individual red flags
        if hhi_label == "High Concentration" or price_risk > 0.6 or network_risk > 0.6:
            remarks.append(
                "🟡 Composite score is low, but there are warning signs in one or more factors."
            )
        else:
            remarks.append("✅ Risk indicators are within normal parameters.")

    if hhi_label == "High Concentration":
        remarks.append("Market concentration is critically high — limited competitive diversity.")
    elif hhi_label == "Moderate":
        remarks.append("Moderate market concentration with room for competitive improvement.")

    if price_risk > 0.6:
        remarks.append("Coordinated bidding signals detected — unusually tight bid clustering.")
    if network_risk > 0.6:
        remarks.append("Network analysis reveals suspicious inter-vendor relationships.")

    if risk_score >= 60:
        remarks.append("Manual review recommended before contract award.")
    elif risk_score >= 40:
        remarks.append("Enhanced monitoring advised for this tender category.")

    return " ".join(remarks)
