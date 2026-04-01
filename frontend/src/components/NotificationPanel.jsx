import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/imageUrl';

const TYPE_CONFIG = {
  outbid:              { icon: '📣', color: 'text-orange-500', bg: 'bg-orange-50'  },
  won:                 { icon: '🏆', color: 'text-yellow-500', bg: 'bg-yellow-50'  },
  ending_soon:         { icon: '⏱️', color: 'text-red-500',    bg: 'bg-red-50'     },
  new_bid_on_listing:  { icon: '💰', color: 'text-blue-500',   bg: 'bg-blue-50'    },
  battle_started:      { icon: '⚔️', color: 'text-purple-500', bg: 'bg-purple-50'  },
  chat_message:        { icon: '💬', color: 'text-green-500',  bg: 'bg-green-50'   },
  snipe_executed:      { icon: '🎯', color: 'text-accent',     bg: 'bg-accent/5'   },
  snipe_failed:        { icon: '❌', color: 'text-red-500',    bg: 'bg-red-50'     },
};

function timeAgo(ts) {
  if (!ts) return 'just now';
  const date = new Date(Number(ts) || ts);
  const diff = Date.now() - date.getTime();
  if (isNaN(diff)) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationPanel({ notifications, unreadCount, onMarkRead, onMarkAllRead, onClose }) {
  const navigate = useNavigate();

  const handleClick = (notif) => {
    if (!notif.isRead) onMarkRead(notif.id);
    onClose();
    if (notif.itemId) navigate(`/auction/${notif.itemId}`);
  };

  return (
    <div
      className="absolute top-full right-0 mt-[14px] w-[360px]
                 bg-white rounded-[14px] border border-[rgba(26,24,37,0.09)]
                 shadow-[0_12px_40px_rgba(26,24,37,0.14)] z-50 overflow-hidden
                 animate-slideUp"
    >
      {/* Caret */}
      <span className="absolute -top-[5px] right-[18px] w-[10px] h-[10px]
                        bg-white border-l border-t border-[rgba(26,24,37,0.09)] rotate-45 z-10" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-[rgba(26,24,37,0.07)]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-primary">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold text-white bg-live-red
                             px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] font-medium text-accent hover:text-accent-dark transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[400px]"
           style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(26,24,37,0.12) transparent' }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-3xl mb-3">🔔</div>
            <p className="text-[13px] font-medium text-secondary">All caught up!</p>
            <p className="text-[11.5px] text-tertiary mt-1">You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || { icon: '🔔', color: 'text-secondary', bg: 'bg-surface' };
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left
                            border-b border-[rgba(26,24,37,0.05)] last:border-0
                            hover:bg-[rgba(26,24,37,0.02)] transition-colors
                            ${!notif.isRead ? 'bg-[rgba(0,113,227,0.03)]' : ''}`}
              >
                {/* Icon or item thumbnail */}
                {notif.item?.image ? (
                  <div className="relative shrink-0">
                    <img
                      src={resolveImageUrl(notif.item.image)}
                      alt=""
                      className="w-9 h-9 rounded-[7px] object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full
                                     ${cfg.bg} flex items-center justify-center text-[10px]
                                     border border-white`}>
                      {cfg.icon}
                    </span>
                  </div>
                ) : (
                  <div className={`w-9 h-9 rounded-[7px] ${cfg.bg} flex items-center
                                   justify-center text-[17px] shrink-0`}>
                    {cfg.icon}
                  </div>
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[12.5px] font-semibold leading-snug truncate
                                 ${!notif.isRead ? 'text-primary' : 'text-secondary'}`}>
                    {notif.title}
                  </p>
                  <p className="text-[11.5px] text-secondary mt-0.5 leading-snug line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10.5px] text-tertiary mt-1">{timeAgo(notif.createdAt)}</p>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[rgba(26,24,37,0.07)] text-center">
          <p className="text-[11px] text-tertiary">
            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
