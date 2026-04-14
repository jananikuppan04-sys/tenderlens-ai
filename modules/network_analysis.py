"""
TenderLens AI — Network Analysis Module
Builds vendor relationship graphs using NetworkX.
Detects hidden coordination through shared directors and co-bidding patterns.
"""

import pandas as pd
import numpy as np
import networkx as nx
from collections import defaultdict


def build_vendor_network(df: pd.DataFrame) -> nx.Graph:
    """
    Build a NetworkX graph where:
    - Nodes = companies
    - Edges connect companies that:
        1. Share directors
        2. Co-bid on the same tender
    Edge weight increases with frequency of co-occurrence.
    """
    G = nx.Graph()

    # ── Add all unique companies as nodes ──
    companies = df.drop_duplicates("company_id")[["company_id", "company_name"]].values
    for comp_id, comp_name in companies:
        G.add_node(comp_id, name=comp_name)

    # ── Edge Type 1: Shared Directors ──
    director_companies = defaultdict(set)
    for _, row in df.drop_duplicates(["company_id", "director_name"]).iterrows():
        director_companies[row["director_name"]].add(row["company_id"])

    for director, comp_set in director_companies.items():
        comp_list = list(comp_set)
        for i in range(len(comp_list)):
            for j in range(i + 1, len(comp_list)):
                if G.has_edge(comp_list[i], comp_list[j]):
                    G[comp_list[i]][comp_list[j]]["weight"] += 3  # Higher weight for director sharing
                    G[comp_list[i]][comp_list[j]]["shared_directors"].append(director)
                else:
                    G.add_edge(
                        comp_list[i], comp_list[j],
                        weight=3,
                        edge_type="shared_director",
                        shared_directors=[director]
                    )

    # ── Edge Type 2: Co-Bidding ──
    for tender_id, group in df.groupby("tender_id"):
        bidders = group["company_id"].unique().tolist()
        for i in range(len(bidders)):
            for j in range(i + 1, len(bidders)):
                if G.has_edge(bidders[i], bidders[j]):
                    G[bidders[i]][bidders[j]]["weight"] += 1
                    G[bidders[i]][bidders[j]]["co_bids"] = (
                        G[bidders[i]][bidders[j]].get("co_bids", 0) + 1
                    )
                else:
                    G.add_edge(
                        bidders[i], bidders[j],
                        weight=1,
                        edge_type="co_bid",
                        co_bids=1,
                        shared_directors=[]
                    )

    return G


def compute_network_metrics(G: nx.Graph) -> pd.DataFrame:
    """
    Compute network centrality metrics for each vendor node.
    """
    if len(G.nodes) == 0:
        return pd.DataFrame()

    degree_cent = nx.degree_centrality(G)
    betweenness = nx.betweenness_centrality(G, weight="weight")
    closeness = nx.closeness_centrality(G)

    metrics = []
    for node in G.nodes:
        metrics.append({
            "company_id": node,
            "company_name": G.nodes[node].get("name", node),
            "degree_centrality": round(degree_cent.get(node, 0), 4),
            "betweenness_centrality": round(betweenness.get(node, 0), 4),
            "closeness_centrality": round(closeness.get(node, 0), 4),
            "connections": G.degree(node),
        })

    return pd.DataFrame(metrics)


def detect_clusters(G: nx.Graph) -> list:
    """
    Detect suspicious clusters/communities using greedy modularity.
    Returns list of sets, each set is a community.
    """
    if len(G.nodes) < 2:
        return []

    try:
        from networkx.algorithms.community import greedy_modularity_communities
        communities = list(greedy_modularity_communities(G, weight="weight"))
        return communities
    except Exception:
        # Fallback: connected components
        return list(nx.connected_components(G))


def compute_network_risk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute a normalized network risk score per company.
    High degree centrality + shared directors = higher risk.
    """
    G = build_vendor_network(df)
    metrics = compute_network_metrics(G)

    if metrics.empty:
        return pd.DataFrame(columns=["company_id", "company_name", "network_risk"])

    # Composite network risk: weighted combination of centrality metrics
    metrics["network_risk"] = (
        0.5 * metrics["degree_centrality"] +
        0.3 * metrics["betweenness_centrality"] +
        0.2 * metrics["closeness_centrality"]
    )

    # Normalize to 0–1
    max_risk = metrics["network_risk"].max()
    min_risk = metrics["network_risk"].min()
    if max_risk != min_risk:
        metrics["network_risk"] = (metrics["network_risk"] - min_risk) / (max_risk - min_risk)
    else:
        metrics["network_risk"] = 0.5

    return metrics


def get_network_summary(df: pd.DataFrame) -> dict:
    """
    Return a summary of network analysis results.
    """
    G = build_vendor_network(df)
    metrics = compute_network_metrics(G)
    communities = detect_clusters(G)

    return {
        "graph": G,
        "metrics": metrics,
        "communities": communities,
        "n_nodes": len(G.nodes),
        "n_edges": len(G.edges),
        "n_communities": len(communities),
        "avg_degree": np.mean([d for _, d in G.degree()]) if len(G.nodes) > 0 else 0,
    }
