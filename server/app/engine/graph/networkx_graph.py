import networkx as nx
import networkx.algorithms.community as nx_comm
import math

class GraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_node(self, file_path: str, metadata: dict):
        self.graph.add_node(file_path, **metadata)

    def add_edge(self, source: str, target: str):
        self.graph.add_edge(source, target)

    def calculate_metrics_and_positions(self) -> dict:
        """
        Calculates Centrality Score to flag core_nodes, 
        and runs Fruchterman-Reingold layout for 3D Spline coordinates.
        """
        # Centrality (Rank files by dependency weight)
        try:
            centrality = nx.eigenvector_centrality(self.graph, max_iter=1000)
        except:
            centrality = nx.degree_centrality(self.graph) # fallback if graph doesn't converge
        
        # Identify core nodes (top 15% most central files)
        threshold = 0
        if centrality:
            sorted_scores = sorted(centrality.values(), reverse=True)
            threshold_idx = max(0, int(len(sorted_scores) * 0.15) - 1)
            threshold = sorted_scores[threshold_idx] if sorted_scores else 0

        # Run Louvain Community Detection to group modules
        # Louvain works best on undirected graphs, so we convert a copy
        undirected_g = self.graph.to_undirected()
        try:
            # Requires networkx >= 2.6
            communities = nx_comm.louvain_communities(undirected_g)
        except Exception:
            # Fallback for old versions or disconnected graphs that might fail
            communities = []
            
        # Map nodes to a simple integer cluster_id
        cluster_map = {}
        for cluster_idx, comm in enumerate(communities):
            for node in comm:
                cluster_map[node] = cluster_idx

        # Run 3D Layout algorithms
        # We use networkx spring layout in 3 dimensions targeting spatial coordinates [x, y, z]
        pos_3d = nx.spring_layout(self.graph, dim=3, scale=500.0, seed=42)

        results = {}
        for node in self.graph.nodes:
            score = centrality.get(node, 0)
            coords = pos_3d.get(node, [0.0, 0.0, 0.0])
            c_id = cluster_map.get(node, 0)
            
            results[node] = {
                "centrality_score": round(score, 4),
                "is_core_node": bool(score >= threshold and score > 0),
                "cluster_id": c_id,
                "coordinates": {
                    "x": float(coords[0]),
                    "y": float(coords[1]),
                    "z": float(coords[2])
                }
            }

        return results
    
    def get_edges(self):
        return [{"source": u, "target": v, "weight": 1.0} for u, v in self.graph.edges]
