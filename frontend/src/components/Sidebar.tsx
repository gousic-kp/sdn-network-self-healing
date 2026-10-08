import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'topology', label: 'Live Topology', icon: '🕸️' },
    { id: 'traffic', label: 'Traffic Monitor', icon: '📈' },
    { id: 'failures', label: 'Failures Log', icon: '⚠️' },
    { id: 'rerouting', label: 'Rerouting History', icon: '⚡' },
    { id: 'events', label: 'Network Events', icon: '📜' },
    { id: 'controller', label: 'Ryu Controller', icon: '🎛️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-wide uppercase">SDN HealNet</h1>
            <p className="text-[10px] text-cyan-400 font-mono tracking-wider">AUTO REROUTING v1.0</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-inner font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 m-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>OpenFlow 1.3</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">Controller: Ryu SDN Engine</p>
        <p className="text-[10px] text-slate-500 font-mono">Topology: S1..S4 Diamond</p>
      </div>
    </aside>
  );
};
