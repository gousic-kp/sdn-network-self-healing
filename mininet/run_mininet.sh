#!/bin/bash
# Clean Mininet environment before launch
echo "Cleaning existing Mininet state..."
sudo mn -c

echo "Launching SDN Topology with Remote Ryu Controller..."
sudo python3 topology.py
