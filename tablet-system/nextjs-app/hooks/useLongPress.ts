'use client';

import { useRef, useCallback } from 'react';

/**
 * Returns event handlers that fire `callback` after `duration` ms of continuous press.
 * Works on both mouse and touch.
 */
export function useLongPress(callback: () => void, duration = 3000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, duration);
  }, [callback, duration]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown:  start,
    onMouseUp:    cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd:   cancel,
  };
}
