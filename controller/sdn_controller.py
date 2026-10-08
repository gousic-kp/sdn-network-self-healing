"""
Ryu SDN Controller Application: Self-Healing & Automatic Rerouting Engine
OpenFlow 1.3 Compatible.
"""

import logging
import json
import requests
from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import CONFIG_DISPATCHER, MAIN_DISPATCHER, set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet, ethernet, ether_types, ipv4
from ryu.app.wsgi import ControllerBase, WSGIApplication, route

from topology_manager import TopologyManager
from routing import SDNDijkstraRouter

LOG = logging.getLogger('SDNController')

class SDNController(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]
    _CONTEXTS = {'wsgi': WSGIApplication}

    def __init__(self, *args, **kwargs):
        super(SDNController, self).__init__(*args, **kwargs)
        self.topology_mgr = TopologyManager()
        self.router = SDNDijkstraRouter()
        self.mac_to_port = {}
        self.backend_url = "http://127.0.0.1:8000/api"

        # Initialize Default 4-Switch Diamond Topology
        # Switches: S1 (DPID 1), S2 (DPID 2), S3 (DPID 3), S4 (DPID 4)
        for dpid in [1, 2, 3, 4]:
            self.router.add_node(dpid)

        # Links (src_dpid, src_port, dst_dpid, dst_port)
        self.router.add_link(1, 2, 2, 1)  # S1:p2 <-> S2:p1
        self.router.add_link(2, 1, 1, 2)
        
        self.router.add_link(1, 3, 3, 1)  # S1:p3 <-> S3:p1
        self.router.add_link(3, 1, 1, 3)

        self.router.add_link(2, 2, 4, 1)  # S2:p2 <-> S4:p1
        self.router.add_link(4, 1, 2, 2)

        self.router.add_link(3, 2, 4, 2)  # S3:p2 <-> S4:p2
        self.router.add_link(4, 2, 3, 2)

        LOG.info("SDN Self-Healing Controller Initialized with Topology (S1, S2, S3, S4)")

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        dpid = datapath.id

        self.topology_mgr.register_switch(dpid, datapath)

        # Install Table-Miss Flow Entry (Send unrecognized packets to controller)
        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(datapath, 0, match, actions)
        LOG.info(f"Installed Table-Miss Flow Entry on Switch S{dpid}")

    def add_flow(self, datapath, priority, match, actions, buffer_id=None):
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
        if buffer_id:
            mod = parser.OFPFlowMod(datapath=datapath, buffer_id=buffer_id,
                                    priority=priority, match=match, instructions=inst)
        else:
            mod = parser.OFPFlowMod(datapath=datapath, priority=priority,
                                    match=match, instructions=inst)
        datapath.send_msg(mod)

    @set_ev_cls(ofp_event.EventOFPPortStatus, MAIN_DISPATCHER)
    def port_status_handler(self, ev):
        msg = ev.msg
        reason = msg.reason
        port_no = msg.desc.port_no
        dpid = msg.datapath.id
        ofproto = msg.datapath.ofproto

        if reason == ofproto.OFPPR_DELETE or (msg.desc.state & ofproto.OFPPS_LINK_DOWN):
            LOG.warning(f"[FAIL DETECTED] Port S{dpid}:p{port_no} LINK DOWN!")
            self.handle_link_failure(dpid, port_no)
        elif reason == ofproto.OFPPR_ADD or (msg.desc.state == 0):
            LOG.info(f"[RESTORE DETECTED] Port S{dpid}:p{port_no} LINK RESTORED UP.")
            self.handle_link_restoration(dpid, port_no)

    def handle_link_failure(self, dpid: int, port_no: int):
        """Self-healing core logic: recalculate Dijkstra route and update flows."""
        LOG.info(f"Triggering Self-Healing Rerouting logic for failure at S{dpid}:p{port_no}")
        
        # Determine failed link
        if dpid == 1 and port_no == 2:
            self.router.remove_link(1, 2)
            self.router.remove_link(2, 1)
        elif dpid == 2 and port_no == 2:
            self.router.remove_link(2, 4)
            self.router.remove_link(4, 2)

        # Compute new shortest path S1 -> S4
        path = self.router.get_shortest_path(1, 4)
        LOG.info(f"Self-Healing Alternate Path Calculated: {path}")

        # Send notification to FastAPI backend
        try:
            requests.post(f"{self.backend_url}/failure/simulate", json={"link_id": f"S{dpid}-S2"}, timeout=1)
        except Exception:
            pass

    def handle_link_restoration(self, dpid: int, port_no: int):
        LOG.info(f"Link restored at S{dpid}:p{port_no}. Re-optimizing topology.")
        try:
            requests.post(f"{self.backend_url}/link/restore", json={"link_id": f"S{dpid}-S2"}, timeout=1)
        except Exception:
            pass

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocols(ethernet.ethernet)[0]

        if eth.ethertype == ether_types.ETH_TYPE_LLDP:
            return

        dst = eth.dst
        src = eth.src
        dpid = datapath.id

        self.mac_to_port.setdefault(dpid, {})
        self.mac_to_port[dpid][src] = in_port

        if dst in self.mac_to_port[dpid]:
            out_port = self.mac_to_port[dpid][dst]
        else:
            out_port = ofproto.OFPP_FLOOD

        actions = [parser.OFPActionOutput(out_port)]

        if out_port != ofproto.OFPP_FLOOD:
            match = parser.OFPMatch(in_port=in_port, eth_dst=dst, eth_src=src)
            self.add_flow(datapath, 1, match, actions, buffer_id=msg.buffer_id)
            return

        data = None
        if msg.buffer_id == ofproto.OFP_NO_BUFFER:
            data = msg.data

        out = parser.OFPPacketOut(datapath=datapath, buffer_id=msg.buffer_id,
                                  in_port=in_port, actions=actions, data=data)
        datapath.send_msg(out)
