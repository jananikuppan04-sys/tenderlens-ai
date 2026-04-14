"""
Train a Machine Learning Model for TenderLens Risk Scoring

This script reads the historical procurement data, calculates the base
features (hhi, network, price, winner), generates a target composite risk score,
and trains a RandomForestRegressor to predict the score. The model is saved
to be used by the main scoring module.
"""

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Import existing feature computation functions
from modules.concentration import compute_hhi
from modules.network_analysis import compute_network_risk
from modules.pricing import compute_price_risk
from modules.winner_analysis import compute_dominance_risk

def load_data(filepath="data/procurement_data.csv"):
    if not os.path.exists(filepath):
        from utils.helpers import load_data as default_load
        return default_load()
    return pd.read_csv(filepath)

def prepare_training_data(df: pd.DataFrame) -> pd.DataFrame:
    print("Computing base features for training...")
    
    # Compute base risk maps
    hhi_df = compute_hhi(df, groupby_col="category")
    hhi_risk_map = hhi_df.set_index("category")["concentration_risk"].to_dict()

    network_df = compute_network_risk(df)
    network_risk_map = network_df.set_index("company_id")["network_risk"].to_dict()

    price_df = compute_price_risk(df)
    price_risk_map = price_df.set_index("tender_id")["price_risk"].to_dict()

    winner_df = compute_dominance_risk(df)
    winner_risk_map = winner_df.set_index("company_id")["dominance_risk"].to_dict()

    # Build tender-level dataset (only winning bids)
    tenders = df[df["winner"] == 1].copy()
    tenders = tenders.drop_duplicates("tender_id")

    # Map features
    tenders["hhi_risk"] = tenders["category"].map(hhi_risk_map).fillna(0)
    tenders["network_risk"] = tenders["company_id"].map(network_risk_map).fillna(0)
    tenders["price_risk"] = tenders["tender_id"].map(price_risk_map).fillna(0)
    tenders["winner_risk"] = tenders["company_id"].map(winner_risk_map).fillna(0)

    # ── GENERATE TARGET VARIABLE ──
    # We use the original linear formula as the "ground truth" but add some
    # realistic noise so the Random Forest actually learns rather than just copying a straight line.
    
    # Original weights
    W_HHI = 0.30
    W_NETWORK = 0.25
    W_PRICE = 0.25
    W_WINNER = 0.20

    base_risk = (
        W_HHI * tenders["hhi_risk"] +
        W_NETWORK * tenders["network_risk"] +
        W_PRICE * tenders["price_risk"] +
        W_WINNER * tenders["winner_risk"]
    )
    
    # Add 5% noise to make it realistic
    np.random.seed(42)
    noise = np.random.normal(0, 0.05, len(base_risk))
    
    tenders["target_composite_risk"] = base_risk + noise
    # Ensure it stays within [0, 1] range before scaling
    tenders["target_composite_risk"] = tenders["target_composite_risk"].clip(0, 1)
    
    # Scale exactly like the old formula did (0-100)
    tenders["target_risk_score"] = (tenders["target_composite_risk"] * 100).clip(0, 100).round(1)

    return tenders

def train_model():
    print("Loading data...")
    df = load_data()
    
    print("Preparing training dataset...")
    tenders_df = prepare_training_data(df)
    
    # Feature columns
    features = ["hhi_risk", "network_risk", "price_risk", "winner_risk"]
    target = "target_risk_score"
    
    X = tenders_df[features]
    y = tenders_df[target]
    
    print(f"Dataset shape: {X.shape}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluation
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Evaluation:")
    print(f"  MSE: {mse:.4f}")
    print(f"  R^2: {r2:.4f}")
    
    # Feature importance
    importances = model.feature_importances_
    print("Feature Importances:")
    for feat, imp in zip(features, importances):
        print(f"  {feat}: {imp:.4f}")
        
    # Save model
    model_dir = "models"
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "risk_model.joblib")
    
    print(f"Saving model to {model_path}...")
    joblib.dump(model, model_path)
    print("Done!")

if __name__ == "__main__":
    train_model()
