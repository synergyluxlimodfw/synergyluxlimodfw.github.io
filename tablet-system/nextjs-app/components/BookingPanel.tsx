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

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-y-0 right-0 w-[340px] flex flex-col p-7 rounded-l-3xl"
      style={{ background: '#0F0F14', borderLeft: '1px solid rgba(201,168,76,0.14)' }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="self-end text-lux-muted hover:text-lux-white transition-colors mb-5"
      >
        ✕
      </button>

      {/* In-ride exclusive badge */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 mb-5 self-start"
        style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.22)' }}
      >
        <span className="text-[10px]">✦</span>
        <p className="text-[10px] font-bold tracking-[2px] uppercase" style={{ color: '#4ADE80' }}>
          10% In-Ride Exclusive
        </p>
      </div>

      {/* Service info */}
      <p className="text-[10px] tracking-[3.5px] uppercase text-gold/55 mb-2">Book Now</p>
      <h3 className="font-serif-lux text-[28px] font-light text-lux-white mb-1">{service.name}</h3>
      <p className="text-[12px] text-lux-muted mb-6 leading-relaxed">{service.description}</p>

      {/* Price */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#141419', border: '1px solid rgba(201,168,76,0.10)' }}>
        <p className="text-[42px] font-serif-lux font-light text-gold leading-none mb-1">{service.price}</p>
        <p className="text-[12px] text-lux-muted">{service.priceNote}</p>
        {service.deposit && (
          <p className="text-[12px] text-lux-muted mt-3">
            50% deposit to reserve: <span className="text-lux-white font-medium">{service.deposit}</span>
          </p>
        )}
      </div>

      {/* Urgency note */}
      <p className="text-[11px] text-lux-muted text-center mb-5 tracking-wide">
        Most clients book before drop-off.
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 mt-auto">
        {service.fullLink && (
          <a
            href={service.fullLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCTAClick}
            className="block w-full text-center rounded-xl text-[10px] font-bold tracking-[3px] uppercase transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#C9A84C', color: '#06060A', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Pay Full — {service.price}
          </a>
        )}
        {service.depositLink && service.depositAmount && (
          <a
            href={service.depositLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCTAClick}
            className="block w-full text-center rounded-xl text-[10px] font-bold tracking-[3px] uppercase transition-colors hover:bg-gold/[0.08] active:scale-[0.98]"
            style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Secure Your Next Ride — {service.depositAmount}
          </a>
        )}
        <a
          href="tel:6468791391"
          className="block w-full text-center rounded-xl text-[10px] font-bold tracking-[3px] uppercase text-lux-muted hover:text-lux-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.06)', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Call to Book
        </a>
      </div>
    </motion.div>
  );
}
