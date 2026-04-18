'use client';

import { motion } from 'framer-motion';
import TipSelector from '@/components/TipSelector';

// ─────────────────────────────────────────────────────────
// ThankYouScreen
//
// Full-screen, calm post-ride transition.
// Appears when experience status → 'complete'.
// ─────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.14 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

interface ThankYouScreenProps {
  guestName?: string;
  rideId?: string;
  onTip?: (percent: number | null, dollar: number | null) => void;
}

export default function ThankYouScreen({ guestName, rideId, onTip }: ThankYouScreenProps) {
  const greeting  = timeGreeting();
  const firstName = guestName ? guestName.trim().split(' ')[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center bg-lux-black overflow-y-auto"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_60%,rgba(201,168,76,0.045)_0%,transparent_70%)]" />

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-7 w-full max-w-md py-12"
      >

        {/* Brand */}
        <motion.p
          variants={fadeUp}
          className="text-[9px] tracking-[6px] uppercase text-gold/35 font-light"
        >
          Synergy Lux
        </motion.p>

        {/* Divider */}
        <motion.div
          variants={fadeUp}
          className="w-px h-10 bg-gradient-to-b from-transparent via-gold/20 to-transparent"
        />

        {/* Greeting */}
        {firstName && (
          <motion.p
            variants={fadeUp}
            className="text-[11px] tracking-[4px] uppercase text-lux-muted/60"
          >
            {greeting}, {firstName}
          </motion.p>
        )}

        {/* Main title */}
        <motion.div variants={fadeUp} className="space-y-3">
          <h1 className="font-serif text-[48px] sm:text-[56px] font-light text-lux-white leading-none">
            Thank you for
            <br />
            <em className="text-gold2">traveling</em>
          </h1>
          <p className="text-[14px] text-lux-muted leading-relaxed">
            We hope your journey was exceptional
          </p>
        </motion.div>

        {/* Separator */}
        <motion.div
          variants={fadeUp}
          className="w-16 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent"
        />

        {/* Gratuity intro line */}
        <motion.p
          variants={fadeUp}
          className="text-[11px] text-lux-muted/40 tracking-wide leading-relaxed max-w-xs"
        >
          For your convenience, gratuity can be added on your device
        </motion.p>

        {/* Gratuity section */}
        <motion.div variants={fadeUp} className="w-full">
          <TipSelector rideId={rideId} onTip={onTip} />
        </motion.div>

      </motion.div>
    </motion.div>
  );
}

// ── Helper ─────────────────────────────────────────────────

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
