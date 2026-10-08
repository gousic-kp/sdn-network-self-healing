import React, { useEffect, useState } from 'react';
import { NetworkTopology, FlowRule } from '../types/sdn';
import { TopologyCanvas } from '../components/TopologyCanvas';
import { api } from '../services/api';

interface TopologyPageProps {
  topology: NetworkTopology | null;
  onSimulateFailure: (linkId: string) => Promise<any>;
  onRestoreLink: (linkId: string) => Promise<any>;
}

export const TopologyPage: React.FC<TopologyPageProps> = ({
  topology,
  onSimulateFailure,
  onRestoreLink,
}) => {
  const [flows, setFlows] = useState<FlowRule[]>([]);

  useEffect(() => {
    api.getFlows().then((res) => setFlows(res.flows)).catch(console.error);
  }, [topology]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Interactive SDN Network Topology</h2>
          <p className="text-xs text-slate-400">
            Real-time visualization of Open vSwitch nodes, link operational states, and active packet flows.
          </p>
        </div>
      </div>

      <TopologyCanvas
        topology={topology}
        onSimulateFailure={onSimulateFailure}
        onRestoreLink={onRestoreLink}
      />

      {/* Switch Flow Tables Detail */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl select-none">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Installed OpenFlow 1.3 Rules across Switches</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-2.5">Switch</th>
                <th className="p-2.5">Priority</th>
                <th className="p-2.5">In Port</th>
                <th className="p-2.5">Source IPv4</th>
                <th className="p-2.5">Dest IPv4</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {flows.map((flow, i) => (
                <tr key={i} className="hover:bg-slate-900/60">
                  <td className="p-2.5 font-bold text-cyan-400">{flow.switch_id || `S${flow.dpid}`}</td>
                  <td className="p-2.5">{flow.priority}</td>
                  <td className="p-2.5">{flow.match.in_port}</td>
                  <td className="p-2.5">{flow.match.ipv4_src || '*'}</td>
                  <td className="p-2.5">{flow.match.ipv4_dst || '*'}</td>
                  <td className="p-2.5 text-emerald-400 font-semibold">{flow.actions.join(', ')}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                      {flow.direction || 'FORWARD'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
