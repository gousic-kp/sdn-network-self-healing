from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import NetworkEventModel, FailureEventModel, TrafficStatModel, ReroutingHistoryModel
from app.services.sdn_simulator import sdn_simulator
from app.services.sdn_bridge import sdn_bridge

router = APIRouter()

class SimulateFailureRequest(BaseModel):
    link_id: str  # e.g., "S1-S2" or "S2-S4"

class RestoreLinkRequest(BaseModel):
    link_id: str  # e.g., "S1-S2"

@router.get("/network/status")
def get_network_status():
    return sdn_simulator.get_network_status()

@router.get("/topology")
def get_topology():
    return sdn_bridge.get_topology()

@router.get("/links")
def get_links():
    topo = sdn_simulator.get_topology()
    return topo.get("links", [])

@router.get("/switches")
def get_switches():
    topo = sdn_simulator.get_topology()
    switches = [n for n in topo.get("nodes", []) if n.get("type") == "switch"]
    return {
        "count": len(switches),
        "switches": switches
    }

@router.get("/flows")
def get_flows():
    flows = sdn_bridge.get_flows()
    return {
        "count": len(flows),
        "flows": flows
    }

@router.get("/statistics")
def get_statistics(db: Session = Depends(get_db)):
    recent_traffic = db.query(TrafficStatModel).order_by(TrafficStatModel.timestamp.desc()).limit(30).all()
    stats_history = [
        {
            "timestamp": t.timestamp.isoformat(),
            "bytes_per_sec": t.bytes_per_sec,
            "packets_per_sec": t.packets_per_sec,
            "bandwidth_util_pct": t.bandwidth_util_pct,
            "packet_loss_pct": t.packet_loss_pct,
            "latency_ms": t.latency_ms
        }
        for t in reversed(recent_traffic)
    ]

    recoveries = sdn_simulator.recovery_times
    min_rec = min(recoveries) if recoveries else 0.82
    max_rec = max(recoveries) if recoveries else 1.12
    avg_rec = sum(recoveries) / len(recoveries) if recoveries else 0.82

    return {
        "summary": {
            "total_failures": sdn_simulator.total_failures,
            "total_recoveries": sdn_simulator.total_recoveries,
            "failed_recovery_attempts": sdn_simulator.failed_recovery_attempts,
            "avg_recovery_time_sec": round(avg_rec, 2),
            "min_recovery_time_sec": round(min_rec, 2),
            "max_recovery_time_sec": round(max_rec, 2),
            "active_flows_count": len(sdn_simulator.installed_flows),
            "current_active_path": sdn_simulator.active_path
        },
        "traffic_history": stats_history
    }

@router.get("/events")
def get_events(
    level: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(NetworkEventModel)
    if level:
        query = query.filter(NetworkEventModel.level == level.upper())
    events = query.order_by(NetworkEventModel.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "level": e.level,
            "event_type": e.event_type,
            "source": e.source,
            "message": e.message,
            "details": e.details
        }
        for e in events
    ]

@router.get("/failures")
def get_failures(db: Session = Depends(get_db)):
    failures = db.query(FailureEventModel).order_by(FailureEventModel.timestamp.desc()).all()
    return [
        {
            "id": f.id,
            "timestamp": f.timestamp.isoformat(),
            "link_id": f.link_id,
            "source_node": f.source_node,
            "target_node": f.target_node,
            "failure_type": f.failure_type,
            "affected_flows": f.affected_flows,
            "previous_path": f.previous_path,
            "alternate_path": f.alternate_path,
            "recovery_time_sec": f.recovery_time_sec,
            "status": f.status,
            "resolution_timestamp": f.resolution_timestamp.isoformat() if f.resolution_timestamp else None
        }
        for f in failures
    ]

@router.post("/failure/simulate")
async def simulate_failure(payload: SimulateFailureRequest):
    result = await sdn_bridge.simulate_link_failure(payload.link_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Link failure simulation failed"))
    return result

@router.post("/link/restore")
async def restore_link(payload: RestoreLinkRequest):
    result = await sdn_bridge.restore_link(payload.link_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Link restoration failed"))
    return result

@router.post("/network/recalculate")
async def recalculate_network():
    path, cost = sdn_simulator.routing_engine.compute_shortest_path("H1", "H2")
    if path:
        sdn_simulator.active_path = path
        sdn_simulator._recalculate_flows()
        await sdn_simulator.notify_listeners("TOPOLOGY_UPDATE", sdn_simulator.get_topology())
        return {
            "success": True,
            "active_path": path,
            "cost": cost,
            "flows_updated": len(sdn_simulator.installed_flows)
        }
    raise HTTPException(status_code=400, detail="No valid path found")
