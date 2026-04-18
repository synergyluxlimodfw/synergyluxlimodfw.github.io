/**
 * lib/experienceStore.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Module-level singleton store. No external dependencies.
 * Uses React 18's useSyncExternalStore for tearing-safe subscriptions.
 * Persists to sessionStorage so the experience page survives a refresh.
 *
 * Future-ready shape: toRidePayload() maps directly to the backend API.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export type ExperienceStatus = 'idle' | 'preparing' | 'ready' | 'active' | 'complete';

export interface ExperienceState {
  // Guest identity
  guestName:    string;
  destination:  string;
  occasion:     string;
  // Chauffeur (future: resolve from API by chauffeurId)
  chauffeurName: string;
  eta:           number; // minutes
  // Cabin preferences
  temperature:  number; // °F
  music:        boolean;
  notes:        string;
  // System
  status: ExperienceStatus;
  rideId: string | null;
}

/** Future backend payload shape — no business logic depends on this yet */
export interface RidePayload {
  rideId:       string | null;
  guestName:    string;
  destination:  string;
  occasion:     string;
  chauffeurId:  string | null;
  chauffeurName: string;
  etaMinutes:   number;
  preferences: {
    temperatureF: number;
    music:        boolean;
    notes:        string;
  };
}

// ── Defaults ───────────────────────────────────────────────────────────────

const DEFAULTS: ExperienceState = {
  guestName:    '',
  destination:  '',
  occasion:     '',
  chauffeurName: 'W. Rodriguez',
  eta:          24,
  temperature:  72,
  music:        false,
  notes:        '',
  status:       'idle',
  rideId:       null,
};

// ── Session persistence ────────────────────────────────────────────────────

const STORAGE_KEY = 'slux_exp';

function persist(s: ExperienceState): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* blocked */ }
}

function readStorage(): ExperienceState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

// ── Module singleton ───────────────────────────────────────────────────────

let _state: ExperienceState = { ...DEFAULTS };
const _subscribers = new Set<() => void>();

function commit(patch: Partial<ExperienceState>): void {
  _state = { ..._state, ...patch };
  persist(_state);
  _subscribers.forEach(fn => fn());
}

// ── Store API ──────────────────────────────────────────────────────────────

export const experienceStore = {

  /** Call once in a client useEffect to restore persisted state. */
  hydrate(): void {
    if (typeof window === 'undefined') return;
    _state = readStorage();
    _subscribers.forEach(fn => fn());
  },

  setRideId(id: string): void {
    commit({ rideId: id });
  },

  setBasicInfo(info: { guestName: string; destination: string; occasion: string; chauffeurName?: string }): void {
    commit(info);
  },

  setPreferences(prefs: { temperature: number; music: boolean; notes: string }): void {
    commit(prefs);
  },

  /**
   * Sets status → 'preparing' immediately, then 'ready' after ~1.2 s.
   * Non-blocking — caller should navigate while this runs.
   */
  launchExperience(): void {
    commit({ status: 'preparing' });
    setTimeout(() => commit({ status: 'ready' }), 1200);
  },

  /**
   * Populate store from a Supabase `rides` row — called by the realtime
   * subscription so the UI reflects DB state instantly.
   * Does NOT overwrite temperature / music (not stored in DB schema).
   */
  loadFromRide(row: {
    id: string;
    guest_name: string;
    destination: string;
    occasion: string | null;
    chauffeur: string;
    eta_minutes: number;
    status: string;
    vip_note: string | null;
  }): void {
    commit({
      guestName:     row.guest_name,
      destination:   row.destination,
      occasion:      row.occasion ?? '',
      chauffeurName: row.chauffeur,
      eta:           row.eta_minutes,
      notes:         row.vip_note ?? '',
      status:        row.status as ExperienceStatus,
      rideId:        row.id,
    });
  },

  /** Ride is actively in progress — chauffeur has picked up the guest. */
  setActive(): void {
    commit({ status: 'active' });
    if (_state.rideId) {
      supabase.from('rides').update({ status: 'active' }).eq('id', _state.rideId).then(() => {});
    }
  },

  /** Ride is complete — triggers transition to thank-you + gratuity screen. */
  completeRide(): void {
    commit({ status: 'complete' });
    if (_state.rideId) {
      supabase.from('rides').update({ status: 'complete' }).eq('id', _state.rideId).then(() => {});
    }
  },

  reset(): void {
    _state = { ...DEFAULTS };
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* blocked */ }
    _subscribers.forEach(fn => fn());
  },

  /** Returns current state snapshot — for debugging only. */
  getState(): ExperienceState { return _state; },

  /** Maps current state to the backend POST /ride/start shape. */
  toRidePayload(): RidePayload {
    return {
      rideId:        null,
      guestName:     _state.guestName,
      destination:   _state.destination,
      occasion:      _state.occasion,
      chauffeurId:   null,
      chauffeurName: _state.chauffeurName,
      etaMinutes:    _state.eta,
      preferences: {
        temperatureF: _state.temperature,
        music:        _state.music,
        notes:        _state.notes,
      },
    };
  },
};

// ── useSyncExternalStore hook (React 18, tearing-safe) ─────────────────────

function subscribe(fn: () => void): () => void {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
}

/** Server snapshot: always returns idle defaults (no sessionStorage on server). */
function getServerSnapshot(): ExperienceState { return DEFAULTS; }
function getSnapshot(): ExperienceState { return _state; }

export function useExperienceStore(): ExperienceState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
