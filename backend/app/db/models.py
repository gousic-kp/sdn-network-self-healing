import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from app.db.database import Base

class NetworkEventModel(Base):
    __tablename__ = "network_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    level = Column(String(20), default="INFO")  # INFO, WARN, SUCCESS, ERROR
    event_type = Column(String(50))  # LINK_DOWN, LINK_UP, REROUTE, FLOW_INSTALLED, CONTROLLER_CONNECT
    source = Column(String(50))  # Switch, Controller, Mininet, Simulator
    message = Column(Text)
    details = Column(JSON, nullable=True)

class FailureEventModel(Base):
    __tablename__ = "failure_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    link_id = Column(String(50), index=True)  # e.g., S1-S2
    source_node = Column(String(50))
    target_node = Column(String(50))
    failure_type = Column(String(50), default="Link Down")
    affected_flows = Column(Integer, default=1)
    previous_path = Column(JSON)  # ["H1", "S1", "S2", "S4", "H2"]
    alternate_path = Column(JSON, nullable=True)  # ["H1", "S1", "S3", "S4", "H2"]
    recovery_time_sec = Column(Float, nullable=True)  # e.g., 0.82
    status = Column(String(50), default="Resolved")  # Detected, Rerouting, Resolved, Failed
    resolution_timestamp = Column(DateTime, nullable=True)

class TrafficStatModel(Base):
    __tablename__ = "traffic_stats"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    bytes_per_sec = Column(Float, default=0.0)
    packets_per_sec = Column(Float, default=0.0)
    bandwidth_util_pct = Column(Float, default=0.0)
    packet_loss_pct = Column(Float, default=0.0)
    latency_ms = Column(Float, default=0.0)
    active_flows = Column(Integer, default=0)
    link_stats = Column(JSON, nullable=True)  # { "S1-S2": { "bps": 1000, "util": 45.2 } }

class ReroutingHistoryModel(Base):
    __tablename__ = "rerouting_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    failure_event_id = Column(Integer, nullable=True)
    old_path = Column(JSON)
    new_path = Column(JSON)
    switch_rules_installed = Column(Integer, default=0)
    duration_sec = Column(Float, default=0.0)
    triggered_by = Column(String(50), default="AUTOMATIC")  # AUTOMATIC, MANUAL_SIMULATION
