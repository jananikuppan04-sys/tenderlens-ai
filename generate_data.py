"""Generate synthetic procurement data for TenderLens AI."""
import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

np.random.seed(42)
random.seed(42)

departments = ["Public Works", "Health & Sanitation", "Education", "Transport", "IT & Digital", "Defense", "Energy"]
categories = ["Construction", "Medical Equipment", "IT Services", "Consulting", "Supplies", "Infrastructure", "Software", "Maintenance", "Training", "Security Services"]

companies = {
    "COMP001": ("Apex Infrastructure Ltd", ["Rajesh Kumar", "Priya Shah"]),
    "COMP002": ("BlueHorizon Services", ["Amit Patel", "Suman Reddy"]),
    "COMP003": ("CrestLine Solutions", ["Priya Shah", "Neha Gupta"]),
    "COMP004": ("Delta Engineering Co", ["Vikram Singh", "Anand Mehta"]),
    "COMP005": ("Evergreen Constructions", ["Suresh Iyer", "Kavita Joshi"]),
    "COMP006": ("FusionTech Systems", ["Anand Mehta", "Ravi Nair"]),
    "COMP007": ("GlobalEdge Infra", ["Deepa Verma", "Mohan Das"]),
    "COMP008": ("HighPoint Services", ["Mohan Das", "Lakshmi Rao"]),
    "COMP009": ("InfraPrime Ltd", ["Arun Sharma", "Pooja Bhat"]),
    "COMP010": ("JetStream Solutions", ["Rajesh Kumar", "Vikram Singh"]),
    "COMP011": ("KingsBridge Corp", ["Suman Reddy", "Deepa Verma"]),
    "COMP012": ("Lumencraft Industries", ["Lakshmi Rao", "Amit Patel"]),
    "COMP013": ("Meridian Works", ["Kavita Joshi", "Ravi Nair"]),
    "COMP014": ("NovaTech Engineering", ["Pooja Bhat", "Neha Gupta"]),
    "COMP015": ("OmniGroup Services", ["Arun Sharma", "Rajesh Kumar"]),
}

rows = []
tender_counter = 1000

for _ in range(100):
    tender_id = f"TND-{tender_counter}"
    tender_counter += 1
    dept = random.choice(departments)
    cat = random.choice(categories)
    est_value = round(np.random.uniform(500000, 50000000), 2)
    date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 700))

    tender_type = random.choices(["competitive", "collusive", "dominant"], weights=[0.50, 0.30, 0.20], k=1)[0]
    n_bidders = random.randint(3, 8)
    bidder_ids = random.sample(list(companies.keys()), min(n_bidders, len(companies)))

    if tender_type == "competitive":
        bids = [round(est_value * np.random.uniform(0.80, 1.10), 2) for _ in bidder_ids]
        winner_idx = int(np.argmin(bids))
    elif tender_type == "collusive":
        base = est_value * np.random.uniform(0.93, 0.98)
        bids = [round(base + np.random.uniform(-est_value * 0.02, est_value * 0.02), 2) for _ in bidder_ids]
        winner_idx = 0
        bids[0] = round(min(bids) - est_value * 0.005, 2)
    else:
        bids = [round(est_value * np.random.uniform(0.82, 1.08), 2) for _ in bidder_ids]
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
            "tender_id": tender_id, "department": dept, "category": cat,
            "company_id": comp_id, "company_name": comp_name,
            "bid_amount": bids[i], "estimated_value": est_value,
            "winner": 1 if i == winner_idx else 0,
            "director_name": random.choice(comp_dirs),
            "date": date.strftime("%Y-%m-%d"),
        })

df = pd.DataFrame(rows)
os.makedirs("data", exist_ok=True)
df.to_csv("data/procurement_data.csv", index=False)
print(f"Generated {len(df)} rows with {df['tender_id'].nunique()} tenders")
print(f"Columns: {list(df.columns)}")
