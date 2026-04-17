'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    num: '01',
    title: 'Guest Enters Vehicle',
    body:  'The tablet is mounted and powered. The Operator Panel is already on screen.',
  },
  {
    num: '02',
    title: 'Enter Guest Details',
    body:  'Input the guest name, occasion, destination, and ETA. Press "Start Experience".',
  },
  {
    num: '03',
    title: 'Activate Driver Mode',
    body:  'Press and hold the bottom-right corner of the screen for 3 seconds to reveal the Driver Panel.',
  },
  {
    num: '04',
    title: 'Use Phase Buttons',
    body:  'Tap START to begin. MIDWAY at roughly halfway. 5 MIN when 5 minutes from drop-off. COMPLETE at arrival.',
  },
  {
    num: '05',
    title: 'Midway & Pre Drop-Off Prompts',
    body:  'The system will show a rebook modal automatically at each phase. The guest can select a return route.',
  },
  {
    num: '06',
    title: 'Complete the Ride',
    body:  'Tap COMPLETE. The guest QR code allows rebooking at any time after the ride.',
  },
];

const TIPS = [
  'Keep the tablet charged and mounted before the guest enters.',
  'Enter the exact ETA — the system uses it for prompt timing.',
  'VIP notes are shown on the welcome screen. Use them for preferences.',
  'Do not touch the screen after tapping COMPLETE — leave it for the guest.',
];

export default function DriversPage() {
  return (
    <div className="min-h-screen bg-lux-black">

      <header
        className="flex items-center justify-between px-8 h-16"
        style={{ borderBottom: '1px solid rgba(201,168,76,0.14)' }}
      >
        <p className="text-[12px] font-semibold tracking-[4px] uppercase">
          SYNERGY <span className="text-gold">LUX</span>
        </p>
        <p className="text-[10px] tracking-[3px] uppercase text-lux-muted">Driver Guide</p>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-14">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">Chauffeur Onboarding</p>
          <h1 className="font-serif-lux text-[44px] font-light text-lux-white leading-tight mb-3">
            How the Tablet<br />
            <em className="text-gold2">Experience Works</em>
          </h1>
          <p className="text-[13px] text-lux-muted mb-12 leading-relaxed">
            This guide covers everything you need to run the in-car experience for each guest.
            The system handles prompts automatically — your job is to keep it moving.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-3 mb-12">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 + 0.1 }}
              className="flex gap-5 rounded-2xl p-5"
              style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.08)' }}
            >
              <span className="text-[11px] font-semibold text-gold/50 mt-0.5 flex-shrink-0 w-6">{step.num}</span>
              <div>
                <p className="text-[14px] font-medium text-lux-white mb-1">{step.title}</p>
                <p className="text-[12px] text-lux-muted leading-relaxed">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-6 mb-10"
          style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.14)' }}
        >
          <p className="text-[10px] tracking-[3.5px] uppercase text-gold mb-4">Pro Tips</p>
          <ul className="space-y-3">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex gap-3 text-[12px] text-lux-muted leading-relaxed">
                <span className="text-gold flex-shrink-0 mt-0.5">✦</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Driver mode reminder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
        >
          <p className="text-[12px] font-semibold text-green-400 mb-2">Driver Mode Shortcut</p>
          <p className="text-[12px] text-lux-muted leading-relaxed">
            Hold the <strong className="text-lux-white">bottom-right corner</strong> of the screen for{' '}
            <strong className="text-lux-white">3 seconds</strong> at any point during the experience
            to open the Driver Panel.
          </p>
        </motion.div>

        <div className="mt-10 flex gap-3">
          <a
            href="/"
            className="flex-1 text-center py-4 rounded-xl text-[10px] font-bold tracking-[3px] uppercase transition-opacity hover:opacity-90"
            style={{ background: '#C9A84C', color: '#06060A' }}
          >
            Open Tablet
          </a>
          <a
            href="tel:6468791391"
            className="flex-1 text-center py-4 rounded-xl text-[10px] font-bold tracking-[3px] uppercase text-gold transition-colors hover:bg-gold/[0.06]"
            style={{ border: '1px solid rgba(201,168,76,0.3)' }}
          >
            Call Support
          </a>
        </div>

      </main>
    </div>
  );
}
