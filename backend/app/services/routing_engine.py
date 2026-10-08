import networkx as nx
from typing import List, Dict, Any, Tuple, Optional

class RoutingEngine:
    """
    SDN Routing Engine implementing Dijkstra's algorithm for finding optimal paths
    and generating OpenFlow 1.3 flow modification rules.
    """
    def __init__(self):
        self.graph = nx.DiGraph()
        self.init_topology()

    def init_topology(self):
        """Initializes default network topology graph."""
        self.graph.clear()
        
        # Nodes: Switches (S1..S4) and Hosts (H1, H2)
        nodes = ["H1", "S1", "S2", "S3", "S4", "H2"]
        for node in nodes:
            node_type = "host" if node.startswith("H") else "switch"
            self.graph.add_node(node, type=node_type, status="UP")

        # Port mapping for OpenFlow rules
        # Format: (u, v, weight, port_u, port_v)
        edges = [
            ("H1", "S1", 1, 1, 1),
            ("S1", "H1", 1, 1, 1),
            
            ("S1", "S2", 1, 2, 1),
            ("S2", "S1", 1, 1, 2),
            
            ("S1", "S3", 2, 3, 1),
            ("S3", "S1", 2, 1, 3),
            
            ("S2", "S4", 1, 2, 1),
            ("S4", "S2", 1, 1, 2),
            
            ("S3", "S4", 1, 2, 2),
            ("S4", "S3", 1, 2, 2),
            
            ("S4", "H2", 1, 3, 1),
            ("H2", "S4", 1, 1, 3),
        ]

        for u, v, weight, port_u, port_v in edges:
            self.graph.add_edge(
                u, v, 
                weight=weight, 
                port_out=port_u, 
                port_in=port_v, 
                status="UP", 
                bandwidth=1000,  # Mbps
                latency_ms=1.5
            )

    def set_link_status(self, u: str, v: str, status: str):
        """Sets link status (UP or DOWN) in bidirectional graph."""
        if self.graph.has_edge(u, v):
            self.graph[u][v]["status"] = status
        if self.graph.has_edge(v, u):
            self.graph[v][u]["status"] = status

    def get_available_graph(self) -> nx.DiGraph:
        """Returns a subgraph with only operational (UP) links and nodes."""
        active_graph = nx.DiGraph()
        for u in self.graph.nodes:
            if self.graph.nodes[u].get("status") == "UP":
                active_graph.add_node(u)
        for u, v, data in self.graph.edges(data=True):
            if data.get("status") == "UP" and active_graph.has_node(u) and active_graph.has_node(v):
                active_graph.add_edge(u, v, weight=data.get("weight", 1))
        return active_graph

    def compute_shortest_path(self, source: str = "H1", target: str = "H2") -> Tuple[Optional[List[str]], float]:
        """
        Uses Dijkstra's algorithm to compute shortest path considering only UP links.
        Returns (path_as_list_of_nodes, total_cost).
        """
        # Create operational subgraph
        active_graph = nx.DiGraph()
        for u in self.graph.nodes:
            if self.graph.nodes[u].get("status") == "UP":
                active_graph.add_node(u)

        for u, v, data in self.graph.edges(data=True):
            if data.get("status") == "UP" and active_graph.has_node(u) and active_graph.has_node(v):
                active_graph.add_edge(u, v, weight=data.get("weight", 1))

        try:
            path = nx.dijkstra_path(active_graph, source=source, target=target, weight="weight")
            cost = nx.dijkstra_path_length(active_graph, source=source, target=target, weight="weight")
            return path, float(cost)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None, float('inf')

    def generate_flow_rules(self, path: List[str], match_ip_src: str = "10.0.0.1", match_ip_dst: str = "10.0.0.2") -> List[Dict[str, Any]]:
        """
        Generates OpenFlow 1.3 flow rules for each switch along the path.
        """
        if not path or len(path) < 3:
            return []

        flow_rules = []
        
        # Forward rules (H1 -> H2)
        for i in range(1, len(path) - 1):
            curr_switch = path[i]
            prev_node = path[i - 1]
            next_node = path[i + 1]

            in_port = self.graph[curr_switch][prev_node]["port_out"]
            out_port = self.graph[curr_switch][next_node]["port_out"]

            flow_rules.append({
                "dpid": int(curr_switch.replace("S", "")),
                "switch_id": curr_switch,
                "table_id": 0,
                "priority": 100,
                "match": {
                    "in_port": in_port,
                    "eth_type": 2048,  # IPv4
                    "ipv4_src": match_ip_src,
                    "ipv4_dst": match_ip_dst
                },
                "actions": [f"OUTPUT:{out_port}"],
                "out_port": out_port,
                "direction": "FORWARD"
            })

        # Reverse rules (H2 -> H1)
        rev_path = list(reversed(path))
        for i in range(1, len(rev_path) - 1):
            curr_switch = rev_path[i]
            prev_node = rev_path[i - 1]
            next_node = rev_path[i + 1]

            in_port = self.graph[curr_switch][prev_node]["port_out"]
            out_port = self.graph[curr_switch][next_node]["port_out"]

            flow_rules.append({
                "dpid": int(curr_switch.replace("S", "")),
                "switch_id": curr_switch,
                "table_id": 0,
                "priority": 100,
                "match": {
                    "in_port": in_port,
                    "eth_type": 2048,  # IPv4
                    "ipv4_src": match_ip_dst,
                    "ipv4_dst": match_ip_src
                },
                "actions": [f"OUTPUT:{out_port}"],
                "out_port": out_port,
                "direction": "REVERSE"
            })

        return flow_rules
