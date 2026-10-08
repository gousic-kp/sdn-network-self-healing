import networkx as nx
from typing import List, Tuple, Optional

class SDNDijkstraRouter:
    """
    Ryu Controller Dijkstra Shortest Path Router.
    Computes optimal forwarding paths based on link operational states.
    """
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_node(self, dpid: int):
        self.graph.add_node(dpid)

    def add_link(self, src_dpid: int, src_port: int, dst_dpid: int, dst_port: int, weight: int = 1):
        self.graph.add_edge(src_dpid, dst_dpid, src_port=src_port, dst_port=dst_port, weight=weight, status="UP")

    def remove_link(self, src_dpid: int, dst_dpid: int):
        if self.graph.has_edge(src_dpid, dst_dpid):
            self.graph.remove_edge(src_dpid, dst_dpid)

    def get_shortest_path(self, src_dpid: int, dst_dpid: int) -> Optional[List[int]]:
        try:
            return nx.dijkstra_path(self.graph, src_dpid, dst_dpid, weight="weight")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None
