'use client';

import { motion } from 'framer-motion';
import type { Service } from '@/lib/types';

interface BookingPanelProps {
  service: Service;
  onClose: () => void;
}

export default function BookingPanel({ service, onClose }: BookingPanelProps) {
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
        className="self-end text-lux-muted hover:text-lux-white transition-colors mb-6"
      >
        ✕
      </button>

      {/* Service info */}
      <p className="text-[10px] tracking-[3.5px] uppercase text-gold/55 mb-2">Book Now</p>
      <h3 className="font-serif-lux text-[28px] font-light text-lux-white mb-1">{service.name}</h3>
      <p className="text-[12px] text-lux-muted mb-6 leading-relaxed">{service.description}</p>

      {/* Price */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: '#141419', border: '1px solid rgba(201,168,76,0.10)' }}>
        <p className="text-[42px] font-serif-lux font-light text-gold leading-none mb-1">{service.price}</p>
        <p className="text-[12px] text-lux-muted">{service.priceNote}</p>
        {service.deposit && (
          <p className="text-[12px] text-lux-muted mt-3">
            50% deposit to reserve: <span className="text-lux-white font-medium">{service.deposit}</span>
          </p>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 mt-auto">
        {service.fullLink && (
          <a
            href={service.fullLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-xl py-4 text-[10px] font-bold tracking-[3px] uppercase transition-opacity hover:opacity-90"
            style={{ background: '#C9A84C', color: '#06060A' }}
          >
            Pay Full — {service.price}
          </a>
        )}
        {service.depositLink && service.depositAmount && (
          <a
            href={service.depositLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center rounded-xl py-4 text-[10px] font-bold tracking-[3px] uppercase transition-colors hover:bg-gold/[0.08]"
            style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}
          >
            Reserve — {service.depositAmount} Deposit
          </a>
        )}
        <a
          href="tel:6468791391"
          className="block w-full text-center rounded-xl py-4 text-[10px] font-bold tracking-[3px] uppercase text-lux-muted hover:text-lux-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          Call to Book
        </a>
      </div>
    </motion.div>
  );
}
