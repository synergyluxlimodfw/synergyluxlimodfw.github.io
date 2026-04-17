'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICES } from '@/lib/services';
import { track } from '@/lib/events';
import type { Service } from '@/lib/types';

type CustomerData = {
  customer:    { id: string; name: string; phone: string };
  lastRide:    { pickup: string; dropoff: string } | null;
  lastBooking: { pickup: string; dropoff: string } | null;
};

const DEMO_DATA: CustomerData = {
  customer:    { id: 'demo', name: 'Valued Guest', phone: '' },
  lastRide:    { pickup: 'Hotel Crescent Court', dropoff: 'DFW Terminal D' },
  lastBooking: null,
};

export default function RebookPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [data,     setData]     = useState<CustomerData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);
  const [booking,  setBooking]  = useState(false);

  useEffect(() => {
    if (!customerId) return;
    if (customerId === 'demo') { setData(DEMO_DATA); setLoading(false); return; }

    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    fetch(`${API}/booking/customer/${customerId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(DEMO_DATA))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <Centered>Loading…</Centered>;
  if (!data)   return <Centered>Customer not found.</Centered>;

  const { customer, lastRide } = data;

  async function handleBook(svc: Service) {
    const link = svc.depositLink || svc.fullLink;
    if (!link) return;

    setBooking(true);
    track('rebook_clicked', { service: svc.id, source: 'rebook_page' });

    try {
      // Save to localStorage so /success page can read the summary
      localStorage.setItem('slux_pending', JSON.stringify({
        customerId: customer.id,
        name:       customer.name,
        phone:      customer.phone,
        service:    svc.name,
        serviceId:  svc.id,
      }));
      sessionStorage.removeItem('slux_success_tracked');

      const url = new URL(link);
      url.searchParams.set('client_reference_id', customer.id);
      window.location.href = url.toString(); // navigate in-place for rebook flow
    } catch (err) {
      console.error('[RebookPage] handleBook:', err);
      setBooking(false);
    }
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
          <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">
            Welcome Back
          </p>
          <h1 className="font-serif-lux text-[44px] font-light text-lux-white leading-tight mb-4">
            Your next ride{' '}
            <br /><em className="text-gold2">in seconds.</em>
          </h1>
          <p className="text-[13px] text-lux-muted mb-10 leading-relaxed">
            Hello, <span className="text-lux-white">{customer.name}</span>.
            {' '}Tap any service below to lock in your spot — one tap, straight to checkout.
          </p>

          {lastRide && (
            <div
              className="rounded-2xl p-5 mb-8"
              style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.10)' }}
            >
              <p className="text-[10px] tracking-[3px] uppercase text-lux-muted mb-2">Last Ride</p>
              <p className="text-[14px] text-lux-white">
                {lastRide.pickup} → {lastRide.dropoff}
              </p>
            </div>
          )}

          <p className="text-[10px] tracking-[3px] uppercase text-lux-muted mb-4">Choose a Service</p>
        </motion.div>

        {/* Service list — one tap → Stripe */}
        <div className="space-y-2.5">
          {SERVICES.map((svc, i) => (
            <motion.button
              key={svc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(svc === selected ? null : svc)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200 active:scale-[0.99]"
              style={{
                background: selected?.id === svc.id ? 'rgba(201,168,76,0.08)' : '#0F0F14',
                border: `1px solid ${selected?.id === svc.id ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.08)'}`,
              }}
            >
              <span className="text-2xl w-8 flex-shrink-0">{svc.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-lux-white">{svc.name}</p>
                <p className="text-[12px] text-lux-muted">{svc.priceNote}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[15px] font-bold text-gold">{svc.price}</p>
                {svc.originalPrice && (
                  <p className="text-[11px] text-lux-muted/50 line-through">{svc.originalPrice}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Expanded quick-book panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="quick-book"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 rounded-2xl p-5"
              style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.20)' }}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] tracking-[3px] uppercase text-gold/55 mb-1">Selected</p>
                  <p className="text-[16px] font-medium text-lux-white">{selected.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[22px] font-bold text-gold">{selected.price}</p>
                  {selected.deposit && (
                    <p className="text-[11px] text-lux-muted">Deposit: {selected.deposit}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleBook(selected)}
                disabled={booking}
                className="w-full rounded-xl py-4 text-[11px] font-black tracking-[3px] uppercase transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ background: '#C9A84C', color: '#06060A', boxShadow: '0 4px 20px rgba(201,168,76,0.25)' }}
              >
                {booking ? 'Redirecting…' : `Reserve Now${selected.deposit ? ` — ${selected.deposit}` : ''}`}
              </button>

              <p className="text-center text-[10px] text-lux-muted mt-2 tracking-wide">
                Takes 10 seconds · Secure checkout
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[13px] text-lux-muted mt-8">
          Or call{' '}
          <a href="tel:6468791391" className="text-gold">(646) 879-1391</a>
        </p>

      </main>
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
