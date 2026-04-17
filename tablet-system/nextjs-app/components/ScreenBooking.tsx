'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICES } from '@/lib/services';
import { ProgressDots } from './ScreenWhy';
import { track } from '@/lib/events';
import type { Service } from '@/lib/types';

interface ScreenBookingProps {
  onPrev: () => void;
  customerId?: string;
}

export default function ScreenBooking({ onPrev }: ScreenBookingProps) {
  const [selected, setSelected] = useState<Service | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  }, [selected]);

  const primaryLink = selected?.depositLink || selected?.fullLink;

  function handleReserve() {
    if (selected) track('rebook_clicked', { service: selected.id });
  }

  return (
    <section className="flex flex-col justify-between h-full px-6 pt-7 pb-5 overflow-hidden"
      style={{ background: '#06060A', color: '#EFEFEF' }}>

      {/* Scrollable top section */}
      <div className="flex-1 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'none' }}>

        {/* Urgency Header */}
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

        {/* VIP Trust Strip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="text-xs mb-5"
          style={{ color: '#4a4a55' }}
        >
          ✦ Trusted by executives · Airport clients · VIP repeat riders
        </motion.p>

        {/* Service Cards */}
        <div className="space-y-3 mb-5">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 + 0.16, duration: 0.3 }}
              onClick={() => setSelected(svc.id === selected?.id ? null : svc)}
              className="border p-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.99]"
              style={{
                borderColor: selected?.id === svc.id
                  ? 'rgba(201,168,76,0.55)'
                  : 'rgba(201,168,76,0.18)',
                background: selected?.id === svc.id
                  ? 'rgba(201,168,76,0.07)'
                  : 'transparent',
              }}
            >
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{svc.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-lux-white leading-tight">
                      {svc.name}
                    </p>
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
                    <p className="text-[10px] font-bold tracking-wide mt-0.5"
                      style={{ color: '#4ADE80' }}>
                      SAVE {svc.savings}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selection Panel — inline, appears on selection */}
        <AnimatePresence>
          {selected && (
            <motion.div
              ref={panelRef}
              key="panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-4 mb-2"
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

              <div className="flex justify-between text-sm pt-2 mt-1"
                style={{ borderTop: '1px solid rgba(201,168,76,0.10)' }}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky bottom CTAs */}
      <div className="flex-shrink-0 pt-3">

        {/* Psychological trigger */}
        <p className="text-center text-[10px] mb-3 tracking-wide" style={{ color: '#3a3a44' }}>
          Most clients book their return ride before arrival
        </p>

        {/* Primary CTA */}
        <a
          href={primaryLink ?? undefined}
          target={primaryLink ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={handleReserve}
          className="block w-full text-center py-4 rounded-xl text-sm tracking-wide font-bold uppercase transition-opacity active:scale-[0.98]"
          style={{
            background: selected && primaryLink
              ? 'linear-gradient(135deg, #D4AF5A 0%, #C9A84C 50%, #B8932E 100%)'
              : 'rgba(201,168,76,0.18)',
            color: selected && primaryLink ? '#06060A' : 'rgba(201,168,76,0.5)',
            boxShadow: selected && primaryLink ? '0 4px 20px rgba(201,168,76,0.22)' : 'none',
            pointerEvents: selected && primaryLink ? 'auto' : 'none',
            letterSpacing: '0.12em',
          }}
        >
          Reserve with Deposit{selected?.deposit ? ` — ${selected.deposit}` : ''}
        </a>

        <p className="text-center text-xs mt-2 tracking-wide" style={{ color: '#4a4a55' }}>
          Takes 10 seconds · Secure checkout
        </p>

        {/* Secondary CTA */}
        <a
          href="tel:6468791391"
          className="block w-full text-center mt-3 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors hover:bg-gold/[0.05] active:scale-[0.98]"
          style={{ border: '1px solid rgba(201,168,76,0.22)', color: '#C9A84C' }}
        >
          Prefer to call? Tap to speak with your chauffeur
        </a>

        {/* Risk reversal + Nav */}
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
          <ProgressDots active={3} total={4} />
          <div className="w-[60px]" />
        </div>
      </div>
    </section>
  );
}
