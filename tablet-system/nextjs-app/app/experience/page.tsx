'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore, experienceStore } from '@/lib/experienceStore';
import type { ExperienceStatus } from '@/lib/experienceStore';
import MapEmbed       from '@/components/MapEmbed';
import ThankYouScreen from '@/components/ThankYouScreen';

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function ExperiencePage() {
  const state  = useExperienceStore();
  const router = useRouter();

  useEffect(() => { experienceStore.hydrate(); }, []);

  const showMap   = state.status === 'ready' || state.status === 'active';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-lux-black flex flex-col">

      {/* Ambient background — always present */}
      <AmbientBackground status={state.status} />

      {/* ── Thank you overlay — complete state ───────────── */}
      <AnimatePresence>
        {state.status === 'complete' && (
          <ThankYouScreen
            guestName={state.guestName}
            onTip={(percent, dollar) => {
              // Future: POST to /api/tip or log for driver
              console.log('[tip]', { percent, dollar });
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Chauffeur: tap top-center → complete ───────────── */}
      <button
        type="button"
        onClick={() => experienceStore.completeRide()}
        aria-label="End ride"
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-8 h-8 rounded-full border border-gold/20 bg-transparent flex items-center justify-center opacity-20 hover:opacity-60 active:opacity-80 transition-opacity duration-300"
      >
        <span className="w-1 h-1 rounded-full bg-gold/50" />
      </button>

      {/* ── Operator handoff — faint, non-intrusive ─────── */}
      <button
        type="button"
        onClick={() => { experienceStore.reset(); router.push('/?guest=1'); }}
        aria-label="Return to booking"
        className="fixed bottom-5 left-5 z-50 w-8 h-8 rounded-full border border-gold/20 bg-transparent flex items-center justify-center opacity-20 hover:opacity-60 active:opacity-80 transition-opacity duration-300"
      >
        <span className="w-1 h-1 rounded-full bg-gold/50" />
      </button>

      {/* ── Main experience layout (non-complete states) ─── */}
      <AnimatePresence>
        {state.status !== 'complete' && (
          <motion.div
            key="experience"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col flex-1 min-h-screen"
          >

            {/* Brand mark — top left */}
            <BrandMark />

            {/* Status indicator — top right */}
            <StatusIndicator status={state.status} />

            {/* Main content — vertically centered */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 text-center">
              <AnimatePresence mode="wait">

                {/* Idle */}
                {state.status === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <p className="text-[10px] tracking-[6px] uppercase text-gold/30">
                      Prestige
                    </p>
                    <div
                      className="w-px h-16 mx-auto"
                      style={{
                        background:
                          'linear-gradient(to bottom, transparent, rgba(201,168,76,0.25), transparent)',
                      }}
                    />
                    <p className="text-[12px] text-lux-muted/50 tracking-widest">
                      Awaiting journey
                    </p>
                  </motion.div>
                )}

                {/* Preparing */}
                {state.status === 'preparing' && (
                  <motion.div
                    key="preparing"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-full border border-gold/40"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.2, 0.7] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.3, ease: 'easeInOut' }}
                        className="absolute inset-2 rounded-full border border-gold/25"
                      />
                      <div className="w-3 h-3 rounded-full bg-gold/70 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] tracking-[5px] uppercase text-gold/60">
                        Preparing
                      </p>
                      <p className="text-[13px] text-lux-muted">
                        Your experience is being prepared
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Ready */}
                {state.status === 'ready' && (
                  <ReadyView
                    key="ready"
                    guestName={state.guestName}
                    destination={state.destination}
                    occasion={state.occasion}
                    chauffeurName={state.chauffeurName}
                    eta={state.eta}
                    temperature={state.temperature}
                    music={state.music}
                  />
                )}

                {/* Active — same layout as ready, status strip changes to En Route */}
                {state.status === 'active' && (
                  <ReadyView
                    key="active"
                    guestName={state.guestName}
                    destination={state.destination}
                    occasion={state.occasion}
                    chauffeurName={state.chauffeurName}
                    eta={state.eta}
                    temperature={state.temperature}
                    music={state.music}
                    activeRide
                  />
                )}

              </AnimatePresence>
            </div>

            {/* Footer preferences — ready + active only */}
            <AnimatePresence>
              {showMap && (
                <ExperienceFooter
                  temperature={state.temperature}
                  music={state.music}
                  notes={state.notes}
                />
              )}
            </AnimatePresence>

            {/* Map — bottom-right corner, ready + active only */}
            <AnimatePresence>
              {showMap && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{ opacity: 0,    y: 16, scale: 0.97 }}
                  transition={{ duration: 0.65, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed bottom-6 right-6 z-20 w-56 sm:w-64"
                >
                  <MapEmbed destination={state.destination} />
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AmbientBackground
// ─────────────────────────────────────────────────────────

function AmbientBackground({ status }: { status: ExperienceStatus }) {
  const isActive   = status === 'active';
  const isReady    = status === 'ready';
  const isPreparing = status === 'preparing';
  const isComplete = status === 'complete';
  const showStars  = isReady || isActive;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Deep radial — always */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Center glow */}
      <motion.div
        animate={{
          opacity: isComplete ? 0.05 : isActive ? 1.2 : isReady ? 1 : isPreparing ? 0.4 : 0.1,
          scale:   isReady || isActive ? 1 : 0.7,
        }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div
          style={{
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </motion.div>

      {/* Corner vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 140% 140% at 50% 50%, transparent 40%, rgba(6,6,10,0.7) 100%)',
        }}
      />

      {/* Subtle top line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
        style={{
          width: '60%',
          background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)',
        }}
      />

      {/* Starlight — ready + active only */}
      <AnimatePresence>
        {showStars && <StarlightEffect key="stars" />}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// StarlightEffect
// ─────────────────────────────────────────────────────────

const STARS = [
  { x: '7%',  y: '11%', delay: 0,    dur: 3.2, size: 1.5 },
  { x: '15%', y: '28%', delay: 0.8,  dur: 3.8, size: 1   },
  { x: '23%', y: '8%',  delay: 1.5,  dur: 4.1, size: 2   },
  { x: '31%', y: '45%', delay: 0.3,  dur: 3.5, size: 1   },
  { x: '38%', y: '18%', delay: 2.1,  dur: 3.9, size: 1.5 },
  { x: '45%', y: '65%', delay: 1.1,  dur: 3.3, size: 1   },
  { x: '52%', y: '32%', delay: 0.6,  dur: 4.2, size: 2   },
  { x: '61%', y: '12%', delay: 1.8,  dur: 3.7, size: 1   },
  { x: '67%', y: '50%', delay: 0.4,  dur: 3.4, size: 1.5 },
  { x: '74%', y: '22%', delay: 2.3,  dur: 4.0, size: 1   },
  { x: '82%', y: '38%', delay: 0.9,  dur: 3.6, size: 2   },
  { x: '88%', y: '15%', delay: 1.4,  dur: 3.2, size: 1   },
  { x: '93%', y: '60%', delay: 0.2,  dur: 4.3, size: 1.5 },
  { x: '12%', y: '72%', delay: 1.7,  dur: 3.8, size: 1   },
  { x: '28%', y: '85%', delay: 0.5,  dur: 3.5, size: 1.5 },
  { x: '44%', y: '78%', delay: 2.0,  dur: 4.1, size: 1   },
  { x: '58%', y: '88%', delay: 1.2,  dur: 3.3, size: 2   },
  { x: '72%', y: '75%', delay: 0.7,  dur: 3.9, size: 1   },
  { x: '85%', y: '82%', delay: 1.6,  dur: 4.0, size: 1.5 },
  { x: '96%', y: '42%', delay: 2.4,  dur: 3.6, size: 1   },
  { x: '4%',  y: '55%', delay: 1.0,  dur: 3.7, size: 1.5 },
  { x: '19%', y: '93%', delay: 0.1,  dur: 3.4, size: 1   },
  { x: '35%', y: '62%', delay: 1.9,  dur: 4.2, size: 2   },
  { x: '50%', y: '92%', delay: 0.8,  dur: 3.5, size: 1   },
  { x: '77%', y: '5%',  delay: 1.3,  dur: 3.8, size: 1.5 },
];

function StarlightEffect() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="absolute inset-0"
    >
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{
            delay:    s.delay,
            duration: s.dur,
            repeat:   Infinity,
            ease:     'easeInOut',
          }}
          style={{
            position:     'absolute',
            left:         s.x,
            top:          s.y,
            width:        s.size,
            height:       s.size,
            borderRadius: '50%',
            background:   '#C9A84C',
          }}
        />
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// BrandMark
// ─────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative z-10 px-8 pt-8 flex flex-col gap-0.5"
    >
      <p className="text-[12px] tracking-[5px] uppercase text-gold/70 font-light">
        Prestige
      </p>
      <p className="text-[8px] tracking-[3px] uppercase text-lux-muted/40 font-light">
        by Synergy Lux
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// StatusIndicator
// ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExperienceStatus, { dot: string; label: string; labelColor: string }> = {
  idle:      { dot: 'bg-lux-muted/40',      label: 'Standby',  labelColor: 'text-lux-muted/50'   },
  preparing: { dot: 'bg-gold animate-pulse', label: 'Preparing', labelColor: 'text-gold/70'        },
  ready:     { dot: 'bg-emerald-400',        label: 'Ready',    labelColor: 'text-emerald-400/80'  },
  active:    { dot: 'bg-emerald-400',        label: 'En Route', labelColor: 'text-emerald-400/80'  },
  complete:  { dot: 'bg-lux-muted/40',       label: 'Arrived',  labelColor: 'text-lux-muted/60'   },
};

function StatusIndicator({ status }: { status: ExperienceStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="absolute top-8 right-8 z-10 flex items-center gap-2"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2"
        >
          <p className={`text-[9px] tracking-[3px] uppercase ${config.labelColor}`}>
            {config.label}
          </p>
          <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// ReadyView
// ─────────────────────────────────────────────────────────

// Function variant — each child supplies its own delay via custom prop
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function ReadyView({
  guestName,
  destination,
  occasion,
  chauffeurName,
  eta,
  temperature,
  music,
  activeRide = false,
}: {
  guestName: string;
  destination: string;
  occasion: string;
  chauffeurName: string;
  eta: number;
  temperature: number;
  music: boolean;
  activeRide?: boolean;
}) {
  const greeting  = timeGreeting();
  const firstName = guestName
    ? guestName.match(/^(Mr|Mrs|Ms|Dr)\.?\s/i) ? guestName : guestName.split(' ')[0]
    : '';
  const cabinLine = `${temperature}°F · ${music ? 'Ambient Music' : 'Quiet Mode'}`;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.4 } }}
      className="flex flex-col items-center gap-10 w-full"
      style={{ maxWidth: '800px' }}
    >

      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-5 text-center">

        {/* Brand line */}
        <div className="flex flex-col items-center gap-0.5">
          <p
            className="uppercase tracking-[6px] text-gold"
            style={{ fontSize: '13px', opacity: 0.8 }}
          >
            Prestige
          </p>
          <p
            className="uppercase tracking-[4px] text-lux-muted/50"
            style={{ fontSize: '9px' }}
          >
            by Synergy Lux · Dallas–Fort Worth
          </p>
        </div>

        {/* Prestige label */}
        <p className="text-[9px] tracking-[5px] uppercase text-gold/50 font-light">
          Prestige Experience
        </p>

        {/* Serif greeting */}
        <h1
          className="font-serif font-light leading-[1.1] text-lux-white"
          style={{ fontSize: '86px' }}
        >
          {greeting},
          {firstName && (
            <>
              {' '}
              <br />
              <em className="text-gold not-italic">{firstName}</em>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p
          className="text-lux-muted"
          style={{ fontSize: '22px', letterSpacing: '1px' }}
        >
          {activeRide
            ? `Your journey to ${destination || 'your destination'} is underway`
            : `Your journey to ${destination || 'your destination'} is prepared`}
        </p>

      </motion.div>

      {/* ── Two-card grid ────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0.2} className="grid grid-cols-2 gap-5 w-full">

        {/* Left card — Chauffeur + ETA */}
        <div
          className="flex flex-col gap-8"
          style={{
            background:   '#111111',
            border:       '1px solid rgba(201,168,76,0.15)',
            borderRadius: '24px',
            padding:      '40px',
            boxShadow:    '0 0 80px rgba(201,168,76,0.06), inset 0 0 20px rgba(201,168,76,0.06)',
          }}
        >
          {/* Chauffeur */}
          <div className="flex flex-col gap-1">
            <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50">
              Chauffeur
            </p>
            <p className="text-[28px] font-light text-lux-white leading-none">
              {chauffeurName}
            </p>
          </div>

          {/* ETA */}
          <div className="flex flex-col gap-1 mt-auto">
            <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50">
              Estimated Arrival
            </p>
            <div className="flex items-end gap-3 leading-none">
              <span
                className="font-serif font-light text-gold"
                style={{ fontSize: '82px', lineHeight: 1 }}
              >
                {eta}
              </span>
              <span
                className="text-lux-muted/60 pb-2"
                style={{ fontSize: '18px' }}
              >
                minutes
              </span>
            </div>
          </div>
        </div>

        {/* Right card — Cabin + Occasion + Route */}
        <div
          className="flex flex-col gap-7"
          style={{
            background:   '#111111',
            border:       '1px solid rgba(201,168,76,0.15)',
            borderRadius: '24px',
            padding:      '40px',
            boxShadow:    '0 0 80px rgba(201,168,76,0.06), inset 0 0 20px rgba(201,168,76,0.06)',
          }}
        >
          {/* Cabin */}
          <div className="flex flex-col gap-1">
            <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50">
              Cabin Prepared For You
            </p>
            <p className="text-[22px] font-light text-lux-white leading-snug">
              {cabinLine}
            </p>
          </div>

          {/* Occasion */}
          {occasion && (
            <div className="flex flex-col gap-1">
              <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50">
                Occasion
              </p>
              <p className="text-[18px] font-light text-lux-white/80">
                {occasion}
              </p>
            </div>
          )}

          {/* Route */}
          <div className="flex flex-col gap-1 mt-auto">
            <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50">
              Route
            </p>
            <p className="text-[18px] font-light text-lux-white/80 truncate">
              Optimized · Traffic-free
            </p>
            <p className={`text-[11px] tracking-[2px] uppercase mt-1 ${
              activeRide ? 'text-emerald-400' : 'text-gold/60'
            }`}>
              {activeRide ? 'En Route' : 'Confirmed'}
            </p>
          </div>
        </div>

      </motion.div>

      {/* ── Footer text ──────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0.4} className="text-center flex flex-col gap-1">
        <p className="text-[16px] text-lux-muted/40 tracking-wide">
          Everything has been prepared just for you.
        </p>
        <p className="text-[16px] text-lux-muted/40 tracking-wide">
          Sit back and enjoy the journey.
        </p>
      </motion.div>

      {/* ── Bottom glow text (fixed) ─────────────────────────── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <p
          className="text-gold text-center whitespace-nowrap"
          style={{ fontSize: '11px', opacity: 0.4, letterSpacing: '3px' }}
        >
          Prestige by Synergy Lux · Private Chauffeur
        </p>
      </div>

    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// ExperienceFooter
// ─────────────────────────────────────────────────────────

function ExperienceFooter({
  temperature,
  music,
  notes,
}: {
  temperature: number;
  music: boolean;
  notes: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 px-8 pb-8"
    >
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <FooterPill icon="❄" label={`${temperature}°F`} />
        <FooterPill
          icon={music ? '♪' : '○'}
          label={music ? 'Ambient Music' : 'Quiet Mode'}
        />
        {notes && <FooterPill icon="✎" label={notes} maxWidth />}
      </div>
    </motion.div>
  );
}

function FooterPill({
  icon,
  label,
  maxWidth,
}: {
  icon: string;
  label: string;
  maxWidth?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 border border-lux-border ${maxWidth ? 'max-w-[200px]' : ''}`}
      style={{ background: 'rgba(15,15,20,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <span className="text-gold/60 text-[11px] leading-none">{icon}</span>
      <span className="text-[11px] text-lux-muted tracking-wide truncate">{label}</span>
    </div>
  );
}
