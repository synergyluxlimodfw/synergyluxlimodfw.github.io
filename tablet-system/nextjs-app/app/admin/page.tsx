'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getMetrics, getEvents, clearEvents } from '@/lib/events';
import type { ConversionMetrics, TrackEvent } from '@/lib/events';
import { supabase } from '@/lib/supabase';

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
  const [liveRides,        setLiveRides]        = useState<any[]>([]);
  const [rebookRequests,   setRebookRequests]   = useState<any[]>([]);
  const [todayStats,       setTodayStats]       = useState({ rides: 0, revenue: 0, pending: 0 });

  const refresh = useCallback(async () => {
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

    // ── Fetch today's rides from Supabase ──
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRides } = await supabase
      .from('rides')
      .select('*')
      .gte('created_at', today)
      .order('created_at', { ascending: false });
    if (todayRides) setLiveRides(todayRides);

    // ── Fetch rebook requests ──
    const { data: rebooks } = await supabase
      .from('rebook_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (rebooks) setRebookRequests(rebooks);

    // ── Today stats ──
    setTodayStats({
      rides:   todayRides?.length || 0,
      revenue: (todayRides?.length || 0) * 165,
      pending: rebooks?.filter((r: any) => r.status === 'pending').length || 0,
    });
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

        {/* ── 0. Today Stats (live Supabase) ─────────────── */}
        <section>
          <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted mb-4">
            Today
          </p>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Rides Today"      value={String(todayStats.rides)}   delay={0}    color="#C9A84C" />
            <StatCard label="Est. Revenue"     value={`$${todayStats.revenue}`}   delay={0.06} color="#4ADE80" />
            <StatCard label="Pending Rebooks"  value={String(todayStats.pending)} delay={0.12} color="#FCD34D" />
          </div>
        </section>

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

        {/* ── 5. Active Rides (live) ──────────────────────── */}
        <section>
          <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted mb-5">
            Today&apos;s Rides
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {liveRides.length === 0 ? (
              <p style={{ color: 'rgba(240,236,228,0.3)', fontSize: 13, fontWeight: 300, fontFamily: 'sans-serif', padding: '20px 0' }}>
                No rides today yet.
              </p>
            ) : liveRides.map((ride) => (
              <div key={ride.id} style={{
                background: 'rgba(180,155,110,0.06)',
                border: '0.5px solid rgba(180,155,110,0.15)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <p style={{ color: '#f0ece4', fontSize: 14, fontWeight: 400, fontFamily: 'sans-serif', marginBottom: 4, textTransform: 'capitalize' }}>
                    {ride.guest_name || 'Guest'}
                  </p>
                  <p style={{ color: 'rgba(240,236,228,0.4)', fontSize: 12, fontWeight: 300, fontFamily: 'sans-serif' }}>
                    → {ride.destination || 'Unknown destination'}
                  </p>
                </div>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontFamily: 'sans-serif',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  background: ride.status === 'active' ? 'rgba(34,197,94,0.15)' :
                              ride.status === 'complete' ? 'rgba(180,155,110,0.15)' :
                              'rgba(255,255,255,0.06)',
                  color: ride.status === 'active' ? 'rgba(34,197,94,0.9)' :
                         ride.status === 'complete' ? 'rgba(180,155,110,0.8)' :
                         'rgba(255,255,255,0.4)',
                  border: `0.5px solid ${ride.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  {ride.status || 'preparing'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Rebook Requests ──────────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: 'rgba(180,155,110,0.8)', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 300, fontFamily: 'sans-serif', marginBottom: 16 }}>
            Rebook Requests
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rebookRequests.length === 0 ? (
              <p style={{ color: 'rgba(240,236,228,0.3)', fontSize: 13, fontWeight: 300, fontFamily: 'sans-serif', padding: '20px 0' }}>
                No rebook requests yet.
              </p>
            ) : rebookRequests.map((r) => (
              <div key={r.id} style={{
                background: 'rgba(180,155,110,0.06)',
                border: '0.5px solid rgba(180,155,110,0.15)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#f0ece4', fontSize: 14, fontWeight: 400, fontFamily: 'sans-serif', marginBottom: 4, textTransform: 'capitalize' }}>
                    {r.passenger_name || 'Guest'}
                  </p>
                  <p style={{ color: 'rgba(240,236,228,0.4)', fontSize: 12, fontWeight: 300, fontFamily: 'sans-serif' }}>
                    {r.pickup ? `${r.pickup} → ` : ''}{r.destination || 'Unknown route'}
                  </p>
                  {r.phone && (
                    <p style={{ color: 'rgba(180,155,110,0.5)', fontSize: 11, fontWeight: 300, fontFamily: 'sans-serif', marginTop: 4 }}>
                      {r.phone}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontFamily: 'sans-serif',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    background: r.status === 'confirmed' ? 'rgba(34,197,94,0.15)' : 'rgba(255,165,0,0.1)',
                    color: r.status === 'confirmed' ? 'rgba(34,197,94,0.9)' : 'rgba(255,165,0,0.8)',
                    border: `0.5px solid ${r.status === 'confirmed' ? 'rgba(34,197,94,0.3)' : 'rgba(255,165,0,0.2)'}`,
                  }}>
                    {r.status || 'pending'}
                  </div>
                  {r.confirm_token && r.status !== 'confirmed' && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_BASE_URL}/confirm?token=${r.confirm_token}`}
                      style={{
                        fontSize: 11,
                        color: 'rgba(180,155,110,0.7)',
                        fontFamily: 'sans-serif',
                        textDecoration: 'none',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Confirm →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. Quick Actions ────────────────────────────── */}
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
