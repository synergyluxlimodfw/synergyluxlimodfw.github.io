'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore, experienceStore } from '@/lib/experienceStore';
import type { ExperienceStatus } from '@/lib/experienceStore';
import { supabase } from '@/lib/supabase';
import MapEmbed       from '@/components/MapEmbed';
import ThankYouScreen from '@/components/ThankYouScreen';

// Supabase rides row shape
type RideRow = {
  id: string;
  guest_name: string;
  destination: string;
  occasion: string | null;
  chauffeur: string;
  eta_minutes: number;
  status: string;
  vip_note: string | null;
};

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
// Page — Suspense wrapper required for useSearchParams
// ─────────────────────────────────────────────────────────

export default function ExperiencePage() {
  return (
    <Suspense>
      <ExperienceInner />
    </Suspense>
  );
}

function ExperienceInner() {
  const state       = useExperienceStore();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const rideParam   = searchParams.get('ride');

  // ── Supabase Realtime subscription ───────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      let targetId = rideParam;

      // No URL param — find the latest in-progress ride
      if (!targetId) {
        const { data } = await supabase
          .from('rides')
          .select('id')
          .in('status', ['preparing', 'ready', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        targetId = data?.id ?? null;
      }

      // No active ride anywhere — fall back to sessionStorage
      if (!targetId) {
        experienceStore.hydrate();
        return;
      }

      // Fetch the full ride row
      const { data: ride } = await supabase
        .from('rides')
        .select('*')
        .eq('id', targetId)
        .single();

      if (ride) experienceStore.loadFromRide(ride as RideRow);

      // Subscribe to realtime UPDATEs for this specific ride
      channel = supabase
        .channel(`ride-${targetId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${targetId}` },
          (payload) => {
            const row = payload.new as RideRow;
            if (row.status === 'complete') {
              // Call completeRide() only if not already complete — prevents
              // an update loop since completeRide() also writes back to Supabase
              if (experienceStore.getState().status !== 'complete') {
                experienceStore.completeRide();
              }
            } else {
              experienceStore.loadFromRide(row);
            }
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [rideParam]);

  // ── Booking auto-prompt — fires 30 s after ride goes active ─
  const [showBookingPrompt, setShowBookingPrompt] = useState(false);
  const [promptDismissed,   setPromptDismissed]   = useState(false);

  useEffect(() => {
    if (state.status !== 'active' || promptDismissed) return;
    const t = setTimeout(() => setShowBookingPrompt(true), 30_000);
    return () => clearTimeout(t);
  }, [state.status, promptDismissed]);

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

      {/* ── Booking auto-prompt banner ──────────────────────── */}
      <AnimatePresence>
        {showBookingPrompt && !promptDismissed && (
          <motion.div
            key="booking-prompt"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-5"
          >
            <div
              className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
              style={{
                background:    'rgba(8,8,13,0.96)',
                border:        '1px solid rgba(201,168,76,0.22)',
                boxShadow:     '0 -4px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.04)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Text */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-[9px] tracking-[4px] uppercase text-gold/55">
                  Before you step out
                </p>
                <p className="text-[15px] font-light text-lux-white leading-snug">
                  Secure your next ride
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowBookingPrompt(false); router.push('/?guest=1'); }}
                  className="rounded-xl px-5 py-3 text-[11px] font-bold tracking-[0.14em] uppercase transition-all active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF5A 0%, #C9A84C 60%, #B8932E 100%)',
                    color:      '#06060A',
                    boxShadow:  '0 2px 16px rgba(201,168,76,0.25)',
                    minHeight:  '44px',
                  }}
                >
                  Book Now
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBookingPrompt(false); setPromptDismissed(true); }}
                  aria-label="Dismiss"
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: '#666672' }}
                >
                  ✕
                </button>
              </div>
            </div>
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

// 60 cinematic starlight dots — golden-angle x distribution, varied sizes/speeds/opacity
// All values are deterministic (no Math.random) to avoid SSR hydration mismatches.
const SIZES  = [1, 1.5, 2, 2.5, 3] as const;
const SPEEDS = [4, 2.5, 1.5]       as const; // slow, medium, fast
const STARS  = Array.from({ length: 60 }, (_, i) => {
  const x     = ((i * 137.508) % 100).toFixed(1);       // golden-angle spread avoids clustering
  const y     = ((i * 97.319 + 31) % 100).toFixed(1);   // offset so y ≠ x distribution
  const size  = SIZES[i % 5];
  const dur   = SPEEDS[i % 3];
  const delay = parseFloat(((i * 0.371) % 3.5).toFixed(2));
  const opMin = 0.08 + (i % 5) * 0.04;                  // 0.08 → 0.24
  const opMax = opMin + 0.10 + (i % 3) * 0.04;          // opMin + 0.10–0.18 → max 0.35
  return { x: `${x}%`, y: `${y}%`, size, dur, delay, opMin, opMax };
});

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
          animate={{ opacity: [s.opMin, s.opMax, s.opMin] }}
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
      className="relative z-10 px-8 pt-8"
    >
      <p className="font-light whitespace-nowrap">
        <span className="text-[12px] tracking-[5px] uppercase text-gold/70">PRESTIGE</span>
        {' '}
        <span className="text-[10px] text-gold/40">✦</span>
        {' '}
        <span className="text-[8px] tracking-[3px] uppercase text-lux-muted/35">by Synergy Lux</span>
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
  hidden: { opacity: 0, y: 18, scale: 0.96, filter: 'blur(8px)' },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.9, delay, ease: [0.23, 1, 0.32, 1] as const },
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

        {/* Welcome line */}
        <div className="flex flex-col items-center gap-1.5">
          <p
            className="font-serif font-light text-gold"
            style={{ fontSize: '18px', letterSpacing: '2px' }}
          >
            Welcome to Prestige
          </p>
          <p
            className="text-lux-muted/50 italic font-light"
            style={{ fontSize: '13px' }}
          >
            Your journey is prepared just for you
          </p>
        </div>

        {/* Prestige label */}
        <p className="text-[9px] tracking-[5px] uppercase text-gold/40 font-light">
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
            border:       '1px solid rgba(201,168,76,0.2)',
            borderTop:    '2px solid rgba(201,168,76,0.2)',
            borderRadius: '24px',
            padding:      '40px',
            boxShadow:    '0 0 40px rgba(201,168,76,0.04), inset 0 1px 0 rgba(201,168,76,0.08)',
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
            border:       '1px solid rgba(201,168,76,0.2)',
            borderTop:    '2px solid rgba(201,168,76,0.2)',
            borderRadius: '24px',
            padding:      '40px',
            boxShadow:    '0 0 40px rgba(201,168,76,0.04), inset 0 1px 0 rgba(201,168,76,0.08)',
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
        <p className="text-[10px] tracking-[4px] uppercase text-gold/25 mt-2">
          Prestige — by Synergy Lux
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
