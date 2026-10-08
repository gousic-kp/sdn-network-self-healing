import React, { useState } from 'react';

export const SettingsPage: React.FC = () => {
  const [autoRecovery, setAutoRecovery] = useState(true);
  const [metricsInterval, setMetricsInterval] = useState('1.0');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="space-y-6 select-none max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Platform Configuration & Settings</h2>
        <p className="text-xs text-slate-400">
          Manage controller REST API parameters, WebSocket refresh intervals, and failure simulation triggers.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">SDN Self-Healing Engine Settings</h3>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Automatic Rerouting & Self-Healing</div>
              <div className="text-[11px] text-slate-400">Enable automatic Dijkstra path recalculation on link down</div>
            </div>
            <input
              type="checkbox"
              checked={autoRecovery}
              onChange={(e) => setAutoRecovery(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-200">Metrics Polling Interval (Seconds)</div>
            <input
              type="number"
              step="0.5"
              value={metricsInterval}
              onChange={(e) => setMetricsInterval(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {savedMsg && (
          <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono">
            ✅ Settings updated successfully!
          </div>
        )}

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-950/50"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
