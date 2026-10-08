import React from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'from-cyan-500/10 to-cyan-500/5 text-cyan-400 border-cyan-500/30',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/30',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-400 border-rose-500/30',
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/30',
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-b ${colorMap[color]} border backdrop-blur-md flex flex-col justify-between select-none shadow-lg transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">{value}</div>
        {subtitle && <div className="text-[11px] text-slate-400 font-sans mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
};
