import React, { useState } from 'react';
import { NetworkEvent } from '../types/sdn';

interface EventLogStreamProps {
  events: NetworkEvent[];
  maxDisplay?: number;
}

export const EventLogStream: React.FC<EventLogStreamProps> = ({ events, maxDisplay = 20 }) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filterLevel === 'ALL') return true;
    return e.level === filterLevel;
  }).slice(0, maxDisplay);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">SUCCESS</span>;
      case 'WARN':
        return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">WARN</span>;
      case 'ERROR':
        return <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">ERROR</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px]">INFO</span>;
    }
  };

  return (
    <div className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-base">📜</span>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Real-Time Event Stream Log</h3>
        </div>

        {/* Level Filters */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px]">
          {['ALL', 'INFO', 'WARN', 'SUCCESS', 'ERROR'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2 py-0.5 rounded font-mono transition-all ${
                filterLevel === lvl
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Stream Area */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">No events logged yet</div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id || evt.timestamp}
              className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start justify-between space-x-3 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-start space-x-2.5">
                <span className="text-[10px] text-slate-500 mt-0.5 shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    {getLevelBadge(evt.level)}
                    <span className="text-slate-400 text-[10px] font-bold">[{evt.source}]</span>
                    <span className="text-slate-300 font-semibold">{evt.event_type}</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px] font-sans">{evt.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
