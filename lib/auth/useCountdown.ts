import { useEffect, useState } from 'react';

/**
 * Counts down from `seconds` once per second. Returns the seconds left (0 when done).
 * Passing a new positive `seconds` restarts it; `null`/0 stops it.
 */
export function useCountdown(seconds: number | null): number {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!seconds || seconds <= 0) {
      const reset = setTimeout(() => setLeft(0), 0);
      return () => clearTimeout(reset);
    }
    const end = Date.now() + seconds * 1000;
    const tick = () => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(() => {
      tick();
      if (Date.now() >= end) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return left;
}
