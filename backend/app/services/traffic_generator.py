import asyncio
import datetime
from app.services.sdn_simulator import sdn_simulator
from app.db.database import SessionLocal
from app.db.models import TrafficStatModel

class TrafficGenerator:
    """
    Background worker that updates live network traffic statistics every second.
    """
    def __init__(self):
        self._running = False
        self._task = None

    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()

    async def _loop(self):
        while self._running:
            try:
                metrics = sdn_simulator.update_traffic_metrics()
                
                # Record to Database
                db = SessionLocal()
                try:
                    stat = TrafficStatModel(
                        bytes_per_sec=metrics["bytes_per_sec"],
                        packets_per_sec=metrics["packets_per_sec"],
                        bandwidth_util_pct=metrics["bandwidth_util_pct"],
                        packet_loss_pct=metrics["packet_loss_pct"],
                        latency_ms=metrics["latency_ms"],
                        active_flows=metrics["active_flows"]
                    )
                    db.add(stat)
                    db.commit()
                finally:
                    db.close()

                # Notify WebSockets
                await sdn_simulator.notify_listeners("TRAFFIC_METRICS", {
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "metrics": metrics,
                    "status": sdn_simulator.network_status
                })
                
            except Exception as e:
                print(f"[TrafficGenerator] Exception: {e}")

            await asyncio.sleep(1.0)

traffic_generator = TrafficGenerator()
