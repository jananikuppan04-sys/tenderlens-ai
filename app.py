"""
TenderLens AI — Procurement Collusion & Monopoly Detection System
Main Streamlit Application
Run with: streamlit run app.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import networkx as nx
import os
import sys
import time
import random

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from utils.helpers import (
    load_data, risk_label, risk_color, risk_badge_html,
    generate_ai_remark, normalize_score,
    COLOR_HIGH_RISK, COLOR_MEDIUM_RISK, COLOR_LOW_RISK, COLOR_PRIMARY
)
from modules.concentration import compute_hhi, compute_market_share, get_concentration_summary
from modules.network_analysis import build_vendor_network, compute_network_metrics, detect_clusters, get_network_summary
from modules.pricing import compute_tender_price_stats, compute_zscore_anomalies, compute_price_risk, get_pricing_summary
from modules.winner_analysis import compute_win_rates, detect_dominant_winners, get_winner_summary
from modules.scoring import compute_tender_risk_scores, compute_company_risk_scores, get_scoring_summary

# ─────────────────────────────────────────────
# PAGE CONFIG
# ─────────────────────────────────────────────
st.set_page_config(
    page_title="TenderLens AI — Procurement Intelligence",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────
# GLOBAL CSS
# ─────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

.main .block-container { padding-top: 1.5rem; padding-bottom: 1rem; max-width: 1400px; }

/* Header */
.tl-header {
    background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 16px; padding: 28px 36px; margin-bottom: 24px;
    position: relative; overflow: hidden;
}
.tl-header::before {
    content: ''; position: absolute; top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.08) 0%, transparent 60%);
}
.tl-header h1 {
    font-size: 2rem; font-weight: 800; margin: 0;
    background: linear-gradient(135deg, #3B82F6, #60A5FA, #93C5FD);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    position: relative;
}
.tl-header p {
    font-size: 0.9rem; color: #94A3B8; margin: 6px 0 0 0;
    position: relative;
}

/* Metric Cards */
.metric-card {
    background: linear-gradient(145deg, #1E293B, #0F172A);
    border: 1px solid rgba(59,130,246,0.15);
    border-radius: 14px; padding: 20px 24px;
    transition: all 0.3s ease;
}
.metric-card:hover { border-color: rgba(59,130,246,0.4); transform: translateY(-2px); }
.metric-card .label { font-size: 0.78rem; color: #64748B; text-transform: uppercase;
    letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; }
.metric-card .value { font-size: 2rem; font-weight: 800; margin: 0; }
.metric-card .delta { font-size: 0.8rem; margin-top: 4px; }

/* Risk Badges */
.risk-high { color: #FF4B4B; } .risk-med { color: #FFC857; } .risk-low { color: #2ECC71; }
.badge { display: inline-block; padding: 4px 14px; border-radius: 20px;
    font-weight: 600; font-size: 0.8rem; }
.badge-high { background: rgba(255,75,75,0.15); color: #FF4B4B; border: 1px solid rgba(255,75,75,0.3); }
.badge-med { background: rgba(255,200,87,0.15); color: #FFC857; border: 1px solid rgba(255,200,87,0.3); }
.badge-low { background: rgba(46,204,113,0.15); color: #2ECC71; border: 1px solid rgba(46,204,113,0.3); }

/* Section Cards */
.section-card {
    background: linear-gradient(145deg, #1E293B, #141B2D);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 24px; margin-bottom: 16px;
}
.section-card h3 { color: #E2E8F0; font-size: 1.1rem; font-weight: 700; margin: 0 0 16px 0; }

/* Insight Box */
.insight-box {
    background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(96,165,250,0.05));
    border-left: 4px solid #3B82F6;
    border-radius: 0 12px 12px 0; padding: 16px 20px;
    margin: 12px 0; font-size: 0.9rem; color: #CBD5E1;
}

/* Trust Labels */
.trust-label {
    display: inline-block; padding: 3px 10px; border-radius: 6px;
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.5px;
    background: rgba(59,130,246,0.1); color: #60A5FA;
    border: 1px solid rgba(59,130,246,0.2);
}

/* Conclusion Card */
.conclusion-card {
    background: linear-gradient(145deg, #1E293B, #0F172A);
    border: 1px solid rgba(59,130,246,0.2);
    border-radius: 16px; padding: 28px;
}

/* Tabs */
.stTabs [data-baseweb="tab-list"] { gap: 8px; }
.stTabs [data-baseweb="tab"] {
    border-radius: 10px 10px 0 0; padding: 10px 20px;
    font-weight: 600; font-size: 0.85rem;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0F172A, #1E293B);
}
section[data-testid="stSidebar"] .stSelectbox label,
section[data-testid="stSidebar"] .stDateInput label {
    color: #94A3B8; font-weight: 600; font-size: 0.8rem;
    text-transform: uppercase; letter-spacing: 0.5px;
}
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────
@st.cache_data
def get_all_data():
    df = load_data()
    scoring = get_scoring_summary(df)
    return df, scoring

df_raw, scoring_summary = get_all_data()

# ─────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style="text-align:center;padding:16px 0 8px 0;">
        <span style="font-size:2.2rem;">🏛️</span>
        <h2 style="margin:4px 0;font-weight:800;background:linear-gradient(135deg,#3B82F6,#60A5FA);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;">TenderLens AI</h2>
        <p style="font-size:0.75rem;color:#64748B;margin:0;">Procurement Intelligence Platform</p>
    </div>
    <hr style="border-color:rgba(255,255,255,0.06);margin:12px 0;">
    """, unsafe_allow_html=True)

    departments = ["All"] + sorted(df_raw["department"].unique().tolist())
    sel_dept = st.selectbox("🏛️ Department", departments, index=0)

    categories = ["All"] + sorted(df_raw["category"].unique().tolist())
    sel_cat = st.selectbox("📦 Category", categories, index=0)

    df_raw["date"] = pd.to_datetime(df_raw["date"])
    min_date = df_raw["date"].min().date()
    max_date = df_raw["date"].max().date()
    date_range = st.date_input("📅 Date Range", value=(min_date, max_date), min_value=min_date, max_value=max_date)

    st.markdown("<hr style='border-color:rgba(255,255,255,0.06);margin:16px 0;'>", unsafe_allow_html=True)
    st.markdown("""
    <div style="text-align:center;padding:8px;">
        <span class="trust-label">Explainable AI</span>
        <span class="trust-label" style="margin-left:4px;">Early-Warning</span><br><br>
        <span class="trust-label">Regulatory Intelligence</span>
    </div>
    """, unsafe_allow_html=True)

# ── Apply Filters ──
df = df_raw.copy()
if sel_dept != "All":
    df = df[df["department"] == sel_dept]
if sel_cat != "All":
    df = df[df["category"] == sel_cat]
if len(date_range) == 2:
    df = df[(df["date"].dt.date >= date_range[0]) & (df["date"].dt.date <= date_range[1])]

if df.empty:
    st.warning("No data matches selected filters. Please adjust filters.")
    st.stop()

# Recompute scoring for filtered data
tender_risks = compute_tender_risk_scores(df)
company_risks = compute_company_risk_scores(df)

# ─────────────────────────────────────────────
# HEADER
# ─────────────────────────────────────────────
st.markdown("""
<div class="tl-header">
    <h1>🏛️ TenderLens AI</h1>
    <p>Early-Warning Procurement Intelligence • Collusion Detection • Market Fairness Analysis</p>
</div>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────
# NAVIGATION TABS
# ─────────────────────────────────────────────
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Executive Dashboard",
    "🕸️ Vendor Network",
    "💰 Price Intelligence",
    "📋 Tender Conclusion",
    "⚡ Live Simulator"
])

# ═══════════════════════════════════════════════
# TAB 1 — EXECUTIVE INTELLIGENCE DASHBOARD
# ═══════════════════════════════════════════════
with tab1:
    # KPI Cards
    n_tenders = len(tender_risks)
    n_high = len(tender_risks[tender_risks["risk_label"] == "High"])
    avg_fairness = tender_risks["fairness_score"].mean()
    n_dominant = len(company_risks[company_risks["risk_label"] == "High"])

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown(f"""<div class="metric-card">
            <div class="label">Total Tenders Monitored</div>
            <div class="value" style="color:#3B82F6;">{n_tenders}</div>
            <div class="delta" style="color:#64748B;">Filtered results</div>
        </div>""", unsafe_allow_html=True)
    with c2:
        st.markdown(f"""<div class="metric-card">
            <div class="label">High-Risk Tenders</div>
            <div class="value risk-high">{n_high}</div>
            <div class="delta risk-high">🔴 Needs Attention</div>
        </div>""", unsafe_allow_html=True)
    with c3:
        st.markdown(f"""<div class="metric-card">
            <div class="label">Avg Fairness Score</div>
            <div class="value" style="color:{risk_color(100-avg_fairness)};">{avg_fairness:.1f}</div>
            <div class="delta" style="color:#64748B;">Out of 100</div>
        </div>""", unsafe_allow_html=True)
    with c4:
        st.markdown(f"""<div class="metric-card">
            <div class="label">Dominant Vendor Alerts</div>
            <div class="value risk-med">{n_dominant}</div>
            <div class="delta risk-med">🟡 Vendors flagged</div>
        </div>""", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Charts Row
    col_left, col_right = st.columns(2)

    with col_left:
        st.markdown('<div class="section-card"><h3>📊 Risk Distribution</h3>', unsafe_allow_html=True)
        dist = tender_risks["risk_label"].value_counts().reset_index()
        dist.columns = ["Risk Level", "Count"]
        color_map = {"High": COLOR_HIGH_RISK, "Medium": COLOR_MEDIUM_RISK, "Low": COLOR_LOW_RISK}
        fig_donut = px.pie(dist, values="Count", names="Risk Level", hole=0.55,
                           color="Risk Level", color_discrete_map=color_map)
        fig_donut.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0", family="Inter"), height=340,
            margin=dict(t=20, b=20, l=20, r=20),
            legend=dict(orientation="h", yanchor="bottom", y=-0.15, xanchor="center", x=0.5)
        )
        st.plotly_chart(fig_donut, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col_right:
        st.markdown('<div class="section-card"><h3>📈 Fairness Score Trend</h3>', unsafe_allow_html=True)
        trend = tender_risks.sort_values("date")
        trend["rolling_fairness"] = trend["fairness_score"].rolling(window=5, min_periods=1).mean()
        fig_trend = go.Figure()
        fig_trend.add_trace(go.Scatter(
            x=trend["date"], y=trend["rolling_fairness"],
            mode="lines+markers", name="Fairness Score",
            line=dict(color="#3B82F6", width=3), marker=dict(size=5),
            fill="tozeroy", fillcolor="rgba(59,130,246,0.1)"
        ))
        fig_trend.add_hline(y=70, line_dash="dash", line_color=COLOR_LOW_RISK, annotation_text="Good", annotation_position="right")
        fig_trend.add_hline(y=40, line_dash="dash", line_color=COLOR_HIGH_RISK, annotation_text="Alert", annotation_position="right")
        fig_trend.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0", family="Inter"), height=340,
            margin=dict(t=20, b=40, l=40, r=40),
            xaxis=dict(gridcolor="rgba(255,255,255,0.05)"),
            yaxis=dict(gridcolor="rgba(255,255,255,0.05)", range=[0, 100]),
            showlegend=False
        )
        st.plotly_chart(fig_trend, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # Top Risky Vendors Table
    st.markdown('<div class="section-card"><h3>🚨 Top Risky Vendors</h3>', unsafe_allow_html=True)
    top_risky = company_risks.head(8)[["company_name", "avg_risk_score", "tenders_won", "risk_label"]].copy()
    top_risky.columns = ["Vendor", "Avg Risk Score", "Tenders Won", "Risk"]

    def color_risk(val):
        colors = {"High": f"color:{COLOR_HIGH_RISK};font-weight:700", "Medium": f"color:{COLOR_MEDIUM_RISK};font-weight:700", "Low": f"color:{COLOR_LOW_RISK};font-weight:700"}
        return colors.get(val, "")

    styled = top_risky.style.applymap(color_risk, subset=["Risk"]).format({"Avg Risk Score": "{:.1f}"})
    st.dataframe(styled, use_container_width=True, hide_index=True, height=320)
    st.markdown('</div>', unsafe_allow_html=True)


# ═══════════════════════════════════════════════
# TAB 2 — VENDOR NETWORK INTELLIGENCE
# ═══════════════════════════════════════════════
with tab2:
    st.markdown("""<div class="section-card">
        <h3>🕸️ Hidden Vendor Relationship Map</h3>
        <span class="trust-label">Network Intelligence</span>
        <span class="trust-label" style="margin-left:6px;">Early-Warning Signal</span>
    </div>""", unsafe_allow_html=True)

    net_summary = get_network_summary(df)
    G = net_summary["graph"]
    communities = net_summary["communities"]
    net_metrics = net_summary["metrics"]

    # KPIs
    nc1, nc2, nc3, nc4 = st.columns(4)
    with nc1:
        st.metric("Vendors Mapped", net_summary["n_nodes"])
    with nc2:
        st.metric("Relationships", net_summary["n_edges"])
    with nc3:
        st.metric("Communities", net_summary["n_communities"])
    with nc4:
        st.metric("Avg Connections", f"{net_summary['avg_degree']:.1f}")

    # Network Graph with Plotly
    if len(G.nodes) > 0:
        pos = nx.spring_layout(G, k=2.5, iterations=50, seed=42)

        # Assign community colors
        node_community = {}
        community_colors = px.colors.qualitative.Set2
        for idx, comm in enumerate(communities):
            for node in comm:
                node_community[node] = idx

        # Build network risk map for sizing
        nrisk_map = {}
        if not net_metrics.empty:
            nrisk_map = net_metrics.set_index("company_id")["degree_centrality"].to_dict()

        edge_x, edge_y = [], []
        for u, v in G.edges():
            x0, y0 = pos[u]
            x1, y1 = pos[v]
            edge_x += [x0, x1, None]
            edge_y += [y0, y1, None]

        edge_trace = go.Scatter(x=edge_x, y=edge_y, mode="lines",
            line=dict(width=1, color="rgba(100,116,139,0.3)"), hoverinfo="none")

        node_x, node_y, node_text, node_color, node_size = [], [], [], [], []
        for node in G.nodes():
            x, y = pos[node]
            node_x.append(x); node_y.append(y)
            name = G.nodes[node].get("name", node)
            centrality = nrisk_map.get(node, 0)
            comm_idx = node_community.get(node, 0)
            node_text.append(f"<b>{name}</b><br>Centrality: {centrality:.3f}<br>Connections: {G.degree(node)}")
            node_color.append(community_colors[comm_idx % len(community_colors)])
            node_size.append(max(15, centrality * 80 + 15))

        node_trace = go.Scatter(x=node_x, y=node_y, mode="markers+text",
            marker=dict(size=node_size, color=node_color, line=dict(width=2, color="#0F172A")),
            text=[G.nodes[n].get("name", n)[:12] for n in G.nodes()],
            textposition="top center", textfont=dict(size=9, color="#94A3B8"),
            hovertext=node_text, hoverinfo="text")

        fig_net = go.Figure(data=[edge_trace, node_trace])
        fig_net.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0", family="Inter"), height=550,
            margin=dict(t=10, b=10, l=10, r=10), showlegend=False,
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        )
        st.plotly_chart(fig_net, use_container_width=True)

    # Network metrics table
    if not net_metrics.empty:
        st.markdown('<div class="section-card"><h3>📊 Vendor Centrality Metrics</h3>', unsafe_allow_html=True)
        display_net = net_metrics.sort_values("degree_centrality", ascending=False).head(10)
        display_net = display_net[["company_name", "degree_centrality", "betweenness_centrality", "connections"]]
        display_net.columns = ["Vendor", "Degree Centrality", "Betweenness", "Connections"]
        st.dataframe(display_net, use_container_width=True, hide_index=True)
        st.markdown('</div>', unsafe_allow_html=True)


# ═══════════════════════════════════════════════
# TAB 3 — PRICE INTELLIGENCE
# ═══════════════════════════════════════════════
with tab3:
    st.markdown("""<div class="section-card">
        <h3>💰 Price Intelligence & Anomaly Detection</h3>
        <span class="trust-label">Explainable AI</span>
    </div>""", unsafe_allow_html=True)

    pricing_summary = get_pricing_summary(df)
    t_stats = pricing_summary["tender_stats"]
    zscore_data = pricing_summary["zscore_data"]

    # KPIs
    pc1, pc2, pc3 = st.columns(3)
    with pc1:
        st.metric("Low Variance Tenders", pricing_summary["n_low_variance"])
    with pc2:
        st.metric("Outlier Bids Detected", pricing_summary["n_outlier_bids"])
    with pc3:
        st.metric("Avg Price Risk", f"{pricing_summary['avg_price_risk']:.2f}")

    # Low variance alert
    if pricing_summary["n_low_variance"] > 0:
        st.markdown(f"""<div class="insight-box">
            ⚠️ <b>AI Alert:</b> {pricing_summary['n_low_variance']} tender(s) show unusually tight bid clustering
            (CV < 3%). This may indicate coordinated bidding behavior. Manual review recommended.
        </div>""", unsafe_allow_html=True)

    col_p1, col_p2 = st.columns(2)

    with col_p1:
        st.markdown('<div class="section-card"><h3>📉 Bid vs Estimated Value</h3>', unsafe_allow_html=True)
        scatter_df = df[df["winner"] == 1].copy()
        fig_scatter = px.scatter(scatter_df, x="estimated_value", y="bid_amount",
            color=scatter_df["bid_amount"] / scatter_df["estimated_value"],
            color_continuous_scale=["#2ECC71", "#FFC857", "#FF4B4B"],
            hover_data=["tender_id", "company_name"],
            labels={"estimated_value": "Estimated Value (₹)", "bid_amount": "Winning Bid (₹)"})
        fig_scatter.add_trace(go.Scatter(x=[scatter_df["estimated_value"].min(), scatter_df["estimated_value"].max()],
            y=[scatter_df["estimated_value"].min(), scatter_df["estimated_value"].max()],
            mode="lines", line=dict(dash="dash", color="#64748B"), name="1:1 Line"))
        fig_scatter.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0", family="Inter"), height=400,
            margin=dict(t=20, b=40, l=40, r=20),
            xaxis=dict(gridcolor="rgba(255,255,255,0.05)"),
            yaxis=dict(gridcolor="rgba(255,255,255,0.05)"))
        st.plotly_chart(fig_scatter, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col_p2:
        st.markdown('<div class="section-card"><h3>📊 Price Spread per Tender</h3>', unsafe_allow_html=True)
        spread_df = t_stats.sort_values("bid_spread_pct", ascending=True).tail(20)
        fig_spread = px.bar(spread_df, x="bid_spread_pct", y="tender_id", orientation="h",
            color="low_variance_flag",
            color_discrete_map={True: COLOR_HIGH_RISK, False: COLOR_PRIMARY},
            labels={"bid_spread_pct": "Bid Spread (%)", "tender_id": "Tender"})
        fig_spread.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0", family="Inter"), height=400,
            margin=dict(t=20, b=40, l=80, r=20), showlegend=False,
            xaxis=dict(gridcolor="rgba(255,255,255,0.05)"),
            yaxis=dict(gridcolor="rgba(255,255,255,0.05)"))
        st.plotly_chart(fig_spread, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # Z-Score highlights
    st.markdown('<div class="section-card"><h3>🎯 Z-Score Outlier Highlights</h3>', unsafe_allow_html=True)
    outliers = zscore_data[zscore_data["is_outlier"]].head(10)
    if not outliers.empty:
        display_out = outliers[["tender_id", "company_name", "bid_amount", "z_score"]].copy()
        display_out.columns = ["Tender", "Company", "Bid Amount", "Z-Score"]
        display_out["Z-Score"] = display_out["Z-Score"].round(2)
        st.dataframe(display_out, use_container_width=True, hide_index=True)
    else:
        st.info("No significant Z-score outliers detected in current filter selection.")
    st.markdown('</div>', unsafe_allow_html=True)


# ═══════════════════════════════════════════════
# TAB 4 — TENDER CONCLUSION PANEL
# ═══════════════════════════════════════════════
with tab4:
    st.markdown("""<div class="section-card">
        <h3>📋 Tender Conclusion Panel</h3>
        <span class="trust-label">Regulatory Intelligence</span>
        <span class="trust-label" style="margin-left:6px;">Executive Summary</span>
    </div>""", unsafe_allow_html=True)

    tender_list = tender_risks["tender_id"].tolist()
    selected_tender = st.selectbox("Select Tender for Detailed Assessment", tender_list)

    if selected_tender:
        t_row = tender_risks[tender_risks["tender_id"] == selected_tender].iloc[0]
        fs = t_row["fairness_score"]
        rs = t_row["risk_score"]
        rl = t_row["risk_label"]

        badge_cls = "badge-high" if rl == "High" else ("badge-med" if rl == "Medium" else "badge-low")

        # Fairness Gauge
        col_g1, col_g2 = st.columns([1, 1])
        with col_g1:
            fig_gauge = go.Figure(go.Indicator(
                mode="gauge+number", value=fs, title={"text": "Fairness Score", "font": {"size": 18, "color": "#E2E8F0"}},
                gauge={
                    "axis": {"range": [0, 100], "tickcolor": "#64748B"},
                    "bar": {"color": risk_color(rs)},
                    "bgcolor": "#1E293B",
                    "steps": [
                        {"range": [0, 40], "color": "rgba(255,75,75,0.15)"},
                        {"range": [40, 70], "color": "rgba(255,200,87,0.15)"},
                        {"range": [70, 100], "color": "rgba(46,204,113,0.15)"}
                    ],
                    "threshold": {"line": {"color": "#E2E8F0", "width": 3}, "thickness": 0.8, "value": fs}
                },
                number={"font": {"size": 48, "color": risk_color(rs)}}
            ))
            fig_gauge.update_layout(paper_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0", family="Inter"),
                height=280, margin=dict(t=60, b=20, l=40, r=40))
            st.plotly_chart(fig_gauge, use_container_width=True)

        with col_g2:
            st.markdown(f"""<div class="conclusion-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <span style="font-size:1.1rem;font-weight:700;color:#E2E8F0;">📋 {selected_tender}</span>
                    <span class="badge {badge_cls}">{"🔴" if rl=="High" else ("🟡" if rl=="Medium" else "🟢")} {rl} Risk</span>
                </div>
                <p style="color:#94A3B8;font-size:0.85rem;">
                    <b>Winner:</b> {t_row['company_name']}<br>
                    <b>Category:</b> {t_row['category']}<br>
                    <b>Department:</b> {t_row['department']}<br>
                    <b>Bid Amount:</b> ₹{t_row['bid_amount']:,.0f}<br>
                    <b>HHI:</b> {t_row['hhi_label']}
                </p>
            </div>""", unsafe_allow_html=True)

        # Risk breakdown bars
        st.markdown('<div class="section-card"><h3>📊 Risk Factor Breakdown</h3>', unsafe_allow_html=True)
        factors = pd.DataFrame({
            "Factor": ["Market Concentration (HHI)", "Network Risk", "Price Risk", "Winner Dominance"],
            "Score": [t_row["hhi_risk"]*100, t_row["network_risk"]*100, t_row["price_risk"]*100, t_row["winner_risk"]*100],
            "Weight": ["30%", "25%", "25%", "20%"]
        })
        fig_bars = px.bar(factors, x="Score", y="Factor", orientation="h",
            color="Score", color_continuous_scale=["#2ECC71", "#FFC857", "#FF4B4B"],
            range_color=[0, 100], text="Weight")
        fig_bars.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0", family="Inter"), height=250,
            margin=dict(t=10, b=20, l=10, r=10), showlegend=False,
            xaxis=dict(gridcolor="rgba(255,255,255,0.05)", range=[0, 100]),
            yaxis=dict(gridcolor="rgba(255,255,255,0.05)"))
        st.plotly_chart(fig_bars, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

        # AI Remark
        remark = generate_ai_remark(rs, t_row["hhi_label"], t_row["price_risk"], t_row["network_risk"])
        st.markdown(f"""<div class="insight-box">
            <b>🧠 AI-Generated Assessment:</b><br><br>{remark}
        </div>""", unsafe_allow_html=True)


# ═══════════════════════════════════════════════
# TAB 5 — LIVE BIDDING SIMULATOR
# ═══════════════════════════════════════════════
with tab5:
    st.markdown("""<div class="section-card">
        <h3>⚡ Real-Time Procurement Monitoring Simulation</h3>
        <span class="trust-label">Live Demo</span>
        <span class="trust-label" style="margin-left:6px;">Early-Warning Signal</span>
    </div>""", unsafe_allow_html=True)

    st.markdown("""<div class="insight-box">
        🎯 <b>Simulation Mode:</b> Select a tender below to simulate real-time bid submissions.
        Watch as the Fairness Score and risk indicators update dynamically.
    </div>""", unsafe_allow_html=True)

    sim_tender = st.selectbox("Select Tender to Simulate", tender_risks["tender_id"].tolist(), key="sim_tender")

    if st.button("🚀 Run Live Simulation", type="primary", use_container_width=True):
        sim_data = df[df["tender_id"] == sim_tender]
        bidders = sim_data[["company_id", "company_name", "bid_amount", "estimated_value"]].values.tolist()

        progress_bar = st.progress(0)
        status_area = st.empty()
        metric_area = st.empty()
        chart_area = st.empty()

        sim_bids = []
        est_val = bidders[0][3] if bidders else 1000000

        for i, (comp_id, comp_name, bid, est) in enumerate(bidders):
            time.sleep(0.6)
            # Add slight randomization
            sim_bid = bid * np.random.uniform(0.98, 1.02)
            sim_bids.append({"Vendor": comp_name, "Bid": sim_bid, "Estimated": est})

            progress_bar.progress((i + 1) / len(bidders))
            status_area.markdown(f"""<div class="insight-box">
                📡 <b>Bid Received:</b> {comp_name} submitted ₹{sim_bid:,.0f}
            </div>""", unsafe_allow_html=True)

            # Calculate running fairness
            bids_so_far = [b["Bid"] for b in sim_bids]
            cv = np.std(bids_so_far) / np.mean(bids_so_far) if np.mean(bids_so_far) > 0 else 0
            sim_fairness = min(100, max(0, cv * 500 + 30))
            sim_risk = 100 - sim_fairness

            mc1, mc2, mc3 = metric_area.columns(3)
            mc1.metric("Bids Received", f"{i+1}/{len(bidders)}")
            mc2.metric("Live Fairness Score", f"{sim_fairness:.0f}")
            mc3.metric("Risk Level", "High" if sim_risk > 70 else ("Medium" if sim_risk > 40 else "Low"))

            sim_df = pd.DataFrame(sim_bids)
            fig_sim = px.bar(sim_df, x="Vendor", y="Bid", color="Bid",
                color_continuous_scale=["#2ECC71", "#FFC857", "#FF4B4B"])
            fig_sim.add_hline(y=est_val, line_dash="dash", line_color="#3B82F6",
                annotation_text="Estimated Value")
            fig_sim.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#E2E8F0", family="Inter"), height=350,
                margin=dict(t=20, b=40, l=40, r=20),
                xaxis=dict(gridcolor="rgba(255,255,255,0.05)"),
                yaxis=dict(gridcolor="rgba(255,255,255,0.05)"))
            chart_area.plotly_chart(fig_sim, use_container_width=True)

        # Final result
        final_risk_level = "High" if sim_risk > 70 else ("Medium" if sim_risk > 40 else "Low")
        badge_cls = "badge-high" if final_risk_level == "High" else ("badge-med" if final_risk_level == "Medium" else "badge-low")
        st.markdown(f"""<div class="conclusion-card" style="text-align:center;margin-top:16px;">
            <h3 style="color:#E2E8F0;">Simulation Complete</h3>
            <p style="font-size:2rem;font-weight:800;color:{risk_color(sim_risk)};">{sim_fairness:.0f} / 100</p>
            <p style="color:#94A3B8;">Fairness Score</p>
            <span class="badge {badge_cls}">{final_risk_level} Risk</span>
        </div>""", unsafe_allow_html=True)


# ─────────────────────────────────────────────
# FOOTER
# ─────────────────────────────────────────────
st.markdown("""<hr style="border-color:rgba(255,255,255,0.06);margin-top:40px;">
<div style="text-align:center;padding:16px;color:#475569;font-size:0.8rem;">
    🔍 <b>TenderLens AI</b> v1.0 • Procurement Intelligence Platform •
    <span class="trust-label">Explainable AI</span>
    <span class="trust-label" style="margin-left:4px;">Regulatory Grade</span>
</div>""", unsafe_allow_html=True)
