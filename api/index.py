import sys
import os

# Add the backend directory to sys.path so app modules can be imported seamlessly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Override SQLite database URL to use writable /tmp location on Vercel serverless environment
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "sqlite:////tmp/sdn_platform.db")

from app.main import app

# Export app instance for Vercel Serverless Function runtime
app = app
