'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICES } from '@/lib/services';
import { ProgressDots } from './ScreenWhy';
import { track } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import { experienceStore } from '@/lib/experienceStore';
import type { Service } from '@/lib/types';

function parseDollar(s?: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function openStripe(svc: Service, type: 'deposit' | 'full') {
  const url = type === 'deposit' ? (svc.depositLink || svc.fullLink) : svc.fullLink;
  if (!url) return;
  const { rideId } = experienceStore.getState();
  supabase.from('bookings').insert({
    ride_id:      rideId,
    service:      svc.name,
    amount:       parseDollar(svc.price),
    deposit:      parseDollar(svc.deposit),
    stripe_link:  url,
    payment_type: type,
  }).then(() => {});
  window.open(url, '_blank');
}

interface ScreenBookingProps {
  onPrev: () => void;
  customerId?: string;
  guestName?: string;
}

export default function ScreenBooking({ onPrev, customerId, guestName }: ScreenBookingProps) {
  const [selected, setSelected] = useState<Service | null>(null);
  const [name,     setName]     = useState(guestName ?? '');
  const [phone,    setPhone]    = useState('');

  const panelRef  = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  // Track viewed_offer exactly once per mount — no duplicates
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    track('viewed_offer');
    fetch('/api/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event:      'viewed_offer',
        customerId: customerId ?? 'anonymous',
        service:    '',
        timestamp:  new Date().toISOString(),
      }),
    }).catch(console.error);
  }, [customerId]);

  // Auto-scroll selection panel into view on service pick
  useEffect(() => {
    if (selected) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  }, [selected]);

  const canSubmit = !!selected && !!(selected.depositLink || selected.fullLink);

  return (
    <section
      className="flex flex-col justify-between h-full px-6 pt-7 pb-5 overflow-hidden"
      style={{ background: '#06060A', color: '#EFEFEF' }}
    >
      {/* ── Scrollable top ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'none' }}>

        {/* Urgency header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-4"
        >
          <p className="text-xs tracking-widest text-gold mb-2 uppercase">
            Before you step out…
          </p>
          <h1 className="font-serif-lux text-3xl font-light leading-tight mb-3">
            Secure your next ride{' '}
            <span className="italic text-gold">now.</span>
          </h1>
          <p className="text-sm mb-3 leading-snug" style={{ color: '#666672' }}>
            Lock in exclusive in-ride pricing — not available after drop-off.
          </p>
          <p className="text-xs mb-1" style={{ color: '#4a4a55' }}>
            ⏱ Offer expires when ride completes
          </p>
        </motion.div>

        {/* Trust strip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="text-xs mb-5"
          style={{ color: '#4a4a55' }}
        >
          ✦ Trusted by executives · Airport clients · VIP repeat riders
        </motion.p>

        {/* Service cards */}
        <div className="space-y-3 mb-5">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ delay: i * 0.04 + 0.16, duration: 0.3 }}
              onClick={() => setSelected(svc.id === selected?.id ? null : svc)}
              className="border p-4 rounded-xl cursor-pointer transition-colors duration-200"
              style={{
                borderColor: selected?.id === svc.id
                  ? 'rgba(201,168,76,0.55)'
                  : 'rgba(201,168,76,0.18)',
                background: selected?.id === svc.id
                  ? 'rgba(201,168,76,0.07)'
                  : 'transparent',
                boxShadow: selected?.id === svc.id
                  ? '0 0 24px rgba(201,168,76,0.10), inset 0 0 12px rgba(201,168,76,0.05)'
                  : 'none',
              }}
            >
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{svc.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-lux-white leading-tight">{svc.name}</p>
                    <p className="text-xs leading-snug mt-0.5 truncate" style={{ color: '#666672' }}>
                      {svc.description}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gold text-base font-bold leading-tight">{svc.price}</p>
                  {svc.originalPrice && (
                    <p className="text-xs line-through mt-0.5" style={{ color: '#4a4a55' }}>
                      {svc.originalPrice}
                    </p>
                  )}
                  {svc.savings && (
                    <p className="text-[10px] font-bold tracking-wide mt-0.5" style={{ color: '#4ADE80' }}>
                      SAVE {svc.savings}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selection panel + customer inputs — animate in when service selected */}
        <AnimatePresence>
          {selected && (
            <motion.div
              ref={panelRef}
              key="panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3 mb-2"
            >
              {/* Price breakdown */}
              <div
                className="rounded-2xl p-4"
                style={{ border: '1px solid rgba(201,168,76,0.28)', background: 'rgba(255,255,255,0.03)' }}
              >
                <p className="text-sm font-medium text-lux-white mb-3">Your selection</p>

                {selected.originalPrice && (
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: '#666672' }}>
                    <span>Standard price</span>
                    <span className="line-through">{selected.originalPrice}</span>
                  </div>
                )}
                {selected.savings && (
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: '#4ADE80' }}>
                    <span>In-ride discount (10%)</span>
                    <span>− {selected.savings}</span>
                  </div>
                )}
                <div
                  className="flex justify-between text-sm pt-2 mt-1"
                  style={{ borderTop: '1px solid rgba(201,168,76,0.10)' }}
                >
                  <span style={{ color: '#EFEFEF' }}>Your price</span>
                  <span className="text-gold font-bold text-base">{selected.price}</span>
                </div>
                {selected.deposit && (
                  <div className="flex justify-between text-xs mt-2" style={{ color: '#666672' }}>
                    <span>Deposit to secure</span>
                    <span className="text-gold font-medium">{selected.deposit}</span>
                  </div>
                )}
                <p className="text-xs mt-3 leading-relaxed" style={{ color: '#666672' }}>
                  Secure your vehicle now — pay the rest on ride day
                </p>
              </div>

              {/* Customer data inputs */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{ border: '1px solid rgba(201,168,76,0.14)', background: '#0F0F14' }}
              >
                <p className="text-[10px] tracking-[2.5px] uppercase" style={{ color: '#666672' }}>
                  Your Details
                </p>

                {/* Name */}
                <div>
                  <label className="block text-[10px] tracking-[2px] uppercase mb-1.5" style={{ color: '#4a4a55' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={guestName || 'Your name'}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: '#141419', border: '1px solid rgba(201,168,76,0.15)', color: '#EFEFEF' }}
                    onFocus={e  => (e.target.style.borderColor = 'rgba(201,168,76,0.40)')}
                    onBlur={e   => (e.target.style.borderColor = 'rgba(201,168,76,0.15)')}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] tracking-[2px] uppercase mb-1.5" style={{ color: '#4a4a55' }}>
                    Phone <span className="text-gold">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: '#141419', border: '1px solid rgba(201,168,76,0.15)', color: '#EFEFEF' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.40)')}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(201,168,76,0.15)')}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sticky bottom ──────────────────────────────────── */}
      <div className="flex-shrink-0 pt-3">

        {/* Psychological trigger */}
        <p className="text-center text-[10px] mb-3 tracking-wide" style={{ color: '#3a3a44' }}>
          Most clients book their return ride before arrival
        </p>

        {/* Primary CTA — deposit */}
        <button
          onClick={() => selected && openStripe(selected, 'deposit')}
          disabled={!canSubmit}
          className="w-full text-center py-4 rounded-xl text-sm font-bold uppercase transition-all active:scale-[0.98] disabled:cursor-not-allowed"
          style={{
            background:    canSubmit ? 'linear-gradient(135deg, #D4AF5A 0%, #C9A84C 50%, #B8932E 100%)' : 'rgba(201,168,76,0.18)',
            color:         canSubmit ? '#06060A' : 'rgba(201,168,76,0.45)',
            boxShadow:     canSubmit ? '0 4px 20px rgba(201,168,76,0.22)' : 'none',
            letterSpacing: '0.12em',
          }}
        >
          {`Reserve with Deposit${selected?.deposit ? ` — ${selected.deposit}` : ''}`}
        </button>

        <p className="text-center text-xs mt-2 tracking-wide" style={{ color: '#4a4a55' }}>
          Takes 10 seconds · Secure checkout
        </p>

        {/* Pay in Full CTA */}
        {selected?.fullLink && (
          <button
            type="button"
            onClick={() => openStripe(selected, 'full')}
            className="w-full text-center mt-3 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all active:scale-[0.98] hover:bg-gold/[0.05]"
            style={{ border: '1px solid rgba(201,168,76,0.22)', color: '#C9A84C', letterSpacing: '0.10em' }}
          >
            Pay in Full — {selected.price}
          </button>
        )}

        {/* Call CTA */}
        <a
          href="tel:6468791391"
          className="block w-full text-center mt-3 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors hover:bg-gold/[0.05] active:scale-[0.98]"
          style={{ border: '1px solid rgba(201,168,76,0.22)', color: '#C9A84C' }}
        >
          Prefer to call? Tap to speak with your chauffeur
        </a>

        {/* Risk reversal */}
        <p className="text-center mt-3 mb-3" style={{ fontSize: '10px', color: '#3a3a44', letterSpacing: '0.08em' }}>
          No surge pricing · On-time guarantee · Secure booking
        </p>

        {/* Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            className="text-[11px] tracking-[2px] uppercase transition-colors hover:text-lux-white"
            style={{ color: '#666672' }}
          >
            ← Back
          </button>
          <ProgressDots active={3} total={4} />
          <div className="w-[60px]" />
        </div>
      </div>
    </section>
  );
}
