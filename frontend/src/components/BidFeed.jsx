import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { formatCurrency, timeAgo } from '../utils/formatters';

export default function BidFeed({ initialBids = [], itemId }) {
  const [bids, setBids] = useState(() =>
    [...initialBids].sort((a, b) => b.amount - a.amount).slice(0, 10)
  );
  const { onBidUpdated } = useSocket();

  useEffect(() => {
    setBids([...initialBids].sort((a, b) => b.amount - a.amount).slice(0, 10));
  }, [initialBids]);

  useEffect(() => {
    const cleanup = onBidUpdated((data) => {
      if (String(data.itemId) !== String(itemId)) return;
      const newBid = {
        id: data.bidId || Date.now(),
        amount: data.newPrice,
        createdAt: data.timestamp,
        user: { id: data.bidderId, name: data.bidderName },
        isNew: true,
      };
      setBids((prev) => [newBid, ...prev].slice(0, 10));
    });
    return cleanup;
  }, [onBidUpdated, itemId]);

  if (bids.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-3">🔨</div>
        <p className="text-secondary text-sm">No bids yet. Be the first to bid!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-[rgba(29,28,31,0.06)]">
      {bids.map((bid, idx) => (
        <div
          key={bid.id}
          className={`flex items-center justify-between py-3.5 transition-all duration-300
            ${idx === 0 ? 'animate-slideUp' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${idx === 0 ? 'bg-accent text-white' : 'bg-surface text-secondary'}`}
            >
              {bid.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className={`text-sm font-medium ${idx === 0 ? 'text-primary' : 'text-secondary'}`}>
                {bid.user?.name || 'Unknown'}
                {idx === 0 && (
                  <span className="ml-2 badge bg-accent-light text-accent text-[10px] py-0.5">
                    Highest
                  </span>
                )}
              </p>
              <p className="text-xs text-secondary">{timeAgo(bid.createdAt)}</p>
            </div>
          </div>
          <span className={`font-bold text-sm ${idx === 0 ? 'text-accent' : 'text-primary'}`}>
            {formatCurrency(bid.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
