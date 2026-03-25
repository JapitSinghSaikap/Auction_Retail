import { useState, useEffect, useCallback } from 'react';

/**
 * Robustly parse any endTime value:
 *  – ISO string  "2026-03-25T18:30:00.000Z"
 *  – Numeric string "1748000000000"
 *  – JS number     1748000000000
 *  – Already a Date
 *  – null / undefined  → returns null
 */
function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  // Numeric timestamp (as number or string of digits)
  if (typeof value === 'number' || /^\d{10,13}$/.test(String(value))) {
    const ts = Number(value);
    // 10-digit  → seconds, 13-digit → milliseconds
    const ms = ts < 1e12 ? ts * 1000 : ts;
    const d  = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO / other string
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

const EXPIRED = { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };

export function useCountdown(endTime) {
  const getTimeLeft = useCallback(() => {
    const end = parseDate(endTime);
    if (!end) return EXPIRED;                       // invalid date → treat as expired

    const diff = end - Date.now();
    if (diff <= 0) return EXPIRED;

    return {
      days:      Math.floor(diff / 86_400_000),
      hours:     Math.floor(diff / 3_600_000)   % 24,
      minutes:   Math.floor(diff /    60_000)   % 60,
      seconds:   Math.floor(diff /     1_000)   % 60,
      isExpired: false,
    };
  }, [endTime]);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    // Re-initialise immediately whenever endTime changes
    setTimeLeft(getTimeLeft());

    const id = setInterval(() => {
      const next = getTimeLeft();
      setTimeLeft(next);
      if (next.isExpired) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [getTimeLeft]);

  return timeLeft;
}

export default useCountdown;
