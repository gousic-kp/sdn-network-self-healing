# SDN Network Self-Healing & Automatic Rerouting Platform
# Backend Configuration

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SDN Network Self-Healing Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:////tmp/sdn_platform.db" if os.getenv("VERCEL") else "sqlite:///./sdn_platform.db")
    
    # SDN Controller
    RYU_CONTROLLER_HOST: str = "127.0.0.1"
    RYU_CONTROLLER_PORT: int = 8080
    SIMULATION_MODE: bool = True  # Fallback standalone simulation engine when Ryu/Mininet not present
    
    # Monitoring
    METRICS_INTERVAL_SEC: float = 1.0
    
    class Config:
        case_sensitive = True

settings = Settings()
