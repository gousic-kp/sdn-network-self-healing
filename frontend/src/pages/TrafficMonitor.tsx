import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrafficStat } from '../types/sdn';

export const TrafficMonitor: React.FC = () => {
  const [trafficHistory, setTrafficHistory] = useState<TrafficStat[]>([]);
  const [currentStat, setCurrentStat] = useState<TrafficStat | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getStatistics();
        setTrafficHistory(res.traffic_history || []);
        if (res.traffic_history.length > 0) {
          setCurrentStat(res.traffic_history[res.traffic_history.length - 1]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 select-none">
      <div>
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Real-Time Network Traffic Monitor</h2>
        <p className="text-xs text-slate-400">
          Live OpenFlow switch port throughput, byte rates, packet loss, and latency metrics extracted directly from Ryu & OVS engine.
        </p>
      </div>

      {/* Traffic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Throughput (BPS)</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {currentStat ? `${(currentStat.bytes_per_sec / 1000).toFixed(1)} KB/s` : '0 KB/s'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Packet Rate (PPS)</div>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
            {currentStat ? `${currentStat.packets_per_sec} pps` : '0 pps'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Link Utilization</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {currentStat ? `${currentStat.bandwidth_util_pct}%` : '0%'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">RTT Latency & Loss</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {currentStat ? `${currentStat.latency_ms} ms (${currentStat.packet_loss_pct}%)` : '0 ms'}
          </div>
        </div>
      </div>

      {/* Real-Time SVG Sparkline Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bytes Per Second Chart */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Bandwidth Throughput Stream</h3>
          <div className="h-44 w-full bg-slate-900/60 rounded-lg p-2 flex items-end justify-between space-x-1 border border-slate-800/80">
            {trafficHistory.slice(-25).map((stat, idx) => {
              const maxBps = 600000;
              const heightPct = Math.min(100, Math.max(10, (stat.bytes_per_sec / maxBps) * 100));
              return (
                <div
                  key={idx}
                  className="w-full bg-cyan-500/80 hover:bg-cyan-400 rounded-t transition-all"
                  style={{ height: `${heightPct}%` }}
                  title={`${stat.bytes_per_sec} B/s at ${new Date(stat.timestamp).toLocaleTimeString()}`}
                />
              );
            })}
          </div>
        </div>

        {/* Latency Stream Chart */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Latency & Packet Loss Stream</h3>
          <div className="h-44 w-full bg-slate-900/60 rounded-lg p-2 flex items-end justify-between space-x-1 border border-slate-800/80">
            {trafficHistory.slice(-25).map((stat, idx) => {
              const maxLat = 50;
              const heightPct = Math.min(100, Math.max(10, (stat.latency_ms / maxLat) * 100));
              return (
                <div
                  key={idx}
                  className={`w-full rounded-t transition-all ${
                    stat.latency_ms > 10 ? 'bg-rose-500/80' : 'bg-emerald-500/80'
                  }`}
                  style={{ height: `${heightPct}%` }}
                  title={`${stat.latency_ms} ms at ${new Date(stat.timestamp).toLocaleTimeString()}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
