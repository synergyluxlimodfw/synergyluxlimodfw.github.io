'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type MockRide = {
  id: string;
  guest: string;
  pickup: string;
  dropoff: string;
  chauffeur: string;
  eta: number;
  phase: string;
  time: string;
};

const MOCK_RIDES: MockRide[] = [
  { id: 'r1', guest: 'Mr. Smith',   pickup: 'Hotel Crescent Court', dropoff: 'DFW Terminal D', chauffeur: 'James', eta: 12, phase: 'ACTIVE',   time: '3:45 PM' },
  { id: 'r2', guest: 'Ms. Johnson', pickup: 'Rosewood Mansion',     dropoff: 'Downtown Dallas', chauffeur: 'Carlos', eta: 8, phase: 'PRE DROP-OFF', time: '3:52 PM' },
  { id: 'r3', guest: 'Mr. Lee',     pickup: 'Ritz-Carlton Dallas',  dropoff: 'Love Field',      chauffeur: 'James', eta: 0, phase: 'COMPLETE', time: '3:30 PM' },
];

const STATS = [
  { label: 'Active Rides',   value: '2' },
  { label: 'Rides Today',    value: '7' },
  { label: 'Revenue Today',  value: '$1,240' },
  { label: 'Avg ETA',        value: '18 min' },
];

const PHASE_COLORS: Record<string, string> = {
  'ACTIVE':       '#C9A84C',
  'MIDWAY':       '#818CF8',
  'PRE DROP-OFF': '#FCD34D',
  'COMPLETE':     '#4ADE80',
};

export default function AdminPage() {
  const [rides] = useState<MockRide[]>(MOCK_RIDES);

  return (
    <div className="min-h-screen bg-lux-black">

      {/* Header */}
      <header
        className="flex items-center justify-between px-8 h-16"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.14)' }}
      >
        <p className="text-[12px] font-semibold tracking-[4px] uppercase">
          SYNERGY <span className="text-gold">LUX</span>
        </p>
        <p className="text-[10px] tracking-[3px] uppercase text-lux-muted">Admin Dashboard</p>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5"
              style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.10)' }}
            >
              <p className="text-[10px] tracking-[2.5px] uppercase text-lux-muted mb-2">{stat.label}</p>
              <p className="font-serif-lux text-[36px] font-light text-gold leading-none">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Active Rides */}
        <div className="mb-2">
          <p className="text-[10px] tracking-[3.5px] uppercase text-lux-muted mb-5">Active Rides</p>
        </div>

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
                    color: PHASE_COLORS[ride.phase] ?? '#666672',
                    background: `${PHASE_COLORS[ride.phase] ?? '#666672'}18`,
                    border: `1px solid ${PHASE_COLORS[ride.phase] ?? '#666672'}30`,
                  }}
                >
                  {ride.phase}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <ActionCard
            icon="+"
            title="Start New Ride"
            sub="Open operator panel"
            href="/"
          />
          <ActionCard
            icon="↗"
            title="View Experience"
            sub="Live tablet preview"
            href="/drivers"
          />
          <ActionCard
            icon="✦"
            title="Synergy Lux"
            sub="Return to main site"
            href="https://synergyluxlimodfw.github.io"
            external
          />
        </div>

      </main>
    </div>
  );
}

function ActionCard({
  icon, title, sub, href, external,
}: {
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
