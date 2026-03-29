import React from 'react';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { formatCurrency, truncate } from '../utils/formatters';
import { resolveImageUrl } from '../utils/imageUrl';

export default function AuctionCard({ item }) {
  const navigate = useNavigate();
  const imageUrl = resolveImageUrl(item.image, item.title);

  return (
    <div
      className="card overflow-hidden flex flex-col cursor-pointer group
                 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
      onClick={() => navigate(`/auction/${item.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-surface h-48 rounded-t-card">
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          onError={(e) => { e.target.src = resolveImageUrl(null, item.title); }}
        />
        {/* LIVE badge */}
        {item.status === 'active' && (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm
                           rounded-pill px-2.5 py-1 text-xs font-bold text-live-red shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-live-red animate-pulse" />
            LIVE
          </span>
        )}
        {item.status === 'closed' && (
          <span className="absolute top-3 left-3 badge bg-primary/80 text-white backdrop-blur-sm text-[11px]">
            Ended
          </span>
        )}
        {/* Category */}
        {item.category && (
          <span className="absolute top-3 right-3 badge bg-white/90 backdrop-blur-sm text-secondary text-[11px] shadow-sm">
            {item.category.name}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs text-secondary mb-1">{item.seller?.name || 'Anonymous'}</p>
        <h3 className="text-[15px] font-semibold text-primary leading-snug mb-3">
          {truncate(item.title, 58)}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-xs text-secondary">Current bid</span>
          <span className="text-xl font-bold text-accent ml-auto">
            {formatCurrency(item.currentPrice)}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-[rgba(29,28,31,0.06)] flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <CountdownTimer endTime={item.endTime} />
            <span className="text-[11px] text-secondary">{item.bidCount ?? 0} bids</span>
          </div>
          <button
            className="btn-primary text-xs py-2 px-4"
            onClick={(e) => { e.stopPropagation(); navigate(`/auction/${item.id}`); }}
          >
            Bid Now
          </button>
        </div>
      </div>
    </div>
  );
}
