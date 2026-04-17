'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getMetrics, getEvents, clearEvents } from '@/lib/events';
import type { ConversionMetrics, TrackEvent } from '@/lib/events';

// ── Types ──────────────────────────────────────────────────

type MockRide = {
  id: string; guest: string; pickup: string; dropoff: string;
  chauffeur: string; eta: number; phase: string; time: string;
};

type CustomerLead = {
  id: string; name: string; phone: string; createdAt: string;
};

type FunnelStats = {
  viewed: number; clicked: number; completed: number; conversionRate: number;
};

// ── Mock data ──────────────────────────────────────────────

const MOCK_RIDES: MockRide[] = [
  { id: 'r1', guest: 'Mr. Smith',   pickup: 'Hotel Crescent Court', dropoff: 'DFW Terminal D',  chauffeur: 'James',  eta: 12, phase: 'ACTIVE',       time: '3:45 PM' },
  { id: 'r2', guest: 'Ms. Johnson', pickup: 'Rosewood Mansion',     dropoff: 'Downtown Dallas', chauffeur: 'Carlos', eta: 8,  phase: 'PRE DROP-OFF', time: '3:52 PM' },
  { id: 'r3', guest: 'Mr. Lee',     pickup: 'Ritz-Carlton Dallas',  dropoff: 'Love Field',      chauffeur: 'James',  eta: 0,  phase: 'COMPLETE',     time: '3:30 PM' },
];

const PHASE_COLORS: Record<string, string> = {
  'ACTIVE': '#C9A84C', 'MIDWAY': '#818CF8', 'PRE DROP-OFF': '#FCD34D', 'COMPLETE': '#4ADE80',
};

const EVENT_COLORS: Record<string, string> = {
  'ride_started': '#C9A84C', 'midway_prompt': '#818CF8', 'pre_dropoff_prompt': '#FCD34D',
  'ride_completed': '#4ADE80', 'rebook_clicked': '#F472B6',
  'viewed_offer': '#38BDF8', 'clicked_book': '#A78BFA', 'completed_payment': '#4ADE80',
};

// ── Component ──────────────────────────────────────────────

export default function AdminPage() {
  const [rides]       = useState<MockRide[]>(MOCK_RIDES);
  const [metrics,     setMetrics]     = useState<ConversionMetrics | null>(null);
  const [events,      setEvents]      = useState<TrackEvent[]>([]);
  const [customers,   setCustomers]   = useState<CustomerLead[]>([]);
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [apiError,    setApiError]    = useState(false);

  const refresh = useCallback(() => {
    // ── localStorage metrics (client-side events) ──
    setMetrics(getMetrics());
    setEvents(getEvents().slice(0, 50));

    // ── Server-side customer leads ──
    fetch('/api/customer')
      .then(r => r.json())
      .then(d => setCustomers(d.customers ?? []))
      .catch(() => setApiError(true));

    // ── Server-side funnel stats ──
    fetch('/api/track')
      .then(r => r.json())
      .then(d => setFunnelStats(d.stats ?? null))
      .catch(() => setApiError(true));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function handleClear() { clearEvents(); refresh(); }

  // ── Stat cards ─────────────────────────────────────────

  const rideStats = metrics ? [
    { label: 'Total Rides',     value: String(metrics.ridesStarted) },
    { label: 'Rebook Clicks',   value: String(metrics.rebookClicks) },
    { label: 'Conversion Rate', value: `${metrics.conversionRate}%` },
    { label: 'Completed',       value: String(metrics.ridesCompleted) },
  ] : null;

  const funnelCards = funnelStats ? [
    { label: 'Offer Views',      value: String(funnelStats.viewed),    color: '#38BDF8' },
    { label: 'Book Clicks',      value: String(funnelStats.clicked),   color: '#A78BFA' },
    { label: 'Payments Done',    value: String(funnelStats.completed), color: '#4ADE80' },
    { label: 'Pay Conv. Rate',   value: `${funnelStats.conversionRate}%`, color: '#C9A84C' },
  ] : null;

  return (
    <div className="min-h-screen bg-lux-black">

      {/* ── Header ──────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-8 h-16"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.14)' }}
      >
        <p className="text-[12px] font-semibold tracking-[4px] uppercase">
          SYNERGY <span className="text-gold">LUX</span>
        </p>
        <div className="flex items-center gap-4">
          <p className="text-[10px] tracking-[3px] uppercase text-lux-muted">Admin Dashboard</p>
          <button
            onClick={refresh}
            className="text-[10px] tracking-[2px] uppercase text-gold/70 hover:text-gold transition-colors px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid rgba(201,168,76,0.20)' }}
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-12">

        {/* ── 1. Ride Conversion Metrics (localStorage) ── */}
        {rideStats && (
          <section>
            <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted mb-4">
              In-Car Ride Tracking
            </p>
            <div className="grid grid-cols-4 gap-4">
              {rideStats.map((stat, i) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} delay={i * 0.06} />
              ))}
            </div>
          </section>
        )}

        {/* ── 2. Booking Funnel (server-side /api/track) ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted">
              Booking Funnel
            </p>
            {apiError && (
              <p className="text-[10px] text-red-400 tracking-wide">
                API data unavailable — start the app to populate
              </p>
            )}
          </div>
          {funnelCards ? (
            <div className="grid grid-cols-4 gap-4">
              {funnelCards.map((card, i) => (
                <StatCard key={card.label} label={card.label} value={card.value} delay={i * 0.06} color={card.color} />
              ))}
            </div>
          ) : (
            <EmptyCard text="No funnel data yet — bookings will appear here after first session." />
          )}
        </section>

        {/* ── 3. Customer Leads (server-side /api/customer) ── */}
        <section>
          <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted mb-4">
            Customer Leads ({customers.length})
          </p>

          {customers.length === 0 ? (
            <EmptyCard text="No leads captured yet — customers appear here after entering their phone on the booking screen." />
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(201,168,76,0.10)' }}
            >
              {/* Table header */}
              <div
                className="grid grid-cols-[1fr_140px_180px_120px] px-5 py-3 text-[10px] tracking-[2px] uppercase"
                style={{ color: '#666672', borderBottom: '1px solid rgba(201,168,76,0.08)', background: '#0F0F14' }}
              >
                <span>Name</span>
                <span>Phone</span>
                <span>Captured</span>
                <span>Status</span>
              </div>

              {/* Rows */}
              {customers.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[1fr_140px_180px_120px] px-5 py-4 items-center"
                  style={{
                    borderBottom: i < customers.length - 1 ? '1px solid rgba(201,168,76,0.06)' : 'none',
                    background: i % 2 === 0 ? '#09090E' : '#0F0F14',
                  }}
                >
                  <p className="text-[13px] font-medium text-lux-white">{c.name}</p>
                  <p className="text-[12px] text-lux-muted tabular-nums">{c.phone}</p>
                  <p className="text-[11px] text-lux-muted/70 tabular-nums">
                    {new Date(c.createdAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[1.5px] uppercase rounded-full px-2.5 py-1 w-fit"
                    style={{ color: '#C9A84C', background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.20)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#C9A84C' }} />
                    Lead
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── 4. Event Log (localStorage) ─────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted">Event Log</p>
            {events.length > 0 && (
              <button
                onClick={handleClear}
                className="text-[10px] tracking-[2px] uppercase text-lux-muted hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {events.length === 0 ? (
            <EmptyCard text="No events yet — start a demo ride to see tracking in action." />
          ) : (
            <div className="space-y-1.5">
              {events.map((evt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-xl px-5 py-3 flex items-center gap-4"
                  style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.06)' }}
                >
                  <span
                    className="text-[9px] font-bold tracking-[2px] uppercase rounded-full px-2.5 py-1 flex-shrink-0"
                    style={{
                      color:      EVENT_COLORS[evt.name] ?? '#666672',
                      background: `${EVENT_COLORS[evt.name] ?? '#666672'}14`,
                      border:     `1px solid ${EVENT_COLORS[evt.name] ?? '#666672'}28`,
                    }}
                  >
                    {evt.name.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[12px] text-lux-muted flex-1">
                    {evt.meta ? Object.entries(evt.meta).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}
                  </span>
                  <span className="text-[11px] text-lux-muted/60 flex-shrink-0 tabular-nums">
                    {new Date(evt.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── 5. Active Rides (mock) ──────────────────────── */}
        <section>
          <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted mb-5">
            Active Rides (Mock)
          </p>
          <div className="space-y-3">
            {rides.map((ride, i) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 + 0.2 }}
                className="rounded-2xl p-5 grid grid-cols-[1fr_1fr_1fr_120px_80px] items-center gap-4"
                style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.08)' }}
              >
                <div>
                  <p className="text-[14px] font-medium text-lux-white">{ride.guest}</p>
                  <p className="text-[11px] text-lux-muted mt-0.5">{ride.time}</p>
                </div>
                <div>
                  <p className="text-[12px] text-lux-muted">From</p>
                  <p className="text-[13px] text-lux-white">{ride.pickup}</p>
                </div>
                <div>
                  <p className="text-[12px] text-lux-muted">To</p>
                  <p className="text-[13px] text-lux-white">{ride.dropoff}</p>
                </div>
                <div>
                  <p className="text-[12px] text-lux-muted">Chauffeur</p>
                  <p className="text-[13px] text-lux-white">{ride.chauffeur}</p>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block text-[10px] font-bold tracking-[2px] uppercase rounded-full px-3 py-1"
                    style={{
                      color:      PHASE_COLORS[ride.phase] ?? '#666672',
                      background: `${PHASE_COLORS[ride.phase] ?? '#666672'}18`,
                      border:     `1px solid ${PHASE_COLORS[ride.phase] ?? '#666672'}30`,
                    }}
                  >
                    {ride.phase}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 6. Quick Actions ────────────────────────────── */}
        <section className="grid grid-cols-4 gap-4">
          <ActionCard icon="+"  title="Start New Ride"   sub="Open operator panel"  href="/" />
          <ActionCard icon="↗"  title="View Experience"  sub="Live tablet preview"  href="/drivers" />
          <ActionCard icon="✓"  title="Success Page"     sub="Post-payment view"    href="/success" />
          <ActionCard icon="✦"  title="Synergy Lux"      sub="Return to main site"  href="https://synergyluxlimodfw.github.io" external />
        </section>

      </main>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────

function StatCard({ label, value, delay, color }: {
  label: string; value: string; delay: number; color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5"
      style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.10)' }}
    >
      <p className="text-[10px] tracking-[2.5px] uppercase text-lux-muted mb-2">{label}</p>
      <p
        className="font-serif-lux text-[36px] font-light leading-none"
        style={{ color: color ?? '#C9A84C' }}
      >
        {value}
      </p>
    </motion.div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.08)' }}
    >
      <p className="text-[12px] text-lux-muted tracking-wide">{text}</p>
    </div>
  );
}

function ActionCard({ icon, title, sub, href, external }: {
  icon: string; title: string; sub: string; href: string; external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block rounded-2xl p-5 transition-all duration-200 hover:border-gold/30 hover:bg-gold/[0.04]"
      style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.08)' }}
    >
      <span className="text-xl text-gold block mb-3">{icon}</span>
      <p className="text-[14px] font-medium text-lux-white mb-1">{title}</p>
      <p className="text-[12px] text-lux-muted">{sub}</p>
    </a>
  );
}
