'use client';

// ─────────────────────────────────────────────────────────
// Event Tracking — localStorage-backed, works offline
// ─────────────────────────────────────────────────────────

export type EventName =
  | 'ride_started'
  | 'midway_prompt'
  | 'pre_dropoff_prompt'
  | 'ride_completed'
  | 'rebook_clicked'
  | 'viewed_offer'
  | 'clicked_book'
  | 'completed_payment';

export type TrackEvent = {
  name: EventName;
  timestamp: string;
  meta?: Record<string, string>;
};

export type ConversionMetrics = {
  ridesStarted:      number;
  midwayPrompts:     number;
  preDropPrompts:    number;
  ridesCompleted:    number;
  rebookClicks:      number;
  conversionRate:    number; // rebookClicks / ridesStarted * 100
  offerViews:        number;
  bookClicks:        number;
  completedPayments: number;
};

const STORAGE_KEY = 'slux_events';

function safeRead(): TrackEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackEvent[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(events: TrackEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep last 500 events to avoid unbounded growth
    const trimmed = events.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or blocked — fail silently
  }
}

export function track(name: EventName, meta?: Record<string, string>): void {
  const event: TrackEvent = {
    name,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta } : {}),
  };
  console.log(`[SLUX] ${name}`, meta ?? '');

  const events = safeRead();
  events.push(event);
  safeWrite(events);
}

export function getEvents(): TrackEvent[] {
  return safeRead().reverse(); // newest first
}

export function getMetrics(): ConversionMetrics {
  const events = safeRead();
  const count = (name: EventName) => events.filter(e => e.name === name).length;

  const ridesStarted      = count('ride_started');
  const rebookClicks      = count('rebook_clicked');
  const bookClicks        = count('clicked_book');
  const completedPayments = count('completed_payment');
  const conversionRate    = ridesStarted > 0
    ? Math.round((rebookClicks / ridesStarted) * 100)
    : 0;

  return {
    ridesStarted,
    midwayPrompts:  count('midway_prompt'),
    preDropPrompts: count('pre_dropoff_prompt'),
    ridesCompleted: count('ride_completed'),
    rebookClicks,
    conversionRate,
    offerViews:        count('viewed_offer'),
    bookClicks,
    completedPayments,
  };
}

export function clearEvents(): void {
  safeWrite([]);
}
