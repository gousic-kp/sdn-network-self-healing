# SDN Network Self-Healing & Automatic Rerouting Platform ⚡

[![SDN Layer: Ryu Controller](https://img.shields.io/badge/SDN-Ryu%20Controller-blue.svg)](https://ryu-sdn.org/)
[![Emulation: Mininet + OVS](https://img.shields.io/badge/Network-Mininet%20%2B%20Open%20vSwitch-brightgreen.svg)](http://mininet.org/)
[![Protocol: OpenFlow 1.3](https://img.shields.io/badge/Protocol-OpenFlow%201.3-orange.svg)](https://opennetworking.org/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend: React + TypeScript](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61dafb.svg)](https://reactjs.org/)

A production-grade, full-stack **Software-Defined Networking (SDN) Self-Healing Platform** built with **Mininet, Open vSwitch, Ryu SDN Controller, FastAPI, and React/TypeScript**.

The system automatically detects network link failures in real time, computes alternate paths using **Dijkstra's Shortest Path Algorithm**, installs new **OpenFlow 1.3 flow rules**, reroutes active network traffic, and broadcasts live telemetry metrics to an interactive NOC dashboard over **WebSockets**.

---

## 🌟 Key Features

- **Real-Time Self-Healing Loop**: Continuous monitoring → Failure detection → Dijkstra path calculation → OpenFlow flow entry installation → Zero-downtime rerouting → Recovery logging.
- **Interactive Live Topology Canvas**: Real-time SVG topology visualization showing host nodes (`H1`, `H2`), switches (`S1`, `S2`, `S3`, `S4`), operational links, and animated travelling packet dots along active flow paths.
- **One-Click Link Failure Simulation**: Trigger failures on links such as `S1-S2` or `S2-S4` directly from the dashboard or terminal, and watch the system automatically recalculate and reroute traffic.
- **Link Restoration & Re-Optimization**: One-click link restoration that detects when primary high-speed links come back online and re-optimizes flow entries back to the primary route.
- **Telemetry & Traffic Monitoring**: Live throughput (bytes/sec), packet rates (pps), link bandwidth utilization (%), round-trip latency (ms), and packet loss (%) tracking.
- **Complete REST & WebSocket API**: Exposes clean endpoints for network state, switches, flow tables, failure histories, and live streaming WebSocket events (`/ws/network`, `/ws/events`).
- **Dual-Engine Execution Mode**: Fully supports native Mininet + Ryu execution on Linux **AND** includes an embedded SDN Engine Simulator out of the box for Windows/Dockerless demonstration!

---

## 🏗️ System Architecture

```text
  +-----------------------------------------------------------------------+
  |                     React 18 + TypeScript Dashboard                   |
  | (Live Topology Visualizer, Traffic Charts, Event Stream, Control)     |
  +-----------------------------------+-----------------------------------+
                                      | WebSocket / REST API
  +-----------------------------------v-----------------------------------+
  |                       FastAPI Control Backend                         |
  |  (Database Log, Metric Collector, Simulation Bridge, State Engine)    |
  +-----------------------------------+-----------------------------------+
                                      | OpenFlow 1.3 / REST
  +-----------------------------------v-----------------------------------+
  |                      Ryu SDN Controller Core                          |
  |  (Switch Discovery, Link Monitor, Dijkstra Router, Flow Installer)    |
  +-----------------------------------+-----------------------------------+
                                      | OpenFlow Protocol
  +-----------------------------------v-----------------------------------+
  |              Mininet + Open vSwitch (OVS) Emulation                   |
  |               (H1, S1, S2, S3, S4, H2 Diamond Topology)                |
  +-----------------------------------------------------------------------+
```

---

## 🌐 Network Topology Design

The network topology implements a 4-switch diamond topology:

```text
             [S2] (Primary Leg)
           /      \
  [H1] - [S1]    [S4] - [H2]
           \      /
             [S3] (Backup Leg)
```

- **Client Host (H1)**: IP `10.0.0.1/24`, MAC `00:00:00:00:00:01`
- **Server Host (H2)**: IP `10.0.0.2/24`, MAC `00:00:00:00:00:02`
- **Switches**: `S1`, `S2`, `S3`, `S4` (Open vSwitch with OpenFlow 1.3)
- **Primary Path**: `H1 → S1 → S2 → S4 → H2`
- **Backup Path**: `H1 → S1 → S3 → S4 → H2`

---

## 💻 Tech Stack

- **SDN Layer**: Ryu Controller, Mininet Emulation, Open vSwitch (OVS), OpenFlow 1.3, Python 3
- **Backend API**: FastAPI, Python 3, WebSockets, SQLAlchemy, SQLite, NetworkX, Uvicorn
- **Frontend UI**: React 18, TypeScript, Tailwind CSS, HTML5 Canvas/SVG, JetBrains Mono
- **Testing**: Mininet CLI (`pingall`, `iperf`), REST API, WebSocket client

---

## 📁 Project Structure

```text
sdn-self-healing/
│
├── frontend/                 # React 18 + TypeScript Web Dashboard
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, TopologyCanvas, LinkFailureModal, EventLogStream
│   │   ├── pages/            # Dashboard, Topology, Traffic, Failures, Rerouting, Events, Controller, Settings
│   │   ├── services/         # REST API client and WebSocket handlers
│   │   └── types/            # TypeScript SDN interface definitions
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # FastAPI Control & Telemetry Server
│   ├── app/
│   │   ├── api/              # REST endpoints & WebSockets router
│   │   ├── core/             # Configuration & settings
│   │   ├── db/               # SQLite database setup & models
│   │   ├── services/         # Routing engine, SDN bridge, simulator & background traffic generator
│   │   └── main.py           # FastAPI entry point
│   ├── frontend_dist/        # Built frontend bundle served directly by FastAPI
│   ├── start_backend.py      # Backend start script
│   └── requirements.txt
│
├── controller/               # Ryu SDN Controller Engine
│   ├── sdn_controller.py     # Main Ryu application (OF1.3, PortStatus handler, FlowMod installer)
│   ├── topology_manager.py   # Switch registry & link adjacency manager
│   ├── routing.py            # Dijkstra shortest-path calculator
│   ├── monitoring.py         # OpenFlow port & flow stats collector
│   └── requirements.txt
│
├── mininet/                  # Mininet Network Topology & Test Scripts
│   ├── topology.py           # Custom Mininet Topo class (H1, H2, S1..S4)
│   ├── traffic_test.py       # Automated ping & iperf bandwidth testing script
│   ├── failure_simulation.py # Interface link down/up CLI helper
│   └── run_mininet.sh        # Bash runner script
│
├── docs/                     # Documentation & Diagrams
│   ├── architecture.md       # Deep architectural breakdown
│   └── setup.md              # Detailed setup instructions
│
└── README.md
```

---

## 🚀 Step-by-Step Execution Guide

### Option A: Standalone Quick Run (Windows / Any OS)

Runs out-of-the-box with embedded SDN engine simulation:

```powershell
# 1. Clone repository and navigate to root
cd "e:\SDN Network Self-Healing"

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Launch Backend & Dashboard
python backend/start_backend.py
```

Open **`http://localhost:8000`** in your browser to access the complete live NOC dashboard!

---

### Option B: Native Linux Environment (Mininet + Open vSwitch + Ryu)

#### 1. Install System Dependencies (Ubuntu / Debian)
```bash
sudo apt update
sudo apt install -y python3 python3-pip mininet openvswitch-switch
```

#### 2. Install Python Packages
```bash
pip install -r backend/requirements.txt
pip install -r controller/requirements.txt
```

#### 3. Launch Ryu SDN Controller
```bash
cd controller
ryu-manager sdn_controller.py --verbose
```

#### 4. Launch Mininet Network Topology
In a second terminal window:
```bash
cd mininet
sudo python3 topology.py
```

#### 5. Launch FastAPI Backend
In a third terminal window:
```bash
cd backend
python3 start_backend.py
```

#### 6. Open Web Dashboard
Navigate to **`http://localhost:8000`**.

---

## 🧪 Demonstration Scenario & Verification

### Test 1 — Normal Primary Path Flow
1. Verify initial network status is **HEALTHY**.
2. Active Path displays: `H1 → S1 → S2 → S4 → H2`.
3. In Mininet CLI, test ping:
   ```bash
   mininet> h1 ping h2
   ```
   *Result*: 0% packet loss, ~1.2ms latency.

### Test 2 — Link Failure Trigger
1. Click **Simulate Link Failure** on the dashboard or run:
   ```bash
   sudo python3 mininet/failure_simulation.py s1 s2 down
   ```
2. Link `S1-S2` turns red with a failure cross icon on the Live Topology Canvas.
3. Network status updates to **REROUTING**.

### Test 3 — Automatic Self-Healing Recovery
1. The Ryu Controller detects `PortStatus` link down.
2. Dijkstra computes the alternate route `H1 → S1 → S3 → S4 → H2`.
3. OpenFlow 1.3 `OFPFlowMod` rules are pushed to switches `S1`, `S3`, and `S4`.
4. Dashboard shows:
   - **Status**: `HEALTHY`
   - **Active Path**: `H1 → S1 → S3 → S4 → H2`
   - **Recovery Duration**: `0.82 seconds`
5. Ping in Mininet CLI continues without losing packets!

### Test 4 — Link Restoration & Re-Optimization
1. Click **Restore Link** for `S1-S2` or run:
   ```bash
   sudo python3 mininet/failure_simulation.py s1 s2 up
   ```
2. The controller re-optimizes the route back to the primary path `H1 → S1 → S2 → S4 → H2`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/network/status` | Current network status & active counts |
| `GET` | `/api/topology` | Nodes, links, operational state & active path |
| `GET` | `/api/switches` | List of registered OpenFlow switches |
| `GET` | `/api/flows` | Installed OpenFlow 1.3 flow table rules |
| `GET` | `/api/statistics` | Aggregated traffic & recovery metrics |
| `GET` | `/api/events` | Real-time event trail log |
| `GET` | `/api/failures` | History of all link failure and recovery events |
| `POST` | `/api/failure/simulate` | Triggers link failure simulation (`{ "link_id": "S1-S2" }`) |
| `POST` | `/api/link/restore` | Restores failed link (`{ "link_id": "S1-S2" }`) |
| `POST` | `/api/network/recalculate` | Forces Dijkstra shortest path recalculation |
| `WS` | `/ws/network` | WebSocket stream for live topology & traffic metrics |
| `WS` | `/ws/events` | WebSocket stream for real-time event logs |

---

## 🔮 Future Enhancements

- Multi-controller cluster support (OpenDaylight / ONOS failover).
- Machine learning-based predictive link degradation detection.
- Quality of Service (QoS) bandwidth reservation per flow slice.
- Support for PostgreSQL database storage in production deployments.

---

## 📜 License

MIT License — free for research, academic, and commercial use.
