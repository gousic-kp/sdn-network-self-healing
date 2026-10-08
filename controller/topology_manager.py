import logging
from typing import Dict, List, Tuple

logger = logging.getLogger("TopologyManager")

class TopologyManager:
    """
    Manages OpenFlow 1.3 switch topology state, port status mapping,
    and link adjacency.
    """
    def __init__(self):
        self.switches: Dict[int, object] = {}  # dpid -> datapath
        self.port_map: Dict[Tuple[int, int], Tuple[int, int]] = {}  # (dpid1, port1) -> (dpid2, port2)
        self.link_status: Dict[Tuple[int, int], str] = {}  # (dpid1, dpid2) -> "UP"/"DOWN"

    def register_switch(self, dpid: int, datapath):
        self.switches[dpid] = datapath
        logger.info(f"Switch registered: DPID {dpid}")

    def unregister_switch(self, dpid: int):
        if dpid in self.switches:
            del self.switches[dpid]
            logger.info(f"Switch unregistered: DPID {dpid}")

    def add_link(self, src_dpid: int, src_port: int, dst_dpid: int, dst_port: int):
        self.port_map[(src_dpid, src_port)] = (dst_dpid, dst_port)
        self.port_map[(dst_dpid, dst_port)] = (src_dpid, src_port)
        self.link_status[(src_dpid, dst_dpid)] = "UP"
        self.link_status[(dst_dpid, src_dpid)] = "UP"
        logger.info(f"Link added: S{src_dpid}:p{src_port} <--> S{dst_dpid}:p{dst_port}")

    def remove_link(self, src_dpid: int, dst_dpid: int):
        self.link_status[(src_dpid, dst_dpid)] = "DOWN"
        self.link_status[(dst_dpid, src_dpid)] = "DOWN"
        logger.warning(f"Link down: S{src_dpid} <--> S{dst_dpid}")
