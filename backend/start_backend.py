import sys
import os
import uvicorn

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting SDN Self-Healing & Automatic Rerouting Platform Backend...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
