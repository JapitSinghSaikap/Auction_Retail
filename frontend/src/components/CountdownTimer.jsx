import React from 'react';
import { useCountdown } from '../hooks/useCountdown';

/**
 * CountdownTimer
 * Props:
 *   endTime  – any date-like value (ISO string, timestamp, Date)
 *   className – extra classes
 *   large    – show 4-column digit blocks (for Auction Detail page)
 */
export default function CountdownTimer({ endTime, className = '', large = false }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(endTime);

  // Guard: if values are somehow still NaN (shouldn't happen after hook fix) show dashes
  const safe = (n) => (Number.isFinite(n) ? n : 0);
  const pad   = (n) => String(safe(n)).padStart(2, '0');

  const d = safe(days);
  const h = safe(hours);
  const m = safe(minutes);
  const s = safe(seconds);

  if (isExpired) {
    return (
      <span className={`text-[11px] font-bold uppercase tracking-wider text-tertiary ${className}`}>
        Ended
      </span>
    );
  }

  const isUrgent = d === 0 && h < 1;
  const urgentCls = isUrgent ? 'text-live-red' : '';

  /* ── Large 4-block countdown (Auction Detail bid card) ─────────── */
  if (large) {
    return (
      <div className={`flex items-end gap-3 ${className}`}>
        {[
          { value: pad(d), label: 'Days'  },
          { value: pad(h), label: 'Hours' },
          { value: pad(m), label: 'Min'   },
          { value: pad(s), label: 'Sec'   },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center min-w-[38px]">
            <span className={`text-[30px] font-bold tabular-nums leading-none
              ${isUrgent ? 'text-live-red' : 'text-primary'}`}>
              {value}
            </span>
            <span className="text-[9px] font-bold text-tertiary uppercase tracking-widest mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  /* ── Compact inline timer (cards / tables) ──────────────────────── */
  return (
    <span className={`text-[12px] font-semibold tabular-nums ${urgentCls || 'text-secondary'} ${className}`}>
      {d > 0 ? `${d}d ` : ''}{pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
