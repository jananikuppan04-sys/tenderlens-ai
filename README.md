🔍 Overview

**TenderLens** is a procurement intelligence dashboard built with Streamlit that helps auditors, analysts, and administrators detect potential irregularities in public/private tender processes. It combines four analytical dimensions — **market concentration**, **vendor networks**, **pricing anomalies**, and **winner patterns** — into a unified composite risk score for every tender and vendor.

The platform provides:
- Real-time risk scoring across multiple dimensions
- Interactive vendor network visualization
- Statistical anomaly detection for bid pricing
- Live bidding simulation with dynamic scoring
- Role-based authentication and audit-ready reporting

---

## ✨ Features

### 📊 Executive Dashboard
- **KPI Cards** — Total tenders, high-risk count, fairness score, dominant vendor alerts
- **Risk Distribution** — Donut chart showing High / Medium / Low breakdown
- **Fairness Trend** — Rolling average fairness score over time with threshold lines
- **Top Risky Vendors** — Ranked table of vendors by composite risk score

### 🕸️ Vendor Network Intelligence
- **Relationship Mapping** — Interactive Plotly graph showing vendor connections
- **Community Detection** — Automatic clustering of related vendor groups
- **Centrality Metrics** — Degree and betweenness centrality per vendor
- **Shared Director Detection** — Identifies vendors with common board members

### 💰 Price Intelligence
- **Bid vs Estimated Value** — Scatter analysis of winning bids against estimates
- **Price Spread Analysis** — Horizontal bar chart of bid spread percentages
- **Low Variance Detection** — Flags tenders with suspiciously tight bid clustering (CV < 3%)
- **Z-Score Outliers** — Statistical outlier detection on bid amounts

### 📋 Tender Assessment
- **Fairness Gauge** — Visual gauge showing individual tender fairness score
- **Risk Breakdown** — Horizontal bar chart of the four risk dimensions with weights
- **Automated Assessment** — Rule-based risk narrative for each tender
- **Tender Details** — Winner, category, department, bid amount, HHI classification

### ⚡ Live Simulator
- **Real-Time Simulation** — Watch bids arrive one by one with progressive scoring
- **Dynamic Metrics** — Fairness score and risk level update after each bid
- **Visual Feedback** — Animated bar chart builds as bids are received

### 🔐 Authentication & Theming
- **Session-based Login** — Clean login page with credential validation
- **Role-based Access** — Admin, Analyst, and Auditor roles
- **Dark / Light Mode** — Full theme toggle affecting all UI components and charts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION                         │
│  app.py (Streamlit Dashboard)                               │
│  ├── Top Bar (Title + User Profile)                         │
│  ├── Tab 1: Executive Overview                              │
│  ├── Tab 2: Vendor Network Graph                            │
│  ├── Tab 3: Price Intelligence                              │
│  ├── Tab 4: Tender Assessment                               │
│  └── Tab 5: Live Bidding Simulator                          │
├─────────────────────────────────────────────────────────────┤
│                      ANALYTICS MODULES                      │
│  modules/                                                   │
│  ├── concentration.py  → HHI & market share analysis        │
│  ├── network_analysis.py → Graph-based vendor relationships │
│  ├── pricing.py        → Statistical price anomaly detection│
│  ├── winner_analysis.py → Win rate & dominance patterns     │
│  └── scoring.py        → Composite risk score engine        │
├─────────────────────────────────────────────────────────────┤
│                        UTILITIES                            │
│  utils/                                                     │
│  ├── helpers.py  → Data loading, synthetic generation, etc. │
│  ├── auth.py     → Login page & session management          │
│  └── theme.py    → Dark/Light CSS theming + Plotly layout   │
├─────────────────────────────────────────────────────────────┤
│                          DATA                               │
│  data/procurement_data.csv                                  │
│  generate_data.py (standalone synthetic data generator)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
tenderlens/
├── app.py                    # Main Streamlit application
├── generate_data.py          # Standalone synthetic data generator
├── requirements.txt          # Python dependencies
├── README.md                 # This file
│
├── data/
│   └── procurement_data.csv  # Procurement bid dataset
│
├── modules/
│   ├── concentration.py      # HHI & market concentration analysis
│   ├── network_analysis.py   # Vendor relationship graph & metrics
│   ├── pricing.py            # Price anomaly & outlier detection
│   ├── winner_analysis.py    # Win rate & dominance analysis
│   └── scoring.py            # Composite risk scoring engine
│
└── utils/
    ├── helpers.py            # Data loading, colors, risk labeling
    ├── auth.py               # Authentication & login page
    └── theme.py              # Dark/Light theme CSS & Plotly config
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+**
- **pip** package manager

### Installation

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/yourusername/tenderlens.git
   cd tenderlens
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Generate sample data** (optional — auto-generates on first run)
   ```bash
   python generate_data.py
   ```

4. **Launch the dashboard**
   ```bash
   streamlit run app.py
   ```

5. **Open in browser** → `http://localhost:8501`

---

## 📖 Usage Guide

### 1. Login
Use one of the demo credentials to sign in:

| Username   | Password      | Role     |
|------------|---------------|----------|
| `admin`    | `admin123`    | Admin    |
| `analyst`  | `analyst123`  | Analyst  |
| `auditor`  | `auditor123`  | Auditor  |

### 2. Apply Filters
Use the sidebar to filter data by:
- **Department** — Public Works, Health, Education, etc.
- **Category** — Construction, IT Services, Consulting, etc.
- **Date Range** — Custom date window

### 3. Explore Tabs
- **Overview** — Start here for a high-level risk summary
- **Network** — Investigate vendor relationships and community clusters
- **Pricing** — Drill into pricing anomalies and outlier bids
- **Assessment** — Select individual tenders for detailed risk breakdown
- **Simulator** — Run live bidding simulations

### 4. Theme Toggle
Click the ☀️ / 🌙 button in the sidebar to switch between light and dark modes.

---

## 🔬 Modules

### `modules/concentration.py`
Computes the **Herfindahl-Hirschman Index (HHI)** for market concentration analysis.
- `compute_market_share(df)` — Calculates vendor market share per category
- `compute_hhi(df)` — Computes HHI per tender/category
- `get_concentration_summary(df)` — Returns labeled concentration metrics

**HHI Thresholds:**
| HHI Value     | Classification     |
|---------------|--------------------|
| < 1,500       | Competitive        |
| 1,500 – 2,500 | Moderately Concentrated |
| > 2,500       | Highly Concentrated |

### `modules/network_analysis.py`
Builds a **graph-based vendor network** using shared directors and co-bidding patterns.
- `build_vendor_network(df)` — Constructs NetworkX graph
- `compute_network_metrics(G)` — Degree centrality, betweenness centrality
- `detect_clusters(G)` — Community detection using greedy modularity
- `get_network_summary(df)` — Full network analysis summary

### `modules/pricing.py`
Performs **statistical anomaly detection** on bid pricing.
- `compute_tender_price_stats(df)` — Mean, std, CV, spread per tender
- `compute_zscore_anomalies(df)` — Z-score outlier detection
- `compute_price_risk(df)` — Normalized price risk score
- `get_pricing_summary(df)` — Complete pricing analysis

### `modules/winner_analysis.py`
Analyzes **winning patterns** to detect dominance and rotation.
- `compute_win_rates(df)` — Win rate per vendor
- `detect_dominant_winners(df)` — Flags vendors with abnormal win rates
- `get_winner_summary(df)` — Winner pattern summary

### `modules/scoring.py`
Combines all dimensions into a **composite risk score**.
- `compute_tender_risk_scores(df)` — Per-tender scoring
- `compute_company_risk_scores(df)` — Per-vendor scoring
- `get_scoring_summary(df)` — Overall scoring summary

**Risk Score Weights:**
| Dimension             | Weight |
|-----------------------|--------|
| Market Concentration  | 30%    |
| Network Risk          | 25%    |
| Price Risk            | 25%    |
| Winner Dominance      | 20%    |

---

## 🔐 Authentication

The platform uses **session-based authentication** via Streamlit's `st.session_state`.

- Login credentials are defined in `utils/auth.py`
- Passwords are stored in plaintext (demo only — use hashing in production)
- User info (name, role) is displayed in the sidebar and top bar
- Sign out clears the session and returns to the login page

> ⚠️ **Production Note:** For deployment, replace the demo auth with OAuth 2.0, LDAP, or a secure database-backed authentication system with hashed passwords.

---

## 🎨 Theme System

The theme system (`utils/theme.py`) supports full **dark and light mode** toggling:

| Component         | Light Mode         | Dark Mode          |
|-------------------|--------------------|--------------------|
| Background        | `#F0F2F5`          | `#0B0F19`          |
| Cards             | `#FFFFFF`          | `#161E2E`          |
| Primary Accent    | `#F59E0B` (amber)  | `#F59E0B` (amber)  |
| Text              | `#1A1D26`          | `#F1F5F9`          |
| Card Shadows      | Soft light shadows | Dark shadows       |

The toggle also affects:
- All Plotly chart colors (font, gridlines, backgrounds)
- Streamlit native widgets (metrics, inputs, tabs, buttons)
- Gauge backgrounds, network node outlines, and footer styling

---

## 📊 Data Format

The platform expects a CSV file at `data/procurement_data.csv` with the following columns:

| Column           | Type    | Description                              |
|------------------|---------|------------------------------------------|
| `tender_id`      | string  | Unique tender identifier (e.g., TND-1001)|
| `department`     | string  | Issuing department                       |
| `category`       | string  | Procurement category                     |
| `company_id`     | string  | Unique vendor identifier                 |
| `company_name`   | string  | Vendor name                              |
| `bid_amount`     | float   | Bid value in currency                    |
| `estimated_value`| float   | Government/client estimated value        |
| `winner`         | int     | 1 if winning bid, 0 otherwise            |
| `director_name`  | string  | Company director name (for network)      |
| `date`           | string  | Bid date in YYYY-MM-DD format           |

If the CSV doesn't exist, the app auto-generates **600 rows** of synthetic data across **100 tenders** with realistic competitive, collusive, and dominant bidding patterns.

---

## 🛠️ Tech Stack

| Technology   | Purpose                          |
|--------------|----------------------------------|
| **Streamlit**  | Web framework & UI              |
| **Pandas**     | Data manipulation               |
| **NumPy**      | Numerical computations          |
| **Plotly**     | Interactive charts & gauges     |
| **NetworkX**   | Graph analysis & community detection |
| **scikit-learn** | Statistical analysis support  |
| **Font Awesome** | Professional icons (via CDN)  |
| **Inter Font**   | Typography (via Google Fonts) |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code style
- Keep modules focused and single-responsibility
- Add docstrings to all public functions
- Test with both light and dark themes

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Built with ❤️ for transparent procurement</b><br>
  <sub>TenderLens v2.0 — Procurement Analytics Platform</sub>
</p>