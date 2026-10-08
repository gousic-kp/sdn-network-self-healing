# SDN Network Self-Healing & Automatic Rerouting Platform — Architecture

## System Architecture Overview

The platform uses a layered Software-Defined Networking (SDN) architecture to achieve zero-touch fault detection and automatic flow rerouting:

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

## Core Self-Healing Loop

The self-healing engine executes a deterministic 6-step loop:

1. **Monitor**: Ryu Controller / Backend continuously polls OpenFlow port status and interface states.
2. **Detect Failure**: When port status reports link down (e.g. S1-S2 fails), the event is flagged immediately.
3. **Identify Impact**: Affected active flows (H1 -> H2) on the broken path are identified.
4. **Calculate Alternate Path**: Dijkstra's shortest-path algorithm calculates the best available path considering operational links (H1 -> S1 -> S3 -> S4 -> H2).
5. **Install Flow Rules**: Updated OpenFlow 1.3 `OFPFlowMod` rules are pushed to switches S1, S3, and S4.
6. **Reroute & Recover**: Traffic flows seamlessly along the new route. The event, duration (e.g. 0.82s), and path diff are stored in SQLite and broadcasted via WebSockets.

---

## Network Topology Specification

- **Host H1 (Client)**: `10.0.0.1/24`, MAC `00:00:00:00:00:01`
- **Host H2 (Server)**: `10.0.0.2/24`, MAC `00:00:00:00:00:02`
- **Switches (S1..S4)**: Open vSwitch running OpenFlow 1.3

### Link Connections
- `H1` ↔ `S1` (Port 1)
- `S1` ↔ `S2` (Port 2 ↔ Port 1) [Primary Leg 1]
- `S1` ↔ `S3` (Port 3 ↔ Port 1) [Backup Leg 1]
- `S2` ↔ `S4` (Port 2 ↔ Port 1) [Primary Leg 2]
- `S3` ↔ `S4` (Port 2 ↔ Port 2) [Backup Leg 2]
- `S4` ↔ `H2` (Port 3 ↔ Port 1)

---

## Path Comparison

| State | Active Route | Path Hops | Link Status |
| ----- | ------------ | --------- | ----------- |
| **Normal (Primary)** | H1 → S1 → S2 → S4 → H2 | 4 Hops | All Links UP |
| **S1-S2 / S2-S4 Failed** | H1 → S1 → S3 → S4 → H2 | 4 Hops | S1-S2 DOWN, S1-S3 UP |
| **Restored** | H1 → S1 → S2 → S4 → H2 | 4 Hops | Re-optimized |
