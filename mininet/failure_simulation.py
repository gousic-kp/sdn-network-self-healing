#!/usr/bin/env python3
"""
Mininet Link Failure & Restoration CLI Tool.
Can be executed via terminal to manually trigger interface state changes on Open vSwitch links.
"""

import sys
import subprocess

def set_link_state(src_node: str, dst_node: str, state: str):
    """
    Executes Linux ip link command to bring down/up the link interface.
    Example: set_link_state('s1', 's2', 'down')
    """
    interface_name = f"{src_node.lower()}-eth2" if src_node.lower() == 's1' and dst_node.lower() == 's2' else f"{src_node.lower()}-{dst_node.lower()}"
    cmd = f"sudo ip link set dev {src_node.lower()}-eth2 {state}"
    print(f"Executing: {cmd}")
    try:
        subprocess.run(cmd, shell=True, check=True)
        print(f"Link {src_node}-{dst_node} set to {state.upper()} successfully.")
    except Exception as e:
        print(f"Failed to set link state: {e}")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python3 failure_simulation.py <src_node> <dst_node> <up|down>")
        print("Example: python3 failure_simulation.py s1 s2 down")
        sys.exit(1)

    src = sys.argv[1]
    dst = sys.argv[2]
    st = sys.argv[3]
    set_link_state(src, dst, st)
