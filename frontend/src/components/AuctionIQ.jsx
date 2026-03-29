import React, { useState } from 'react';
import useAuctionIQ from '../hooks/useAuctionIQ';
import WinProbabilityBar from './WinProbabilityBar';
import AutoSnipePanel from './AutoSnipePanel';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

function Stars({ score }) {
  const full  = Math.floor(score / 2);
  const half  = score % 2 >= 1 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span className="text-[13px]">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </span>
  );
}

export default function AuctionIQ({ itemId, currentPrice }) {
  const { user }   = useAuth();
  const [open,     setOpen]     = useState(true);
  const [snipeTab, setSnipeTab] = useState(false);
  const { analysis, isLoading, snipeActive, snipeInfo, setAutoSnipe, cancelSnipe, refresh } = useAuctionIQ(itemId);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white border border-[rgba(26,24,37,0.09)]
                   rounded-[12px] text-[13px] font-semibold text-primary hover:border-accent/30 transition-all">
        <span>🤖</span> AuctionIQ — Click to expand
      </button>
    );
  }

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.09)]
                    shadow-[0_2px_12px_rgba(26,24,37,0.07)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(26,24,37,0.07)]">
        <div className="flex items-center gap-2">
          <span className="text-[15px]">🤖</span>
          <span className="text-[13.5px] font-bold text-primary">AuctionIQ</span>
          <span className="text-[10px] font-semibold text-accent bg-[rgba(0,113,227,0.08)] px-1.5 py-0.5 rounded-full">
            AI Analysis
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={refresh}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-tertiary
                       hover:text-primary hover:bg-surface transition-all"
            title="Refresh analysis">
            <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-tertiary
                       hover:text-primary hover:bg-surface transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {isLoading && !analysis && (
          <div className="flex items-center gap-2 text-secondary text-[13px]">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Analysing auction…
          </div>
        )}

        {analysis && (
          <>
            {/* Win probability — only for logged-in buyers */}
            {user && (
              <WinProbabilityBar probability={analysis.winProbability} />
            )}

            {/* Analysis cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Suggested Bid',  value: formatCurrency(analysis.suggestedBid),  icon: '💡' },
                { label: 'Deal Score',     value: <span className="flex items-center gap-1"><Stars score={analysis.dealScore} /><span className="text-[11px]">{analysis.dealScore}/10</span></span>, icon: '⭐' },
                { label: 'Bid Velocity',   value: `${analysis.bidVelocity} bids/hr`,        icon: '⚡' },
                { label: 'Price Rise',     value: `+${analysis.priceRise}%`,                icon: '📈' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-[rgba(26,24,37,0.03)] rounded-[9px] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary mb-1">
                    {icon} {label}
                  </p>
                  <div className="text-[13px] font-bold text-primary">{value}</div>
                </div>
              ))}
            </div>

            {/* Shill warning */}
            {analysis.shillWarnings?.isSuspicious && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px]">⚠️</span>
                  <p className="text-[12px] font-bold text-red-700">Shill Bidding Detected</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${analysis.shillWarnings.riskLevel === 'High'
                      ? 'bg-red-200 text-red-700'
                      : 'bg-orange-100 text-orange-600'
                    }`}>
                    {analysis.shillWarnings.riskLevel} Risk
                  </span>
                </div>
                <ul className="space-y-1">
                  {analysis.shillWarnings.warnings.map((w, i) => (
                    <li key={i} className="text-[11.5px] text-red-600 flex items-start gap-1.5">
                      <span>•</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Auto-Snipe section */}
            <div>
              <button onClick={() => setSnipeTab((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2.5
                           bg-[rgba(26,24,37,0.03)] hover:bg-[rgba(26,24,37,0.06)]
                           rounded-[9px] transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">🎯</span>
                  <span className="text-[12.5px] font-semibold text-primary">Auto-Snipe</span>
                  {snipeActive && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600
                                     bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>Active
                    </span>
                  )}
                </div>
                <svg className={`w-3.5 h-3.5 text-tertiary transition-transform ${snipeTab ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {snipeTab && (
                <div className="mt-2">
                  {user ? (
                    <AutoSnipePanel
                      itemId={itemId}
                      currentPrice={currentPrice}
                      snipeActive={snipeActive}
                      snipeInfo={snipeInfo}
                      onSnipeSet={setAutoSnipe}
                      onCancel={cancelSnipe}
                    />
                  ) : (
                    <p className="text-[12px] text-secondary text-center py-3">
                      Log in to use Auto-Snipe
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {!analysis && !isLoading && (
          <p className="text-[12.5px] text-secondary text-center py-2">
            No analysis available yet.
          </p>
        )}
      </div>
    </div>
  );
}
