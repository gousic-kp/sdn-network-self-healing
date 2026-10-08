import React, { useState } from 'react';
import { NetworkTopology } from '../types/sdn';

interface TopologyCanvasProps {
  topology: NetworkTopology | null;
  onSimulateFailure: (linkId: string) => void;
  onRestoreLink: (linkId: string) => void;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  topology,
  onSimulateFailure,
  onRestoreLink,
}) => {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  if (!topology) {
    return (
      <div className="w-full h-96 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-mono text-sm">
        Connecting to SDN Topology Engine...
      </div>
    );
  }

  // Fixed Canvas Coordinates for 4-Switch Diamond
  const nodeCoords: Record<string, { x: number; y: number; label: string; type: string; details: string }> = {
    H1: { x: 100, y: 220, label: 'Host H1', type: 'host', details: '10.0.0.1 (Client)' },
    S1: { x: 300, y: 220, label: 'Switch S1', type: 'switch', details: 'OVS DPID: 0000001' },
    S2: { x: 500, y: 100, label: 'Switch S2', type: 'switch', details: 'OVS DPID: 0000002 (Primary)' },
    S3: { x: 500, y: 340, label: 'Switch S3', type: 'switch', details: 'OVS DPID: 0000003 (Backup)' },
    S4: { x: 700, y: 220, label: 'Switch S4', type: 'switch', details: 'OVS DPID: 0000004' },
    H2: { x: 900, y: 220, label: 'Host H2', type: 'host', details: '10.0.0.2 (Server)' },
  };

  const getLinkStatus = (linkId: string) => {
    const link = topology.links.find((l) => l.id === linkId);
    return link ? link.status : 'UP';
  };

  const isLinkInActivePath = (u: string, v: string) => {
    const path = topology.active_path;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === u && path[i + 1] === v) || (path[i] === v && path[i + 1] === u)) {
        return true;
      }
    }
    return false;
  };

  const linksList = [
    { u: 'H1', v: 'S1', id: 'H1-S1' },
    { u: 'S1', v: 'S2', id: 'S1-S2' },
    { u: 'S1', v: 'S3', id: 'S1-S3' },
    { u: 'S2', v: 'S4', id: 'S2-S4' },
    { u: 'S3', v: 'S4', id: 'S3-S4' },
    { u: 'S4', v: 'H2', id: 'S4-H2' },
  ];

  return (
    <div className="relative w-full rounded-xl bg-slate-950 border border-slate-800 p-4 shadow-2xl overflow-hidden select-none">
      {/* SVG Canvas Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live OpenFlow Topology Canvas</h3>
        </div>
        <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-emerald-400 rounded-full"></span>
            <span>Active Path</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-slate-600 rounded-full"></span>
            <span>Normal Link</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded-full"></span>
            <span>Failed Link</span>
          </div>
        </div>
      </div>

      {/* SVG Graph Area */}
      <div className="w-full overflow-x-auto flex justify-center py-4">
        <svg width="1000" height="440" className="bg-slate-950/60 rounded-lg">
          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Links */}
          {linksList.map(({ u, v, id }) => {
            const p1 = nodeCoords[u];
            const p2 = nodeCoords[v];
            const status = getLinkStatus(id);
            const active = isLinkInActivePath(u, v) && status === 'UP';
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            return (
              <g key={id}>
                {/* Base Line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={status === 'DOWN' ? '#ef4444' : active ? '#10b981' : '#334155'}
                  strokeWidth={active ? 4 : status === 'DOWN' ? 3 : 2}
                  strokeDasharray={status === 'DOWN' ? '6 4' : undefined}
                  filter={active ? 'url(#glow-green)' : status === 'DOWN' ? 'url(#glow-red)' : undefined}
                  className="transition-all duration-300"
                />

                {/* Animated Packet Dots along Active Path */}
                {active && (
                  <circle r="4" fill="#34d399">
                    <animateMotion
                      path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Link Control / Failure Toggle Button at Midpoint */}
                <g transform={`translate(${midX}, ${midY})`} className="cursor-pointer group">
                  {status === 'DOWN' ? (
                    <g onClick={() => onRestoreLink(id)}>
                      <circle r="14" fill="#991b1b" stroke="#f87171" strokeWidth="2" />
                      <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">✕</text>
                      <rect x="-35" y="-30" width="70" height="18" rx="4" fill="#7f1d1d" />
                      <text x="0" y="-18" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        RESTORE
                      </text>
                    </g>
                  ) : (
                    <g onClick={() => onSimulateFailure(id)}>
                      <circle r="10" fill="#0f172a" stroke={active ? '#10b981' : '#475569'} strokeWidth="1.5" className="group-hover:stroke-rose-500 group-hover:fill-rose-950 transition-colors" />
                      <text x="0" y="3" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace" className="group-hover:fill-rose-300">
                        ⚡
                      </text>
                      <rect x="-32" y="-26" width="64" height="16" rx="3" fill="#1e293b" opacity="0.9" className="group-hover:fill-rose-900" />
                      <text x="0" y="-15" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace" className="group-hover:fill-rose-200">
                        {id}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* Render Nodes */}
          {Object.entries(nodeCoords).map(([key, node]) => {
            const isSwitch = node.type === 'switch';
            const isInActivePath = topology.active_path.includes(key);

            return (
              <g
                key={key}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Node Outer Circle / Glow */}
                <circle
                  r={isSwitch ? 26 : 22}
                  fill={isSwitch ? '#0f172a' : '#1e1b4b'}
                  stroke={isInActivePath ? '#10b981' : isSwitch ? '#0284c7' : '#6366f1'}
                  strokeWidth={isInActivePath ? '3' : '2'}
                  filter={isInActivePath ? 'url(#glow-green)' : undefined}
                  className="transition-all group-hover:scale-110"
                />

                {/* Node Icon */}
                <text x="0" y="5" textAnchor="middle" fontSize={isSwitch ? '16' : '14'} fill="#ffffff">
                  {isSwitch ? '🔀' : '💻'}
                </text>

                {/* Node Label Tag */}
                <rect x="-40" y="32" width="80" height="20" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="0" y="45" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Modal / Panel */}
      {selectedNode && (
        <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-300">
          <div>
            <span className="font-bold text-cyan-400">{selectedNode.label}</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="font-mono text-slate-400">{selectedNode.details}</span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-slate-500 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
