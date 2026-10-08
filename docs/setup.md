# SDN Network Self-Healing Platform — Setup Guide

## Quick Start (Windows Standalone Mode)

When running on Windows or environments without native Mininet installed, the platform includes a full embedded SDN Topology & OpenFlow Engine Simulator.

### 1. Start Backend Server
```powershell
python backend/start_backend.py
```
The FastAPI backend starts on `http://localhost:8000`.

### 2. Launch Dashboard
Open `http://localhost:8000` in your web browser (or run frontend dev server).

---

## Native Mininet + Ryu Linux Environment Setup

### 1. Prerequisites (Ubuntu / Debian Linux)
```bash
sudo apt update
sudo apt install -y python3 python3-pip mininet openvswitch-switch
```

### 2. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
pip install -r controller/requirements.txt
```

### 3. Start Ryu SDN Controller
```bash
cd controller
ryu-manager sdn_controller.py --verbose
```

### 4. Start Mininet Topology
In a separate terminal:
```bash
cd mininet
sudo python3 topology.py
```

### 5. Start Backend API Server
In a separate terminal:
```bash
cd backend
python3 start_backend.py
```

### 6. Verify Traffic & Test Failure
In Mininet CLI:
```bash
mininet> h1 ping h2
```
In Dashboard: Click **Simulate Link Failure** on link `S1-S2`. Watch traffic instantly reroute through `S1-S3-S4` with zero packet loss!
