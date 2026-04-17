'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICES } from '@/lib/services';
import BookingPanel from './BookingPanel';
import { ProgressDots } from './ScreenWhy';
import type { Service } from '@/lib/types';

interface ScreenBookingProps {
  onPrev: () => void;
}

export default function ScreenBooking({ onPrev }: ScreenBookingProps) {
  const [selected, setSelected] = useState<Service | null>(null);

  return (
    <div className="relative flex flex-col h-full px-8 py-10 overflow-hidden">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">Secure Payment</p>
        <h2 className="font-serif-lux text-[40px] font-light text-lux-white leading-tight">
          Book &amp; Pay <em className="text-gold2">Right Now</em>
        </h2>
        <p className="text-[12px] text-lux-muted mt-2">
          Pay in full or secure your reservation with a 50% deposit.
        </p>
      </motion.div>

      {/* Service Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
        {SERVICES.map((svc, i) => (
          <motion.button
            key={svc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.1 }}
            onClick={() => setSelected(svc)}
            className="flex flex-col items-start gap-2 p-5 rounded-2xl text-left transition-all duration-200"
            style={{
              background: selected?.id === svc.id ? 'rgba(201,168,76,0.08)' : '#0F0F14',
              border: `1px solid ${selected?.id === svc.id ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.10)'}`,
            }}
          >
            <span className="text-2xl">{svc.icon}</span>
            <span className="text-[14px] font-medium text-lux-white">{svc.name}</span>
            <span className="text-[12px] text-lux-muted leading-snug">{svc.description}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[13px] font-semibold text-gold">{svc.price}</span>
              <span className="text-[11px] text-lux-muted">{svc.priceNote}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-5">
        <button onClick={onPrev} className="text-[11px] text-lux-muted tracking-[2px] uppercase hover:text-lux-white transition-colors">
          ← Back
        </button>
        <ProgressDots active={3} total={4} />
        <a href="tel:6468791391" className="text-[11px] tracking-[2.5px] uppercase px-6 py-3 rounded-xl border border-gold/30 text-gold hover:bg-gold/[0.06] transition-colors">
          Call Us
        </a>
      </div>

      {/* Booking Panel Slide-In */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10"
              style={{ background: 'rgba(6,6,10,0.5)' }}
              onClick={() => setSelected(null)}
            />
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="relative h-full pointer-events-auto">
                <BookingPanel service={selected} onClose={() => setSelected(null)} />
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
