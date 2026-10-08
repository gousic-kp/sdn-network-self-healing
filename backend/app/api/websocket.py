import json
import asyncio
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.sdn_simulator import sdn_simulator

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.event_connections: List[WebSocket] = []

    async def connect_network(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial topology state
        await websocket.send_text(json.dumps({
            "type": "INITIAL_STATE",
            "topology": sdn_simulator.get_topology(),
            "status": sdn_simulator.get_network_status()
        }))

    async def connect_events(self, websocket: WebSocket):
        await websocket.accept()
        self.event_connections.append(websocket)

    def disconnect_network(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    def disconnect_events(self, websocket: WebSocket):
        if websocket in self.event_connections:
            self.event_connections.remove(websocket)

    async def broadcast_network(self, data: dict):
        message = json.dumps(data)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect_network(connection)

    async def broadcast_events(self, data: dict):
        message = json.dumps(data)
        for connection in list(self.event_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect_events(connection)

manager = ConnectionManager()

# Hook into SDNSimulator event notification
async def on_simulator_event(event_type: str, data: dict):
    if event_type in ["TOPOLOGY_UPDATE", "TRAFFIC_METRICS"]:
        await manager.broadcast_network({
            "type": event_type,
            "data": data,
            "status": sdn_simulator.get_network_status()
        })
    elif event_type == "EVENT":
        await manager.broadcast_events({
            "type": "NEW_EVENT",
            "event": data
        })

sdn_simulator.register_listener(on_simulator_event)

@router.websocket("/ws/network")
async def websocket_network_endpoint(websocket: WebSocket):
    await manager.connect_network(websocket)
    try:
        while True:
            # Keep connection alive & accept incoming ping/commands
            data = await websocket.receive_text()
            # Respond to client ping if requested
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect_network(websocket)

@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await manager.connect_events(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect_events(websocket)
