import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FailureEvent } from '../types/sdn';

interface FailuresPageProps {
  onRestoreLink: (linkId: string) => Promise<any>;
}

export const FailuresPage: React.FC<FailuresPageProps> = ({ onRestoreLink }) => {
  const [failures, setFailures] = useState<FailureEvent[]>([]);

  const loadFailures = async () => {
    try {
      const data = await api.getFailures();
      setFailures(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFailures();
    const interval = setInterval(loadFailures, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Network Failures & Self-Healing Log</h2>
          <p className="text-xs text-slate-400">
            Historical log of all detected link failures, affected flows, alternate calculated paths, and recovery duration metrics.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Link ID</th>
                <th className="p-3">Failure Type</th>
                <th className="p-3">Previous Path</th>
                <th className="p-3">Alternate Path</th>
                <th className="p-3">Recovery Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {failures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 font-sans">
                    No failure events recorded yet. Click "Simulate Link Failure" above to trigger a test event.
                  </td>
                </tr>
              ) : (
                failures.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/60">
                    <td className="p-3 text-slate-400">
                      {new Date(f.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-rose-400">{f.link_id}</td>
                    <td className="p-3 text-slate-300">{f.failure_type}</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">
                      {f.previous_path ? f.previous_path.join(' → ') : '-'}
                    </td>
                    <td className="p-3 text-emerald-400 font-sans font-semibold text-[11px]">
                      {f.alternate_path ? f.alternate_path.join(' → ') : 'None Available'}
                    </td>
                    <td className="p-3 font-bold text-cyan-400">
                      {f.recovery_time_sec ? `${f.recovery_time_sec}s` : '-'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          f.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={async () => {
                          await onRestoreLink(f.link_id);
                          loadFailures();
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold"
                      >
                        Restore Link
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
