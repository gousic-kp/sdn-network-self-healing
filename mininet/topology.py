#!/usr/bin/env python3
"""
SDN Network Self-Healing Mininet Topology Script.
Constructs a 4-switch diamond topology (S1, S2, S3, S4) connecting Hosts H1 and H2
to a Ryu SDN Controller running OpenFlow 1.3.

Topology Layout:
             [S2]
           /      \
  [H1] - [S1]    [S4] - [H2]
           \      /
             [S3]

Primary Path: H1 -> S1 -> S2 -> S4 -> H2
Backup Path:  H1 -> S1 -> S3 -> S4 -> H2
"""

from mininet.topo import Topo
from mininet.net import Mininet
from mininet.node import RemoteController, OVSKernelSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

class SDNTopology(Topo):
    def build(self):
        info("*** Creating Nodes (2 Hosts, 4 OVS Switches)\n")
        h1 = self.addHost('h1', ip='10.0.0.1/24', mac='00:00:00:00:00:01')
        h2 = self.addHost('h2', ip='10.0.0.2/24', mac='00:00:00:00:00:02')

        s1 = self.addSwitch('s1', dpid='0000000000000001', protocols='OpenFlow13')
        s2 = self.addSwitch('s2', dpid='0000000000000002', protocols='OpenFlow13')
        s3 = self.addSwitch('s3', dpid='0000000000000003', protocols='OpenFlow13')
        s4 = self.addSwitch('s4', dpid='0000000000000004', protocols='OpenFlow13')

        info("*** Creating Links\n")
        # Host Links
        self.addLink(h1, s1, port1=1, port2=1)  # h1-eth0 <-> s1-eth1
        self.addLink(h2, s4, port1=1, port2=3)  # h2-eth0 <-> s4-eth3

        # Inter-Switch Links
        self.addLink(s1, s2, port1=2, port2=1)  # s1-eth2 <-> s2-eth1 (Primary path leg 1)
        self.addLink(s1, s3, port1=3, port2=1)  # s1-eth3 <-> s3-eth1 (Backup path leg 1)
        self.addLink(s2, s4, port1=2, port2=1)  # s2-eth2 <-> s4-eth1 (Primary path leg 2)
        self.addLink(s3, s4, port1=2, port2=2)  # s3-eth2 <-> s4-eth2 (Backup path leg 2)

def run():
    setLogLevel('info')
    info("*** Instantiating Mininet Network\n")
    topo = SDNTopology()
    
    controller = RemoteController('c0', ip='127.0.0.1', port=6653)
    net = Mininet(
        topo=topo,
        switch=OVSKernelSwitch,
        controller=controller,
        autoSetMacs=True,
        autoStaticArp=True
    )

    info("*** Starting Network\n")
    net.start()

    info("*** Testing initial connectivity\n")
    net.pingAll()

    info("*** Running Mininet CLI (Type 'exit' or Ctrl+D to stop)\n")
    CLI(net)

    info("*** Stopping Network\n")
    net.stop()

if __name__ == '__main__':
    run()
