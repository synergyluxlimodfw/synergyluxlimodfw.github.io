'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type PendingBooking = {
  customerId: string;
  name: string;
  phone: string;
  service: string;
  serviceId: string;
};

export default function SuccessPage() {
  const [booking, setBooking] = useState<PendingBooking | null>(null);

  useEffect(() => {
    // Guard against duplicate tracking across tabs/reloads
    const alreadyTracked = sessionStorage.getItem('slux_success_tracked');

    try {
      const raw = localStorage.getItem('slux_pending');
      if (raw) {
        const data = JSON.parse(raw) as PendingBooking;
        setBooking(data);
        localStorage.removeItem('slux_pending'); // consume once

        if (!alreadyTracked) {
          sessionStorage.setItem('slux_success_tracked', '1');
          fetch('/api/track', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event:      'completed_payment',
              customerId: data.customerId,
              service:    data.serviceId,
              phone:      data.phone,
              timestamp:  new Date().toISOString(),
            }),
          }).catch(console.error);
        }
      }
    } catch {
      // localStorage unavailable — continue without booking data
    }
  }, []);

  return (
    <div className="min-h-screen bg-lux-black flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md w-full"
      >
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 18 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.30)' }}
        >
          <span style={{ color: '#4ADE80', fontSize: '26px' }}>✓</span>
        </motion.div>

        <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">Booking Confirmed</p>

        <h1 className="font-serif-lux text-[42px] font-light text-lux-white leading-tight mb-4">
          Your ride is{' '}
          <em className="text-gold2">confirmed.</em>
        </h1>

        <p className="text-[14px] text-lux-muted leading-relaxed mb-8">
          Your chauffeur will contact you shortly.
          <br />Sit back — we handle everything from here.
        </p>

        {/* Booking summary */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 mb-8 text-left"
            style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.12)' }}
          >
            <p className="text-[10px] tracking-[3px] uppercase text-lux-muted mb-4">
              Booking Summary
            </p>
            <div className="space-y-3">
              <Row label="Guest"   value={booking.name} />
              <Row label="Service" value={booking.service} />
              <div className="flex justify-between text-sm">
                <span className="text-lux-muted">Status</span>
                <span className="font-medium" style={{ color: '#4ADE80' }}>Confirmed</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Primary CTA */}
        <Link
          href="/"
          className="block w-full text-center rounded-2xl py-4 text-[11px] font-bold tracking-[3px] uppercase mb-5 transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#C9A84C', color: '#06060A' }}
        >
          Book Another Ride
        </Link>

        {/* Secondary */}
        <a
          href="tel:6468791391"
          className="text-[12px] tracking-wide transition-colors"
          style={{ color: '#C9A84C' }}
        >
          Questions? Call (646) 879-1391
        </a>

        {/* Admin link (subtle) */}
        <p className="mt-10 text-[10px]" style={{ color: '#2a2a33' }}>
          <Link href="/admin" className="hover:text-lux-muted transition-colors">
            Admin →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-lux-muted">{label}</span>
      <span className="text-lux-white font-medium">{value}</span>
    </div>
  );
}
