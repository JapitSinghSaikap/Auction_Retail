import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  outbid:              { bg: 'bg-orange-50',  border: 'border-orange-200', icon: '📣', accent: 'text-orange-600' },
  won:                 { bg: 'bg-yellow-50',  border: 'border-yellow-200', icon: '🏆', accent: 'text-yellow-600' },
  ending_soon:         { bg: 'bg-red-50',     border: 'border-red-200',    icon: '⏱️', accent: 'text-red-600'    },
  new_bid_on_listing:  { bg: 'bg-blue-50',    border: 'border-blue-200',   icon: '💰', accent: 'text-blue-600'   },
  battle_started:      { bg: 'bg-purple-50',  border: 'border-purple-200', icon: '⚔️', accent: 'text-purple-600' },
  chat_message:        { bg: 'bg-green-50',   border: 'border-green-200',  icon: '💬', accent: 'text-green-600'  },
  snipe_executed:      { bg: 'bg-accent/5',   border: 'border-accent/20',  icon: '🎯', accent: 'text-accent'     },
  snipe_failed:        { bg: 'bg-red-50',     border: 'border-red-200',    icon: '❌', accent: 'text-red-600'    },
};

export default function NotificationToast({ toast, onDismiss }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!toast) return null;

  const cfg = TYPE_CONFIG[toast.type] || { bg: 'bg-white', border: 'border-[rgba(26,24,37,0.12)]', icon: '🔔', accent: 'text-primary' };

  const handleClick = () => {
    onDismiss();
    if (toast.itemId) navigate(`/auction/${toast.itemId}`);
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] max-w-[340px] w-full
                  transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className={`${cfg.bg} border ${cfg.border} rounded-[12px]
                       shadow-[0_8px_32px_rgba(26,24,37,0.14)]
                       overflow-hidden`}>
        {/* Progress bar */}
        <div className="h-[2px] bg-[rgba(26,24,37,0.08)]">
          <div className="h-full bg-accent/50 animate-shrink" />
        </div>

        <div className="p-3.5 flex items-start gap-3">
          {/* Icon */}
          <div className="text-[20px] shrink-0 mt-0.5">{cfg.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-[12.5px] font-bold ${cfg.accent} truncate`}>{toast.title}</p>
            <p className="text-[11.5px] text-secondary mt-0.5 leading-snug line-clamp-2">{toast.message}</p>
            {toast.itemId && (
              <button
                onClick={handleClick}
                className={`text-[11px] font-semibold mt-1.5 ${cfg.accent} hover:underline`}
              >
                View auction →
              </button>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full
                       text-tertiary hover:text-primary hover:bg-[rgba(26,24,37,0.07)]
                       transition-colors mt-0.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .animate-shrink {
          animation: shrink 5s linear forwards;
        }
      `}</style>
    </div>
  );
}
