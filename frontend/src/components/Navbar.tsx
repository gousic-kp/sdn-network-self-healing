import React, { useState, useEffect } from 'react';
import { NetworkStatus } from '../types/sdn';

interface NavbarProps {
  status: NetworkStatus | null;
  onOpenFailureModal: () => void;
  onRestoreAll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ status, onOpenFailureModal, onRestoreAll }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => setTimeStr(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    const state = status?.status || 'HEALTHY';
    switch (state) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
            ● HEALTHY
          </span>
        );
      case 'REROUTING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-bounce"></span>
            ⚡ REROUTING IN PROGRESS
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span>
            ⚠️ DEGRADED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-400 mr-2 animate-pulse"></span>
            ❌ CRITICAL FAILURE
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-10 select-none">
      <div className="flex items-center space-x-4">
        <div>{getStatusBadge()}</div>
        <div className="hidden md:flex items-center text-xs text-slate-400 space-x-2 font-mono bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
          <span className="text-slate-500">Active Path:</span>
          <span className="text-cyan-400 font-bold">{status?.active_path || 'H1 → S1 → S2 → S4 → H2'}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Simulation Controls */}
        <button
          onClick={onOpenFailureModal}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/40 transition-all flex items-center space-x-1.5 shadow-lg shadow-rose-950/20"
        >
          <span>⚡</span>
          <span>Simulate Link Failure</span>
        </button>

        <button
          onClick={onRestoreAll}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/40 transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-950/20"
        >
          <span>🔄</span>
          <span>Restore Links</span>
        </button>

        {/* System Time Clock */}
        <div className="hidden sm:block text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
          {timeStr}
        </div>
      </div>
    </header>
  );
};
