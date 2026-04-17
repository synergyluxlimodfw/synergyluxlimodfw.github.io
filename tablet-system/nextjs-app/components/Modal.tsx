'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModalType, Session } from '@/lib/types';

interface ModalProps {
  type: ModalType;
  session: Session;
  onClose: () => void;
  onBook: (route: 'airport' | 'same' | 'custom') => void;
}

const MODAL_CONTENT: Record<NonNullable<ModalType>, { eyebrow: string; heading: string; sub: string }> = {
  midway: {
    eyebrow:  'Midway There',
    heading:  'Heading back later?',
    sub:      'Reserve your return ride now and skip the wait. Most clients book before they arrive.',
  },
  pre_dropoff: {
    eyebrow:  'Almost There',
    heading:  'Ready for your next ride?',
    sub:      'Book before drop-off and lock in your rate. Takes under 30 seconds.',
  },
  complete: {
    eyebrow:  'Ride Complete',
    heading:  'Reserve your next ride in seconds.',
    sub:      'Your chauffeur is one tap away. Book now and we handle the rest.',
  },
};

export default function Modal({ type, session, onClose, onBook }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const content = type ? MODAL_CONTENT[type] : null;

  return (
    <AnimatePresence>
      {type && content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: 'rgba(6,6,10,0.88)', backdropFilter: 'blur(14px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-2xl p-9 relative"
            style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.16)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-lux-muted hover:text-lux-white transition-colors text-base w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>

            {/* Header */}
            <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">
              {content.eyebrow}
            </p>
            <h2 className="font-serif-lux text-[32px] font-normal text-lux-white leading-tight mb-2">
              {content.heading}
            </h2>
            <p className="text-[13px] text-lux-muted mb-8 leading-relaxed">{content.sub}</p>

            {type === 'complete' ? (
              /* Complete modal — full-width CTA + QR */
              <div className="space-y-3">
                <a
                  href={`/rebook/${session.rideId ?? 'demo'}`}
                  className="block w-full text-center rounded-xl py-4 text-[11px] font-bold tracking-[3px] uppercase transition-opacity hover:opacity-90"
                  style={{ background: '#C9A84C', color: '#06060A' }}
                  onClick={() => onBook('same')}
                >
                  Book Now
                </a>
                <p className="text-center text-[11px] text-lux-muted tracking-wider pt-2">
                  Or call&nbsp;&nbsp;
                  <a href="tel:6468791391" className="text-gold">(646) 879-1391</a>
                </p>
              </div>
            ) : (
              /* Midway / Pre-dropoff — route cards */
              <>
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <RouteCard icon="✈︎" label="Airport Return"   detail="DFW · Flat rate" price="$165" onClick={() => onBook('airport')} />
                  <RouteCard icon="↩"  label="Same Route"       detail={session.destination || 'Last route'} price="$165" onClick={() => onBook('same')} />
                  <RouteCard icon="✦"  label="Custom Ride"      detail="Any route"       price="Quote" onClick={() => onBook('custom')} />
                </div>

                {/* Strong CTA */}
                <button
                  onClick={() => onBook('same')}
                  className="w-full rounded-xl py-[14px] text-[11px] font-bold tracking-[3px] uppercase transition-opacity hover:opacity-90 mb-3"
                  style={{ background: '#C9A84C', color: '#06060A' }}
                >
                  Reserve My Next Ride
                </button>

                <p className="text-center text-[11px] text-lux-muted tracking-wider">
                  OR CALL&nbsp;&nbsp;
                  <a href="tel:6468791391" className="text-gold">(646) 879-1391</a>
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RouteCard({
  icon, label, detail, price, onClick,
}: {
  icon: string; label: string; detail: string; price: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1 p-4 rounded-2xl text-left transition-all duration-200 hover:border-gold/35 hover:bg-gold/[0.06]"
      style={{ background: '#141419', border: '1px solid rgba(201,168,76,0.14)' }}
    >
      <span className="text-xl text-gold mb-1">{icon}</span>
      <span className="text-[13px] font-medium text-lux-white">{label}</span>
      <span className="text-[11px] text-lux-muted leading-snug">{detail}</span>
      <span className="text-[13px] font-semibold text-gold mt-1">{price}</span>
    </button>
  );
}
