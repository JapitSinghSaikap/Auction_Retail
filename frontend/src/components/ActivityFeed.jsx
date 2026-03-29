import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useActivityFeed from '../hooks/useActivityFeed';
import { resolveImageUrl } from '../utils/imageUrl';

function timeAgoShort(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const s    = Math.floor(diff / 1000);
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_BORDER = {
  bid:    'border-l-accent',
  battle: 'border-l-orange-500',
  won:    'border-l-yellow-500',
  ended:  'border-l-secondary',
};

export default function ActivityFeed() {
  const navigate = useNavigate();
  const { activities, isConnected } = useActivityFeed();
  const [ticks, setTicks] = useState(0);

  // Refresh timestamps every 30s
  useEffect(() => {
    const t = setInterval(() => setTicks((c) => c + 1), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(26,24,37,0.08)]
                    shadow-[0_1px_4px_rgba(26,24,37,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-[rgba(26,24,37,0.07)]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-[rgba(26,24,37,0.2)]'}`} />
          <span className="text-[13px] font-bold text-primary">Live Activity</span>
        </div>
        {activities.length > 0 && (
          <span className="text-[10px] text-tertiary tabular-nums">{activities.length} events</span>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[360px]"
           style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(26,24,37,0.12) transparent' }}>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="text-3xl mb-2">📡</div>
            <p className="text-[12.5px] font-medium text-secondary">No activity yet</p>
            <p className="text-[11px] text-tertiary mt-1">Bids will appear here in real time.</p>
          </div>
        ) : (
          activities.map((act, idx) => (
            <button
              key={`${act.timestamp}_${idx}`}
              onClick={() => act.itemId && navigate(`/auction/${act.itemId}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left
                         border-b border-[rgba(26,24,37,0.05)] last:border-0
                         border-l-2 ${TYPE_BORDER[act.type] || 'border-l-transparent'}
                         hover:bg-[rgba(26,24,37,0.02)] transition-colors
                         activity-item`}
            >
              {/* Thumbnail */}
              {act.itemImage ? (
                <img
                  src={resolveImageUrl(act.itemImage)}
                  alt=""
                  className="w-9 h-9 rounded-[7px] object-cover shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-9 h-9 rounded-[7px] bg-[rgba(26,24,37,0.07)] flex items-center
                                justify-center text-[16px] shrink-0">
                  {act.icon}
                </div>
              )}

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-primary leading-snug truncate">
                  {act.message}
                </p>
                <p className="text-[10.5px] text-tertiary mt-0.5">{timeAgoShort(act.timestamp)}</p>
              </div>

              {/* Arrow */}
              {act.itemId && (
                <svg className="w-3.5 h-3.5 text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))
        )}
      </div>

      <style>{`
        .activity-item { animation: slideDown 0.25s ease; }
        @keyframes slideDown {
          from { opacity:0; transform: translateY(-8px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
