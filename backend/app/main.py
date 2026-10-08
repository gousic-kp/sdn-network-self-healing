import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.db.database import engine, Base
from app.api.endpoints import router as api_router
from app.api.websocket import router as ws_router
from app.services.traffic_generator import traffic_generator

# Create SQLite database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background traffic statistics generator worker
    await traffic_generator.start()
    print("[FastAPI] SDN Self-Healing Backend initialized. Traffic generator running.")
    yield
    # Shutdown
    await traffic_generator.stop()
    print("[FastAPI] Shutdown completed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

# Mount frontend build directory if present
frontend_static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend_dist")
if not os.path.exists(frontend_static_dir):
    frontend_static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")

if os.path.exists(frontend_static_dir):
    assets_dir = os.path.join(frontend_static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("ws"):
            return None
        file_path = os.path.join(frontend_static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_static_dir, "index.html"))

@app.get("/")
def root_status():
    return {
        "service": settings.PROJECT_NAME,
        "status": "ONLINE",
        "docs_url": "/docs",
        "simulation_mode": settings.SIMULATION_MODE
    }
