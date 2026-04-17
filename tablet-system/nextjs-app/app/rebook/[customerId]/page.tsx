'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICES } from '@/lib/services';
import BookingPanel from '@/components/BookingPanel';
import { track } from '@/lib/events';
import type { Service } from '@/lib/types';

type CustomerData = {
  customer: { id: string; name: string; phone: string };
  lastRide:    { pickup: string; dropoff: string } | null;
  lastBooking: { pickup: string; dropoff: string } | null;
};

const DEMO_DATA: CustomerData = {
  customer: { id: 'demo', name: 'Valued Guest', phone: '' },
  lastRide: { pickup: 'Hotel Crescent Court', dropoff: 'DFW Terminal D' },
  lastBooking: null,
};

export default function RebookPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [data, setData]         = useState<CustomerData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    // Demo mode — no backend needed
    if (customerId === 'demo') {
      setData(DEMO_DATA);
      setLoading(false);
      return;
    }

    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    fetch(`${API}/booking/customer/${customerId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(DEMO_DATA))  // fallback to demo on error
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <Centered>Loading…</Centered>;
  if (!data)   return <Centered>Customer not found.</Centered>;

  const { customer, lastRide } = data;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-lux-black flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-sm"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)' }}
          >
            <span style={{ color: '#4ADE80', fontSize: '22px' }}>✓</span>
          </div>
          <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">Booking Confirmed</p>
          <h2 className="font-serif-lux text-[36px] font-light text-lux-white leading-tight mb-3">
            {"You're all set."}
          </h2>
          <p className="text-[14px] text-lux-muted leading-relaxed mb-8">
            {"We'll handle the rest. Your chauffeur will be ready and waiting."}
          </p>
          <a
            href="tel:6468791391"
            className="text-[11px] text-gold tracking-wider"
          >
            Questions? Call (646) 879-1391
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lux-black">

      {/* Header */}
      <header
        className="flex items-center px-8 h-16"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.14)' }}
      >
        <p className="text-[12px] font-semibold tracking-[4px] uppercase">
          SYNERGY <span className="text-gold">LUX</span>
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-14">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">Your Chauffeur Is One Tap Away</p>
          <h1 className="font-serif-lux text-[44px] font-light text-lux-white leading-tight mb-4">
            Reserve your next ride
            <br /><em className="text-gold2">in under 30 seconds.</em>
          </h1>
          <p className="text-[13px] text-lux-muted mb-10 leading-relaxed">
            Hello, <span className="text-lux-white">{customer.name}</span>. Choose your service below and secure your spot — no forms, no waiting.
          </p>

          {lastRide && (
            <div
              className="rounded-2xl p-5 mb-8"
              style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.10)' }}
            >
              <p className="text-[10px] tracking-[3px] uppercase text-lux-muted mb-2">Last Ride</p>
              <p className="text-[14px] text-lux-white">{lastRide.pickup} → {lastRide.dropoff}</p>
            </div>
          )}

          <p className="text-[10px] tracking-[3px] uppercase text-lux-muted mb-4">Choose a Service</p>
        </motion.div>

        {/* Service list */}
        <div className="space-y-2.5 relative">
          {SERVICES.map((svc, i) => (
            <motion.button
              key={svc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(svc)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200 active:scale-[0.99]"
              style={{
                background: selected?.id === svc.id ? 'rgba(201,168,76,0.08)' : '#0F0F14',
                border: `1px solid ${selected?.id === svc.id ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.08)'}`,
              }}
            >
              <span className="text-2xl w-8 flex-shrink-0">{svc.icon}</span>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-lux-white">{svc.name}</p>
                <p className="text-[12px] text-lux-muted">{svc.priceNote}</p>
              </div>
              <span className="text-[15px] font-semibold text-gold">{svc.price}</span>
            </motion.button>
          ))}
        </div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={() => {
              track('rebook_clicked', { source: 'rebook_page' });
              setConfirmed(true);
            }}
            className="w-full rounded-xl text-[11px] font-bold tracking-[3px] uppercase transition-opacity hover:opacity-90 active:scale-[0.99]"
            style={{ background: '#C9A84C', color: '#06060A', minHeight: '62px' }}
          >
            Book Your Ride
          </button>
        </motion.div>

        <p className="text-center text-[13px] text-lux-muted mt-6">
          Or call{' '}
          <a href="tel:6468791391" className="text-gold">(646) 879-1391</a>
        </p>

      </main>

      {/* Booking Panel Overlay */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(8px)' }}
              onClick={() => setSelected(null)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-[360px]">
              <BookingPanel service={selected} onClose={() => setSelected(null)} />
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center h-screen bg-lux-black text-lux-muted text-[13px] tracking-widest">
      {children}
    </div>
  );
}
