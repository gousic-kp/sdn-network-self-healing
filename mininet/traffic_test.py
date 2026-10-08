#!/usr/bin/env python3
"""
Mininet Automated Traffic Generator & Performance Tester.
Executes continuous ping stream or iperf bandwidth test between Host H1 and Host H2.
"""

import sys
import time
import argparse

def run_traffic_test(net, mode='ping', count=20):
    h1 = net.get('h1')
    h2 = net.get('h2')

    print(f"=== Starting {mode.upper()} Traffic Test between H1 (10.0.0.1) and H2 (10.0.0.2) ===")

    if mode == 'ping':
        result = h1.cmd(f'ping -c {count} -i 0.2 10.0.0.2')
        print(result)
    elif mode == 'iperf':
        print("Starting iperf server on H2...")
        h2.cmd('iperf -s -u &')
        time.sleep(1)
        print("Running iperf UDP traffic stream from H1 -> H2...")
        result = h1.cmd('iperf -c 10.0.0.2 -u -b 10M -t 10')
        print(result)
        h2.cmd('killall -9 iperf')
    
    print("=== Traffic Test Completed ===")

if __name__ == '__main__':
    print("Use this module inside Mininet CLI or runner script.")
