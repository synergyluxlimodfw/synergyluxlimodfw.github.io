'use client';

import { useState, useEffect } from 'react';

function formatTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function useClock(intervalMs = 15_000): string {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return time;
}
