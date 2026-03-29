import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function AutoSnipePanel({ itemId, currentPrice, snipeActive, snipeInfo, onSnipeSet, onCancel }) {
  const [maxBudget,    setMaxBudget]    = useState('');
  const [increment,    setIncrement]    = useState('50');
  const [snipeSeconds, setSnipeSeconds] = useState('30');
  const [error,        setError]        = useState('');

  const activate = () => {
    const budget = parseFloat(maxBudget);
    const inc    = parseFloat(increment);
    if (isNaN(budget) || budget <= (currentPrice || 0)) {
      setError(`Budget must exceed current price (${formatCurrency(currentPrice || 0)})`);
      return;
    }
    if (isNaN(inc) || inc <= 0) {
      setError('Increment must be a positive number');
      return;
    }
    setError('');
    onSnipeSet({ maxBudget: budget, increment: inc, snipeSeconds: Number(snipeSeconds) });
  };

  if (snipeActive) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-[10px] p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
          <p className="text-[12.5px] font-bold text-green-700">Auto-Snipe Active</p>
        </div>
        {snipeInfo && (
          <p className="text-[11.5px] text-green-600 mb-1">
            {snipeInfo.message}
          </p>
        )}
        <p className="text-[11px] text-green-600 mb-3">
          Max budget: {snipeInfo ? formatCurrency(snipeInfo.maxBudget) : '—'}
        </p>
        <button
          onClick={onCancel}
          className="w-full py-2 rounded-[7px] text-[12px] font-semibold
                     bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all">
          Cancel Snipe
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-secondary block mb-1">
          Max Budget (₹)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">₹</span>
          <input
            type="number" value={maxBudget}
            onChange={(e) => { setMaxBudget(e.target.value); setError(''); }}
            placeholder={(currentPrice ? currentPrice + 100 : 0).toString()}
            className="w-full pl-7 pr-3 py-2 bg-[rgba(26,24,37,0.05)] border border-[rgba(26,24,37,0.1)]
                       rounded-[7px] text-[13px] text-primary font-medium
                       focus:outline-none focus:border-accent/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-secondary block mb-1">
            Increment (₹)
          </label>
          <input
            type="number" value={increment}
            onChange={(e) => setIncrement(e.target.value)}
            className="w-full px-3 py-2 bg-[rgba(26,24,37,0.05)] border border-[rgba(26,24,37,0.1)]
                       rounded-[7px] text-[13px] text-primary font-medium
                       focus:outline-none focus:border-accent/40"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-secondary block mb-1">
            Fire At (s before end)
          </label>
          <select
            value={snipeSeconds}
            onChange={(e) => setSnipeSeconds(e.target.value)}
            className="w-full px-3 py-2 bg-[rgba(26,24,37,0.05)] border border-[rgba(26,24,37,0.1)]
                       rounded-[7px] text-[13px] text-primary font-medium
                       focus:outline-none focus:border-accent/40">
            <option value="60">60s</option>
            <option value="30">30s</option>
            <option value="10">10s</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-[6px] px-3 py-2">{error}</p>
      )}

      <button
        onClick={activate}
        className="w-full py-2.5 rounded-[8px] bg-[#1a1825] text-white text-[12.5px] font-semibold
                   hover:bg-[#2d2b3a] active:scale-[0.97] transition-all
                   flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        Activate Auto-Snipe
      </button>
    </div>
  );
}
