'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { SERVICES } from '@/lib/services';
import { ProgressDots } from './ScreenWhy';
import { track } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import { experienceStore } from '@/lib/experienceStore';
import type { Service } from '@/lib/types';

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

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

/** Pick the best-match service for this occasion (for Repeat card). */
function getRepeatService(occasion: string): Service {
  const occ = occasion.toLowerCase();
  if (occ.includes('airport'))                      return SERVICES.find(s => s.id === 'airport_dfw')!;
  if (occ.includes('wedding'))                      return SERVICES.find(s => s.id === 'wedding')!;
  if (occ.includes('corporate') || occ.includes('business') || occ.includes('hourly'))
                                                    return SERVICES.find(s => s.id === 'hourly')!;
  if (occ.includes('prom') || occ.includes('event')) return SERVICES.find(s => s.id === 'prom')!;
  if (occ.includes('night'))                        return SERVICES.find(s => s.id === 'night_out')!;
  if (occ.includes('sport'))                        return SERVICES.find(s => s.id === 'sporting')!;
  return SERVICES.find(s => s.id === 'airport_dfw')!;
}

/** Return the 2 contextual services to show below the Repeat card. */
function getContextualServices(occasion: string): Service[] {
  const occ    = occasion.toLowerCase();
  const repeat = getRepeatService(occasion);
  const pool   = SERVICES.filter(s => s.id !== repeat.id);

  if (occ.includes('airport'))  return [pool.find(s => s.id === 'hourly')!,    pool.find(s => s.id === 'night_out')!];
  if (occ.includes('wedding'))  return [pool.find(s => s.id === 'airport_dfw')!, pool.find(s => s.id === 'hourly')!];
  if (occ.includes('corporate')) return [pool.find(s => s.id === 'airport_dfw')!, pool.find(s => s.id === 'night_out')!];
  // default
  return [pool.find(s => s.id === 'airport_dfw')!, pool.find(s => s.id === 'night_out')!];
}

/** "Tomorrow, same time" suggestion string. */
function suggestedTime(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const h    = t.getHours();
  const m    = t.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

interface ScreenBookingProps {
  onPrev:       () => void;
  customerId?:  string;
  guestName?:   string;
  occasion?:    string;
  destination?: string;
  pickup?:      string;
  isGuest?:     boolean;
  isReturn?:    boolean;
}

// ─────────────────────────────────────────────────────────
// ScreenBooking
// ─────────────────────────────────────────────────────────

export default function ScreenBooking({
  onPrev,
  customerId,
  guestName,
  occasion   = '',
  destination = '',
  pickup     = '',
  isGuest    = false,
  isReturn   = false,
}: ScreenBookingProps) {
  const [selected,     setSelected]     = useState<Service | null>(null);
  const [showAll,      setShowAll]      = useState(false);
  const [name,         setName]         = useState(guestName ?? '');
  const [phone,        setPhone]        = useState('');

  const panelRef  = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);

  const repeatSvc       = getRepeatService(occasion);
  const contextualSvcs  = getContextualServices(occasion);
  const displayedSvcs   = showAll ? SERVICES : contextualSvcs;
  const suggestedLabel  = suggestedTime();

  // Track viewed_offer exactly once per mount
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

  // Auto-scroll selection panel into view
  useEffect(() => {
    if (selected) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  }, [selected]);

  return (
    <section
      className="flex flex-col justify-between h-full px-6 pt-7 pb-5 overflow-hidden"
      style={{ background: '#06060A', color: '#EFEFEF' }}
    >
      {/* ── Scrollable top ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'none' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-4"
        >
          <p className="text-xs tracking-widest text-gold mb-2 uppercase">
            {isReturn ? 'Schedule Your Return' : 'Before you step out…'}
          </p>
          <h1 className="font-serif-lux text-3xl font-light leading-tight mb-3">
            {isReturn
              ? <>Book your <span className="italic text-gold">return ride.</span></>
              : <>Secure your next ride{' '}<span className="italic text-gold">now.</span></>
            }
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

        {/* ── 1-TAP REBOOK CARD ────────────────────────────── */}
        {(destination || occasion) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="mb-4"
          >
            <p className="text-[9px] tracking-[3px] uppercase mb-2" style={{ color: '#C9A84C' }}>
              Repeat This Journey
            </p>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => openStripe(repeatSvc, 'deposit')}
              className="w-full text-left rounded-2xl p-5 relative overflow-hidden"
              style={{
                background:   'linear-gradient(135deg, rgba(201,168,76,0.13) 0%, rgba(201,168,76,0.06) 100%)',
                border:       '1px solid rgba(201,168,76,0.40)',
                borderTop:    '2px solid rgba(201,168,76,0.55)',
                boxShadow:    '0 0 32px rgba(201,168,76,0.10), inset 0 0 20px rgba(201,168,76,0.04)',
              }}
            >
              {/* Glow shimmer */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.06) 50%, transparent 60%)',
                }}
              />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex-1 min-w-0">
                  {/* Route */}
                  <div className="flex items-center gap-2 mb-2">
                    {pickup && (
                      <>
                        <span className="text-xs font-medium" style={{ color: '#EFEFEF' }}>
                          {pickup}
                        </span>
                        <span style={{ color: '#C9A84C', fontSize: '10px' }}>→</span>
                      </>
                    )}
                    {destination && (
                      <span className="text-xs font-medium text-gold truncate">
                        {destination}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <p className="text-[11px] mb-1" style={{ color: '#666672' }}>
                    {repeatSvc.name}
                  </p>
                  <p className="text-[11px]" style={{ color: '#4a4a55' }}>
                    Suggested · {suggestedLabel}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-gold text-lg font-bold leading-tight">
                    {repeatSvc.deposit}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#4a4a55' }}>
                    deposit
                  </p>
                  <div
                    className="mt-2 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase"
                    style={{
                      background: '#C9A84C',
                      color:      '#06060A',
                    }}
                  >
                    Book Now
                  </div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* ── Service cards ─────────────────────────────────── */}
        <div className="mb-1">
          <p className="text-[9px] tracking-[3px] uppercase mb-3" style={{ color: '#4a4a55' }}>
            {destination || occasion ? 'Other Services' : 'Choose a Service'}
          </p>
        </div>

        <div className="space-y-3 mb-4">
          {displayedSvcs.map((svc, i) => (
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

        {/* See All / Collapse toggle */}
        {!showAll && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowAll(true)}
            className="w-full py-2.5 text-[11px] tracking-[2px] uppercase transition-colors mb-4"
            style={{
              color:        'rgba(201,168,76,0.50)',
              border:       '1px solid rgba(201,168,76,0.14)',
              borderRadius: '12px',
            }}
          >
            See All Services ↓
          </motion.button>
        )}

        {/* Selection panel — price breakdown + QR + inputs */}
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
              </div>

              {/* QR code payment */}
              {(selected.depositLink || selected.fullLink) && (
                <BookingQR
                  url={(selected.depositLink || selected.fullLink)!}
                  onTap={() => openStripe(selected, selected.depositLink ? 'deposit' : 'full')}
                />
              )}

              {/* Customer data inputs */}
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{ border: '1px solid rgba(201,168,76,0.14)', background: '#0F0F14' }}
              >
                <p className="text-[10px] tracking-[2.5px] uppercase" style={{ color: '#666672' }}>
                  Your Details
                </p>

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
                    onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.40)')}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(201,168,76,0.15)')}
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-[2px] uppercase mb-1.5" style={{ color: '#4a4a55' }}>
                    Phone
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
        <p className="text-center text-[10px] mb-3 tracking-wide" style={{ color: '#3a3a44' }}>
          Most clients book their return ride before arrival
        </p>

        <a
          href="tel:6468791391"
          className="block w-full text-center py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors hover:bg-gold/[0.05] active:scale-[0.98]"
          style={{ border: '1px solid rgba(201,168,76,0.22)', color: '#C9A84C' }}
        >
          Prefer to call? Tap to speak with your chauffeur
        </a>

        <p className="text-center mt-3 mb-3" style={{ fontSize: '10px', color: '#3a3a44', letterSpacing: '0.08em' }}>
          No surge pricing · On-time guarantee · Secure booking
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            className="text-[11px] tracking-[2px] uppercase transition-colors hover:text-lux-white"
            style={{ color: '#666672' }}
          >
            ← Back
          </button>
          {!isGuest && <ProgressDots active={3} total={4} />}
          <div className="w-[60px]" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// BookingQR
// ─────────────────────────────────────────────────────────

function BookingQR({ url, onTap }: { url: string; onTap: () => void }) {
  return (
    <motion.div
      key={url}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-3 py-4"
      style={{
        background:   'rgba(255,255,255,0.02)',
        border:       '1px solid rgba(201,168,76,0.18)',
        borderRadius: '18px',
      }}
    >
      <div
        className="rounded-2xl p-4"
        style={{
          background: '#0A0A0F',
          border:     '1px solid rgba(201,168,76,0.20)',
          boxShadow:  '0 0 32px rgba(201,168,76,0.06)',
        }}
      >
        <QRCodeSVG
          value={url}
          size={148}
          bgColor="transparent"
          fgColor="#C9A84C"
          level="M"
        />
      </div>

      <p className="text-[11px] text-lux-muted/50 tracking-wide">
        Scan with your phone to reserve
      </p>

      <button
        type="button"
        onClick={onTap}
        className="text-[11px] tracking-wide transition-colors duration-200 underline underline-offset-2"
        style={{ color: 'rgba(201,168,76,0.40)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.70)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.40)')}
      >
        Or tap here
      </button>
    </motion.div>
  );
}
