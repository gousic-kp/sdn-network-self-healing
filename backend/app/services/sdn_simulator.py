import time
import datetime
import random
import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.routing_engine import RoutingEngine
from app.db.database import SessionLocal
from app.db.models import NetworkEventModel, FailureEventModel, TrafficStatModel, ReroutingHistoryModel

class SDNSimulator:
    """
    Core SDN Network Simulation & Self-Healing Engine.
    Tracks network topology, link failure events, OpenFlow flow table rules,
    and conducts real-time traffic statistics simulation.
    """
    def __init__(self):
        self.routing_engine = RoutingEngine()
        self.active_path: List[str] = ["H1", "S1", "S2", "S4", "H2"]
        self.preferred_primary_path: List[str] = ["H1", "S1", "S2", "S4", "H2"]
        self.link_statuses: Dict[str, str] = {
            "H1-S1": "UP",
            "S1-S2": "UP",
            "S1-S3": "UP",
            "S2-S4": "UP",
            "S3-S4": "UP",
            "S4-H2": "UP"
        }
        self.installed_flows: List[Dict[str, Any]] = []
        self.total_failures = 0
        self.total_recoveries = 0
        self.failed_recovery_attempts = 0
        self.recovery_times: List[float] = []
        self.network_status = "HEALTHY"  # HEALTHY, REROUTING, DEGRADED, CRITICAL
        self.last_failure_event: Optional[Dict[str, Any]] = None
        self.current_traffic = {
            "bytes_per_sec": 450000.0,
            "packets_per_sec": 380.0,
            "bandwidth_util_pct": 36.4,
            "packet_loss_pct": 0.0,
            "latency_ms": 1.4,
            "active_flows": 12
        }
        self._listeners = []
        self._recalculate_flows()
        self._seed_initial_events()

    def register_listener(self, callback):
        self._listeners.append(callback)

    async def notify_listeners(self, event_type: str, data: Dict[str, Any]):
        for listener in self._listeners:
            try:
                if asyncio.iscoroutinefunction(listener):
                    await listener(event_type, data)
                else:
                    listener(event_type, data)
            except Exception as e:
                print(f"[SDNSimulator] Listener error: {e}")

    def _seed_initial_events(self):
        """Populates initial database events if database is empty."""
        try:
            from app.db.database import engine, Base
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                count = db.query(NetworkEventModel).count()
                if count == 0:
                    evt = NetworkEventModel(
                        level="INFO",
                        event_type="SYSTEM_INIT",
                        source="RyuController",
                        message="Ryu SDN Controller initialized with OpenFlow 1.3 switch topology",
                        details={"switches": ["S1", "S2", "S3", "S4"], "hosts": ["H1", "H2"]}
                    )
                    db.add(evt)
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[SDNSimulator] Initial DB seed notice: {e}")

    def _recalculate_flows(self):
        """Computes flow rules based on active path."""
        self.installed_flows = self.routing_engine.generate_flow_rules(self.active_path)

    def get_topology(self) -> Dict[str, Any]:
        """Returns visual topology graph state with node and link metadata."""
        nodes = [
            {"id": "H1", "label": "Host H1 (10.0.0.1)", "type": "host", "ip": "10.0.0.1", "status": "UP", "x": 100, "y": 300},
            {"id": "S1", "label": "Switch S1", "type": "switch", "dpid": 1, "status": "UP", "x": 300, "y": 300},
            {"id": "S2", "label": "Switch S2", "type": "switch", "dpid": 2, "status": "UP", "x": 500, "y": 150},
            {"id": "S3", "label": "Switch S3", "type": "switch", "dpid": 3, "status": "UP", "x": 500, "y": 450},
            {"id": "S4", "label": "Switch S4", "type": "switch", "dpid": 4, "status": "UP", "x": 700, "y": 300},
            {"id": "H2", "label": "Host H2 (10.0.0.2)", "type": "host", "ip": "10.0.0.2", "status": "UP", "x": 900, "y": 300},
        ]

        active_edges_set = set()
        for i in range(len(self.active_path) - 1):
            u, v = self.active_path[i], self.active_path[i+1]
            active_edges_set.add((u, v))
            active_edges_set.add((v, u))

        raw_links = [
            ("H1", "S1", "H1-S1"),
            ("S1", "S2", "S1-S2"),
            ("S1", "S3", "S1-S3"),
            ("S2", "S4", "S2-S4"),
            ("S3", "S4", "S3-S4"),
            ("S4", "H2", "S4-H2"),
        ]

        links = []
        for u, v, link_id in raw_links:
            status = self.link_statuses.get(link_id, "UP")
            is_active_path = (u, v) in active_edges_set
            links.append({
                "id": link_id,
                "source": u,
                "target": v,
                "status": status,
                "is_active_path": is_active_path and status == "UP",
                "bandwidth_mbps": 1000,
                "latency_ms": 1.2 if status == "UP" else 0.0
            })

        return {
            "nodes": nodes,
            "links": links,
            "active_path": self.active_path,
            "network_status": self.network_status
        }

    def get_network_status(self) -> Dict[str, Any]:
        avg_rec = sum(self.recovery_times) / len(self.recovery_times) if self.recovery_times else 0.82
        return {
            "status": self.network_status,
            "active_switches": 4,
            "active_links": sum(1 for s in self.link_statuses.values() if s == "UP"),
            "total_links": len(self.link_statuses),
            "active_hosts": 2,
            "active_flows": len(self.installed_flows) + 4,
            "detected_failures": self.total_failures,
            "successful_recoveries": self.total_recoveries,
            "avg_recovery_time_sec": round(avg_rec, 2),
            "active_path": " → ".join(self.active_path),
            "controller_type": "Ryu SDN Controller (OpenFlow 1.3)"
        }

    async def simulate_link_failure(self, link_id: str) -> Dict[str, Any]:
        """
        Triggers link failure simulation, detects path impact, computes alternate route via Dijkstra,
        installs new flow entries, logs metrics and triggers WebSocket recovery update.
        """
        start_time = time.time()
        
        # Standardize link ID format (e.g. S1-S2)
        if link_id not in self.link_statuses:
            parts = link_id.split("-")
            if len(parts) == 2:
                link_id = f"{parts[0]}-{parts[1]}"

        if link_id not in self.link_statuses:
            return {"success": False, "error": f"Invalid link ID: {link_id}"}

        u, v = link_id.split("-")
        
        # 1. Mark link DOWN in simulator & routing engine
        self.link_statuses[link_id] = "DOWN"
        self.routing_engine.set_link_status(u, v, "DOWN")
        self.total_failures += 1
        self.network_status = "REROUTING"

        # Log Detection Event
        db = SessionLocal()
        try:
            event1 = NetworkEventModel(
                level="WARN",
                event_type="LINK_FAILURE",
                source="MonitoringEngine",
                message=f"Link {link_id} failure detected on switch ports ({u} ↔ {v})",
                details={"link_id": link_id, "source": u, "target": v}
            )
            db.add(event1)
            db.commit()
            
            await self.notify_listeners("EVENT", {
                "level": "WARN",
                "message": f"Link {link_id} failure detected!",
                "timestamp": datetime.datetime.utcnow().isoformat()
            })

            # Check if active path is impacted
            path_impacted = False
            for i in range(len(self.active_path) - 1):
                p_u, p_v = self.active_path[i], self.active_path[i+1]
                if (p_u == u and p_v == v) or (p_u == v and p_v == u):
                    path_impacted = True
                    break

            old_path = list(self.active_path)
            alternate_path = None
            recovery_duration = 0.0

            if path_impacted:
                # Log Path Calculation
                event2 = NetworkEventModel(
                    level="INFO",
                    event_type="CALCULATING_PATH",
                    source="DijkstraRoutingEngine",
                    message=f"Calculating alternate available path avoiding failed link {link_id}...",
                    details={"failed_link": link_id, "broken_path": old_path}
                )
                db.add(event2)
                db.commit()

                # Simulate calculation delay (e.g. 0.4s to 0.9s)
                calc_delay = random.uniform(0.45, 0.85)
                await asyncio.sleep(0.2)  # Non-blocking async sleep

                # Compute new path
                new_path, cost = self.routing_engine.compute_shortest_path("H1", "H2")

                if new_path:
                    self.active_path = new_path
                    self._recalculate_flows()
                    self.total_recoveries += 1
                    self.network_status = "HEALTHY"
                    
                    end_time = time.time()
                    recovery_duration = round(end_time - start_time + calc_delay, 2)
                    self.recovery_times.append(recovery_duration)
                    alternate_path = new_path

                    # Record Failure Event in DB
                    fail_rec = FailureEventModel(
                        link_id=link_id,
                        source_node=u,
                        target_node=v,
                        failure_type="Link Down",
                        affected_flows=len(self.installed_flows),
                        previous_path=old_path,
                        alternate_path=new_path,
                        recovery_time_sec=recovery_duration,
                        status="Resolved",
                        resolution_timestamp=datetime.datetime.utcnow()
                    )
                    db.add(fail_rec)

                    # Record Rerouting History
                    reroute_rec = ReroutingHistoryModel(
                        old_path=old_path,
                        new_path=new_path,
                        switch_rules_installed=len(self.installed_flows),
                        duration_sec=recovery_duration,
                        triggered_by="AUTOMATIC"
                    )
                    db.add(reroute_rec)

                    # Log Success Events
                    event3 = NetworkEventModel(
                        level="SUCCESS",
                        event_type="FLOW_RULES_INSTALLED",
                        source="RyuController",
                        message=f"OpenFlow 1.3 rules updated across switches S1..S4 for path {' → '.join(new_path)}",
                        details={"path": new_path, "installed_rules_count": len(self.installed_flows)}
                    )
                    db.add(event3)

                    event4 = NetworkEventModel(
                        level="SUCCESS",
                        event_type="SELF_HEALED",
                        source="SelfHealingPlatform",
                        message=f"Network traffic successfully rerouted! Self-healing completed in {recovery_duration}s.",
                        details={"new_path": new_path, "recovery_time_sec": recovery_duration}
                    )
                    db.add(event4)
                    db.commit()

                    result = {
                        "success": True,
                        "link_id": link_id,
                        "status": "REROUTED",
                        "old_path": old_path,
                        "new_path": new_path,
                        "recovery_time_sec": recovery_duration,
                        "rules_updated": len(self.installed_flows)
                    }
                else:
                    self.failed_recovery_attempts += 1
                    self.network_status = "CRITICAL"
                    end_time = time.time()
                    recovery_duration = round(end_time - start_time, 2)

                    fail_rec = FailureEventModel(
                        link_id=link_id,
                        source_node=u,
                        target_node=v,
                        failure_type="Link Down",
                        affected_flows=len(self.installed_flows),
                        previous_path=old_path,
                        alternate_path=None,
                        recovery_time_sec=recovery_duration,
                        status="Failed",
                        resolution_timestamp=None
                    )
                    db.add(fail_rec)

                    event_err = NetworkEventModel(
                        level="ERROR",
                        event_type="NO_PATH_FOUND",
                        source="DijkstraRoutingEngine",
                        message=f"No alternate path available to reach target H2 after link {link_id} failure!",
                        details={"failed_link": link_id}
                    )
                    db.add(event_err)
                    db.commit()

                    result = {
                        "success": False,
                        "error": "No available path found between H1 and H2",
                        "link_id": link_id
                    }
            else:
                # Link failed but was not on active path
                self.network_status = "DEGRADED" if any(s == "DOWN" for s in self.link_statuses.values()) else "HEALTHY"
                event_info = NetworkEventModel(
                    level="WARN",
                    event_type="LINK_FAILURE_INACTIVE",
                    source="MonitoringEngine",
                    message=f"Link {link_id} failed, but active path {' → '.join(self.active_path)} remains operational.",
                    details={"active_path": self.active_path}
                )
                db.add(event_info)
                db.commit()
                result = {
                    "success": True,
                    "link_id": link_id,
                    "status": "INACTIVE_LINK_FAILED",
                    "active_path": self.active_path,
                    "recovery_time_sec": 0.0
                }

            await self.notify_listeners("TOPOLOGY_UPDATE", self.get_topology())
            return result

        finally:
            db.close()

    async def restore_link(self, link_id: str) -> Dict[str, Any]:
        """
        Restores a failed link, recalculates optimal route, and restores primary path if preferred.
        """
        if link_id not in self.link_statuses:
            return {"success": False, "error": f"Invalid link ID: {link_id}"}

        u, v = link_id.split("-")
        self.link_statuses[link_id] = "UP"
        self.routing_engine.set_link_status(u, v, "UP")

        db = SessionLocal()
        try:
            event1 = NetworkEventModel(
                level="INFO",
                event_type="LINK_RESTORED",
                source="MonitoringEngine",
                message=f"Link {link_id} restored to operational UP state.",
                details={"link_id": link_id}
            )
            db.add(event1)

            # Recalculate optimal path
            optimal_path, cost = self.routing_engine.compute_shortest_path("H1", "H2")
            old_path = list(self.active_path)

            if optimal_path and optimal_path != self.active_path:
                self.active_path = optimal_path
                self._recalculate_flows()
                
                event2 = NetworkEventModel(
                    level="SUCCESS",
                    event_type="PATH_REOPTIMIZED",
                    source="RyuController",
                    message=f"Traffic restored to optimal primary route {' → '.join(optimal_path)}",
                    details={"old_path": old_path, "new_path": optimal_path}
                )
                db.add(event2)

            self.network_status = "HEALTHY" if all(s == "UP" for s in self.link_statuses.values()) else "DEGRADED"
            db.commit()

            await self.notify_listeners("TOPOLOGY_UPDATE", self.get_topology())
            return {
                "success": True,
                "link_id": link_id,
                "status": "RESTORED",
                "active_path": self.active_path
            }
        finally:
            db.close()

    def update_traffic_metrics(self) -> Dict[str, Any]:
        """Simulates periodic live traffic fluctuations."""
        base_bps = 450000.0 if self.network_status == "HEALTHY" else 380000.0
        jitter_bps = random.uniform(-50000.0, 70000.0)
        self.current_traffic["bytes_per_sec"] = max(100000.0, round(base_bps + jitter_bps, 2))
        self.current_traffic["packets_per_sec"] = round(self.current_traffic["bytes_per_sec"] / 1200.0, 1)
        self.current_traffic["bandwidth_util_pct"] = round(min(98.0, (self.current_traffic["bytes_per_sec"] * 8 / 10000000) * 100), 1)
        
        if self.network_status == "HEALTHY":
            self.current_traffic["packet_loss_pct"] = round(random.uniform(0.0, 0.05), 3)
            self.current_traffic["latency_ms"] = round(random.uniform(1.1, 1.8), 2)
        elif self.network_status == "REROUTING":
            self.current_traffic["packet_loss_pct"] = round(random.uniform(1.2, 4.5), 2)
            self.current_traffic["latency_ms"] = round(random.uniform(12.0, 35.0), 2)
        elif self.network_status == "DEGRADED":
            self.current_traffic["packet_loss_pct"] = round(random.uniform(0.1, 0.4), 2)
            self.current_traffic["latency_ms"] = round(random.uniform(2.5, 4.2), 2)
        else:
            self.current_traffic["packet_loss_pct"] = 100.0
            self.current_traffic["latency_ms"] = 999.0

        return self.current_traffic

# Global Singleton Instance
sdn_simulator = SDNSimulator()
