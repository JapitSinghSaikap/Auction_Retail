import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { formatCurrency } from '../utils/formatters';

export default function BidInput({ currentPrice, itemId, onBidPlaced, isExpired }) {
  const { user, token, isLoggedIn } = useAuth();
  const { emitBid, onBidSuccess, onBidError } = useSocket();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minBid = Math.floor(currentPrice) + 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const num = parseFloat(amount);
    if (!num || isNaN(num)) { setError('Please enter a valid amount.'); return; }
    if (num <= currentPrice) { setError(`Bid must exceed ${formatCurrency(currentPrice)}.`); return; }
    if (!isLoggedIn) { setError('You must be signed in.'); return; }

    setLoading(true);

    const successCleanup = onBidSuccess(() => {
      setLoading(false);
      setAmount('');
      if (onBidPlaced) onBidPlaced(num);
      successCleanup();
      errorCleanup();
    });

    const errorCleanup = onBidError((data) => {
      setLoading(false);
      setError(data.message || 'Failed to place bid.');
      successCleanup();
      errorCleanup();
    });

    setTimeout(() => { setLoading(false); successCleanup(); errorCleanup(); }, 8000);

    emitBid(itemId, user.id, num, token);
  };

  if (isExpired) {
    return (
      <div className="text-center py-3 text-secondary text-sm">This auction has ended.</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-sm font-medium">₹</span>
          <input
            type="number"
            className="input pl-7"
            placeholder={String(minBid)}
            value={amount}
            min={minBid}
            step="0.01"
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap px-6" disabled={loading || !amount}>
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : 'Place Bid'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
