import { useEffect, useRef } from 'react';

/**
 * Custom hook to poll an API endpoint or run a callback at regular intervals
 * @param {Function} callback - Function to execute at each tick
 * @param {Number} interval - Time in milliseconds between ticks (default 5000ms)
 * @param {Boolean} active - Control flag to dynamically enable/disable polling
 */
export function usePolling(callback, interval = 5000, active = true) {
  const savedCallback = useRef(callback);

  // Keep callback up to date
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up polling interval
  useEffect(() => {
    if (!active) return;

    const tick = () => {
      savedCallback.current();
    };

    // Run once immediately on start
    tick();

    const timerId = setInterval(tick, interval);

    return () => {
      clearInterval(timerId);
    };
  }, [interval, active]);
}
