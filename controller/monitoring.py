import logging
from eventlet import hub
from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import MAIN_DISPATCHER, DEAD_DISPATCHER, set_ev_cls
from ryu.lib import hub

logger = logging.getLogger("SDNMonitoring")

class SimpleMonitoring:
    """
    OpenFlow 1.3 Periodic Monitoring Handler for Port and Flow statistics.
    """
    def __init__(self, datapath):
        self.datapath = datapath

    def request_stats(self):
        ofproto = self.datapath.ofproto
        parser = self.datapath.ofproto_parser
        
        # Request Flow Stats
        req = parser.OFPFlowStatsRequest(self.datapath)
        self.datapath.send_msg(req)
        
        # Request Port Stats
        req_port = parser.OFPPortStatsRequest(self.datapath, 0, ofproto.OFPP_ANY)
        self.datapath.send_msg(req_port)
