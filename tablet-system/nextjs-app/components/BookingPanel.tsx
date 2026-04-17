'use client';

import { motion } from 'framer-motion';
import { track } from '@/lib/events';
import type { Service } from '@/lib/types';

interface BookingPanelProps {
  service: Service;
  onClose: () => void;
}

export default function BookingPanel({ service, onClose }: BookingPanelProps) {
  function handleCTAClick() {
    track('rebook_clicked', { service: service.id });
  }

  const primaryLink = service.depositLink || service.fullLink;

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-y-0 right-0 w-[360px] flex flex-col rounded-l-3xl overflow-hidden"
      style={{ background: '#09090E', borderLeft: '1px solid rgba(201,168,76,0.18)' }}
    >
      {/* Panel Header */}
      <div
        className="flex items-start justify-between px-7 pt-6 pb-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}
      >
        <div>
          <p className="text-[9px] tracking-[3.5px] uppercase text-gold/50 mb-1.5">
            Exclusive In-Ride Pricing
          </p>
          <h3 className="font-serif-lux text-[22px] font-light text-lux-white leading-tight">
            {service.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-lux-muted hover:text-lux-white transition-colors mt-0.5 w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-4" style={{ scrollbarWidth: 'none' }}>

        {/* Pricing Breakdown */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#111116', border: '1px solid rgba(201,168,76,0.12)' }}
        >
          {service.originalPrice && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-lux-muted">Standard price</span>
              <span className="text-[12px] text-lux-muted/50 line-through">
                {service.originalPrice}
              </span>
            </div>
          )}
          {service.savings && (
            <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
              <span className="text-[11px] font-medium" style={{ color: '#4ADE80' }}>
                In-ride discount (10%)
              </span>
              <span className="text-[12px] font-bold" style={{ color: '#4ADE80' }}>
                − {service.savings}
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] tracking-[2.5px] uppercase text-lux-muted">
              Your price
            </span>
            <span className="text-[40px] font-serif-lux font-light text-gold leading-none">
              {service.price}
            </span>
          </div>
          <p className="text-[11px] text-lux-muted mt-1 text-right">{service.priceNote}</p>
        </div>

        {/* Deposit Info */}
        {service.deposit && (
          <div
            className="rounded-xl px-4 py-3.5"
            style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.14)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-lux-muted tracking-wide">Deposit to secure</span>
              <span className="text-[16px] font-bold text-gold">{service.deposit}</span>
            </div>
            <p className="text-[10px] text-lux-muted/65 leading-relaxed">
              Secure your vehicle now — pay the rest on ride day
            </p>
          </div>
        )}

        {/* Psychological Trigger */}
        <p className="text-center text-[10.5px] text-lux-muted/55 tracking-wide leading-relaxed">
          Most clients book their return ride before arrival
        </p>
      </div>

      {/* Sticky CTA Footer */}
      <div
        className="px-7 pb-6 pt-4 flex flex-col gap-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}
      >
        {/* 5. Primary CTA */}
        {primaryLink && (
          <div>
            <a
              href={primaryLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCTAClick}
              className="block w-full text-center rounded-2xl text-[11px] font-black tracking-[3px] uppercase transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #D4AF5A 0%, #C9A84C 50%, #B8932E 100%)',
                color: '#06060A',
                minHeight: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(201,168,76,0.25)',
              }}
            >
              Reserve My Next Ride
            </a>
            <p className="text-center text-[10px] text-lux-muted/70 tracking-wide mt-2">
              Takes 10 seconds · Secure checkout
            </p>
          </div>
        )}

        {/* 6. Secondary CTA */}
        <a
          href="tel:6468791391"
          className="block w-full text-center rounded-xl text-[10px] font-semibold tracking-[2px] uppercase transition-colors hover:bg-gold/[0.05] active:scale-[0.98]"
          style={{
            border: '1px solid rgba(201,168,76,0.20)',
            color: '#C9A84C',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Prefer to call? Tap to speak with your chauffeur
        </a>

        {/* 7. Risk Reversal */}
        <p className="text-center text-[9.5px] text-lux-muted/45 tracking-[1.5px]">
          No surge pricing · On-time guarantee · Secure booking
        </p>
      </div>
    </motion.div>
  );
}
