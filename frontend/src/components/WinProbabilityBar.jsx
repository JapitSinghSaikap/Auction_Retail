import React from 'react';

export default function WinProbabilityBar({ probability = 0 }) {
  const pct   = Math.min(100, Math.max(0, probability));
  const color = pct >= 60 ? '#22c55e' : pct >= 30 ? '#f97316' : '#ef4444';
  const label = pct >= 60 ? 'Strong' : pct >= 30 ? 'Fair' : 'Low';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-secondary">Win Probability</span>
        <span className="text-[13px] font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-[rgba(26,24,37,0.08)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10.5px] text-secondary mt-1">{label} chance of winning</p>
    </div>
  );
}
