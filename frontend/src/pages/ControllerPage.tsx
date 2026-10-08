import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { NetworkStatus } from '../types/sdn';

interface ControllerPageProps {
  status: NetworkStatus | null;
}

export const ControllerPage: React.FC<ControllerPageProps> = ({ status }) => {
  const [switches, setSwitches] = useState<any[]>([]);

  useEffect(() => {
    api.getSwitches().then((res) => setSwitches(res.switches || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 select-none">
      <div>
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Ryu SDN Controller Inspector</h2>
        <p className="text-xs text-slate-400">
          Status of connected OpenFlow 1.3 switches, DPID assignments, feature handshakes, and southbound API endpoints.
        </p>
      </div>

      {/* Controller Spec Card */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎛️</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Ryu SDN Framework</h3>
              <p className="text-[11px] text-slate-400 font-mono">OpenFlow 1.3 | Dijkstra Self-Healing Module</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
            ONLINE
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">OF PROTOCOL</div>
            <div className="text-slate-200 font-bold">v1.3 (0x04)</div>
          </div>
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">REST HOST</div>
            <div className="text-slate-200 font-bold">127.0.0.1:8080</div>
          </div>
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">OF PORT</div>
            <div className="text-slate-200 font-bold">6653</div>
          </div>
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px]">DISCOVERY</div>
            <div className="text-slate-200 font-bold">LLDP Active</div>
          </div>
        </div>
      </div>

      {/* Registered Switches List */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Registered Open vSwitch Instances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((dpid) => (
            <div key={dpid} className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 font-mono text-sm">Switch S{dpid}</span>
                <span className="text-[10px] font-mono text-slate-400">DPID: 000000000000000{dpid}</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono">
                <div>• Ports: {dpid === 1 || dpid === 4 ? '3 Operational' : '2 Operational'}</div>
                <div>• Default Table-Miss Rule Installed</div>
                <div>• Active Path Flow Rule Configured</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
