import React from 'react';

export const MetricCard = ({ title, value, icon: Icon, color = 'emerald', onClick, clickable = false, subtitle }) => {
  const colorStyles = {
    emerald: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:border-emerald-600',
    blue: 'bg-blue-950/40 border-blue-800/60 text-blue-400 hover:border-blue-600',
    amber: 'bg-amber-950/40 border-amber-800/60 text-amber-400 hover:border-amber-600',
    rose: 'bg-rose-950/40 border-rose-800/60 text-rose-400 hover:border-rose-600',
    slate: 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500',
    indigo: 'bg-indigo-950/40 border-indigo-800/60 text-indigo-400 hover:border-indigo-600'
  };

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`border rounded-xl p-5 shadow-lg transition-all duration-200 ${colorStyles[color]} ${
        clickable ? 'cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold mt-2 text-slate-100 font-mono">
            {value !== undefined && value !== null ? value.toLocaleString() : '0'}
          </p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg shadow-inner">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {clickable && (
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center text-xs font-medium underline">
          Click to view detailed breakdown &rarr;
        </div>
      )}
    </div>
  );
};

export default MetricCard;
