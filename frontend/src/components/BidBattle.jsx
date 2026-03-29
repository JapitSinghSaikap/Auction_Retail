import React from 'react';
import { formatCurrency } from '../utils/formatters';
import EmojiReactions from './EmojiReactions';

export default function BidBattle({ itemId, fighter1, fighter2, currentPrice, commentary, winner }) {
  if (winner) {
    return (
      <div className="rounded-[14px] bg-gradient-to-r from-yellow-500 to-orange-500 p-5 text-white text-center mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1">Battle Over</p>
        <p className="text-[18px] font-bold">🏆 {winner.name} wins the battle!</p>
        <p className="text-[13px] opacity-80 mt-1">Final price: {formatCurrency(currentPrice)}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] overflow-hidden border border-orange-200 mb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">⚡ Bid Battle</span>
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"/>
        </div>
        <span className="text-[11px] text-white/70 font-medium">LIVE</span>
      </div>

      <div className="bg-white p-4">
        {/* Fighters */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="text-center flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400
                            flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">
              {fighter1?.name?.[0]?.toUpperCase()}
            </div>
            <p className="text-[12px] font-bold text-primary truncate">{fighter1?.name || '—'}</p>
          </div>

          <div className="text-center px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-1">vs</p>
            <p className="text-[20px] font-bold text-primary">{formatCurrency(currentPrice || 0)}</p>
          </div>

          <div className="text-center flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-accent
                            flex items-center justify-center text-white font-bold text-sm mx-auto mb-1">
              {fighter2?.name?.[0]?.toUpperCase()}
            </div>
            <p className="text-[12px] font-bold text-primary truncate">{fighter2?.name || '—'}</p>
          </div>
        </div>

        {/* Emoji reactions */}
        <EmojiReactions itemId={itemId} />

        {/* Commentary */}
        {commentary.length > 0 && (
          <div className="mt-3 space-y-1 max-h-[72px] overflow-hidden">
            {commentary.slice(0, 3).map(({ text, id }) => (
              <p key={id} className="text-[11.5px] text-secondary leading-snug animate-slideIn">
                {text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
