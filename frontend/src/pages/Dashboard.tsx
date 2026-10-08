import React from 'react';
import { NetworkStatus, NetworkTopology, NetworkEvent } from '../types/sdn';
import { StatusCard } from '../components/StatusCard';
import { TopologyCanvas } from '../components/TopologyCanvas';
import { EventLogStream } from '../components/EventLogStream';

interface DashboardProps {
  status: NetworkStatus | null;
  topology: NetworkTopology | null;
  events: NetworkEvent[];
  onSimulateFailure: (linkId: string) => Promise<any>;
  onRestoreLink: (linkId: string) => Promise<any>;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  status,
  topology,
  events,
  onSimulateFailure,
  onRestoreLink,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard
          title="Network Status"
          value={status?.status || 'HEALTHY'}
          subtitle={`Active Route: ${status?.active_path || 'H1 → S1 → S2 → S4 → H2'}`}
          icon="🟢"
          color={status?.status === 'HEALTHY' ? 'emerald' : 'rose'}
        />

        <StatusCard
          title="Active Switches & Links"
          value={`${status?.active_switches || 4} Switches / ${status?.active_links || 5} Links`}
          subtitle="4 Open vSwitch Nodes (S1..S4)"
          icon="🔀"
          color="cyan"
        />

        <StatusCard
          title="Failures & Recoveries"
          value={`${status?.detected_failures || 0} Fail / ${status?.successful_recoveries || 0} Heal`}
          subtitle="100% Zero-Loss Automatic Self-Healing"
          icon="⚡"
          color="amber"
        />

        <StatusCard
          title="Avg Recovery Time"
          value={`${status?.avg_recovery_time_sec || 0.82}s`}
          subtitle="Dijkstra Alternate Path + OpenFlow Rule Push"
          icon="⏱️"
          color="indigo"
        />
      </div>

      {/* Main Canvas & Quick Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <TopologyCanvas
            topology={topology}
            onSimulateFailure={onSimulateFailure}
            onRestoreLink={onRestoreLink}
          />
        </div>

        {/* Quick Actions & Live Summary Side Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Self-Healing Execution Workflow</h3>
            
            <div className="space-y-2.5 text-xs text-slate-300 font-mono">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <span className="text-cyan-400">1.</span>
                <span>PortStatus / Link Failure Detection</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <span className="text-amber-400">2.</span>
                <span>Dijkstra Alternate Path Calculation</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <span className="text-emerald-400">3.</span>
                <span>OFPFlowMod Flow Table Updates (S1..S4)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center space-x-2">
                <span className="text-cyan-400">4.</span>
                <span>Traffic Rerouted & Metric Recorded</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => onNavigate('topology')}
                className="w-full py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs border border-cyan-500/30 transition-all text-center"
              >
                Expand Live Topology View →
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Path Details</h3>
            <div className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-cyan-400 border border-slate-800">
              {status?.active_path || 'H1 → S1 → S2 → S4 → H2'}
            </div>
            <p className="text-[11px] text-slate-400">
              {status?.status === 'HEALTHY'
                ? 'Traffic is routing through the primary shortest path S1-S2-S4.'
                : 'Traffic has automatically self-healed through alternate route S1-S3-S4!'}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Stream Log Section */}
      <EventLogStream events={events} maxDisplay={15} />
    </div>
  );
};
