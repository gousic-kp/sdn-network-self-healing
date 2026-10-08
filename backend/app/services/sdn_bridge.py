import requests
from typing import Dict, Any, List
from app.core.config import settings
from app.services.sdn_simulator import sdn_simulator

class SDNBridge:
    """
    Bridge connecting backend to Ryu SDN Controller REST API.
    Provides seamless fallback to internal SDNSimulator when running standalone.
    """
    def __init__(self):
        self.ryu_url = f"http://{settings.RYU_CONTROLLER_HOST}:{settings.RYU_CONTROLLER_PORT}"

    def is_ryu_online(self) -> bool:
        if settings.SIMULATION_MODE:
            return False
        try:
            resp = requests.get(f"{self.ryu_url}/stats/switches", timeout=0.8)
            return resp.status_code == 200
        except Exception:
            return False

    def get_topology(self) -> Dict[str, Any]:
        if not self.is_ryu_online():
            return sdn_simulator.get_topology()
        try:
            switches_resp = requests.get(f"{self.ryu_url}/stats/switches").json()
            links_resp = requests.get(f"{self.ryu_url}/v1.0/topology/links").json()
            return {
                "switches": switches_resp,
                "links": links_resp,
                "active_path": sdn_simulator.active_path
            }
        except Exception:
            return sdn_simulator.get_topology()

    def get_flows(self) -> List[Dict[str, Any]]:
        if not self.is_ryu_online():
            return sdn_simulator.installed_flows
        try:
            flows = []
            for dpid in [1, 2, 3, 4]:
                resp = requests.get(f"{self.ryu_url}/stats/flow/{dpid}").json()
                flows.extend(resp.get(str(dpid), []))
            return flows
        except Exception:
            return sdn_simulator.installed_flows

    async def simulate_link_failure(self, link_id: str) -> Dict[str, Any]:
        return await sdn_simulator.simulate_link_failure(link_id)

    async def restore_link(self, link_id: str) -> Dict[str, Any]:
        return await sdn_simulator.restore_link(link_id)

sdn_bridge = SDNBridge()
