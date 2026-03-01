import networkx as nx

def build_and_analyze_graph(dependencies: list[tuple[str, str]]):
    """
    Builds the DAG, runs Force-Directed layout, and PageRank centrality.
    dependencies: list of (source_file, target_file)
    """
    G = nx.DiGraph()
    G.add_edges_from(dependencies)
    
    # 1. PageRank for Centrality (identifies foundational entry-point files)
    centrality = nx.pagerank(G, alpha=0.85)
    
    # 2. Force-Directed Layout for physical [x,y,z] spatial generation
    # NetworkX spring_layout mapped to 3 dimensions
    pos_3d = nx.spring_layout(G, dim=3, iterations=50)
    
    # 3. Cyclomatic complexity fallback based on in-degree dependencies
    in_degrees = dict(G.in_degree())
    
    nodes_data = []
    for node in G.nodes():
        coords = pos_3d[node]
        nodes_data.append({
            "id": node,
            "x": float(coords[0] * 200),  # Spread factor for Spline Canvas
            "y": float(coords[1] * 200),
            "z": float(coords[2] * 200),
            "centrality": centrality.get(node, 0),
            "complexity": in_degrees.get(node, 1) * 2.0,  
            "is_core": centrality.get(node, 0) > 0.05
        })
        
    edges_data = [{"source": u, "target": v} for u, v in G.edges()]
    return {"nodes": nodes_data, "edges": edges_data, "graph": G}
    
def get_blast_radius(G: nx.DiGraph, start_node: str):
    """ BFS/DFS Traversal to find the cascading breakage of a deleted file """
    if start_node not in G:
        return []
    # Reverse the DAG to traverse upwards to dependencies
    R = G.reverse(copy=False)
    descendants = list(nx.bfs_tree(R, start_node).nodes())
    descendants.remove(start_node)
    return descendants
