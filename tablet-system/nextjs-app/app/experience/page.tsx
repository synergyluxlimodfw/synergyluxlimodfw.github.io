'use client';

import { useEffect } from 'react';
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
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function ExperiencePage() {
  const state = useExperienceStore();

  useEffect(() => { experienceStore.hydrate(); }, []);

  const showMap = state.status === 'ready' || state.status === 'active';

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
                      Synergy Lux
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
    </div>
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
      className="relative z-10 px-8 pt-8"
    >
      <p className="text-[10px] tracking-[6px] uppercase text-gold/50 font-light">
        Synergy Lux
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

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function ReadyView({
  guestName,
  destination,
  occasion,
  chauffeurName,
  eta,
  activeRide = false,
}: {
  guestName: string;
  destination: string;
  occasion: string;
  chauffeurName: string;
  eta: number;
  activeRide?: boolean;
}) {
  const floatVariant = {
    initial: { y: 0 },
    float: {
      y: [-6, 6, -6],
      transition: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
    },
  };

  const greeting    = timeGreeting();
  const displayName = guestName ? `, ${guestName.split(' ')[0]}` : '';

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.4 } }}
      className="flex flex-col items-center gap-8 w-full max-w-xl"
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} className="space-y-1">
        <p className="text-[10px] tracking-[5px] uppercase text-gold/50">
          {greeting}{displayName}
        </p>
        <p className="text-[13px] text-lux-muted tracking-wide">
          {activeRide ? 'Your journey is underway' : 'Your journey is ready'}
        </p>
      </motion.div>

      {/* Destination centerpiece — floating */}
      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
        <motion.div
          variants={floatVariant}
          initial="initial"
          animate="float"
          className="text-center"
        >
          <h1
            className="font-serif text-[52px] sm:text-[64px] font-light leading-none text-lux-white"
            style={{ textShadow: '0 0 60px rgba(201,168,76,0.15)' }}
          >
            {destination || 'Your Destination'}
          </h1>
          {occasion && (
            <p className="text-[11px] tracking-[4px] uppercase text-gold/50 mt-3">
              {occasion}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Journey details strip */}
      <motion.div variants={fadeUp} className="w-full">
        <div
          className="rounded-2xl border border-lux-border p-5"
          style={{ background: 'rgba(15,15,20,0.7)', backdropFilter: 'blur(12px)' }}
        >
          <div className="grid grid-cols-3 divide-x divide-lux-border">
            <DetailCell label="Chauffeur" value={chauffeurName} />
            <DetailCell label="ETA"       value={`~${eta} min`} highlight />
            <DetailCell
              label="Status"
              value={activeRide ? 'En Route' : 'Confirmed'}
              accent
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailCell({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-1">
      <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/70">{label}</p>
      <p className={`text-[14px] font-medium tracking-wide ${
        accent ? 'text-emerald-400' : highlight ? 'text-gold' : 'text-lux-white'
      }`}>
        {value}
      </p>
    </div>
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
