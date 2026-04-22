'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useExperienceStore, experienceStore } from '@/lib/experienceStore';
import type { ExperienceStatus } from '@/lib/experienceStore';
import { supabase } from '@/lib/supabase';
import { playExitTone } from '@/lib/audio';
import MapEmbed            from '@/components/MapEmbed';
import ThankYouScreen      from '@/components/ThankYouScreen';
import PrestigeBackground  from '@/components/PrestigeBackground';
import PrestigeTabletFull  from '@/components/PrestigeTabletFull';

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
  show_booking: boolean | null;
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
  const state        = useExperienceStore();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rideParam    = searchParams.get('ride');

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
      setPrestigeRideId(ride?.id || '');
      setPrestigeEta(ride?.eta_minutes || 0);
      setPrestigePhone((ride as any)?.phone || '');
      setPrestigePickup((ride as any)?.pickup || '');

      // Subscribe to realtime UPDATEs for this specific ride
      channel = supabase
        .channel(`ride-${targetId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${targetId}` },
          (payload) => {
            const row = payload.new as RideRow;
            console.log('[realtime]', row.status, 'show_booking:', row.show_booking);
            setPrestigePhone((row as any)?.phone || '');
            setPrestigePickup((row as any)?.pickup || '');
            setPrestigeEta((row as any)?.eta_minutes || 0);

            // Operator triggered booking screen — show pre-dropoff conversion screen
            if (row.show_booking === true) {
              setPreDropoffDest(row.destination || '');
              setPreDropoffOcc(row.occasion || null);
              setShowPreDropoff(true);
              return;
            }

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

  const [showGratuity,        setShowGratuity]        = useState(false);
  const [showReturnHook,      setShowReturnHook]      = useState(false);
  const [returnHookDismissed, setReturnHookDismissed] = useState(false);
  const [showPreDropoff,      setShowPreDropoff]      = useState(false);
  const [preDropoffDest,      setPreDropoffDest]      = useState('');
  const [preDropoffOcc,       setPreDropoffOcc]       = useState<string | null>(null);
  const [exitComplete,        setExitComplete]        = useState(false);
  const [dimmingStarlight,    setDimmingStarlight]    = useState(false);
  const [showBell,            setShowBell]            = useState(false);
  const chimeFiredRef = useRef(false);

  const [prestigePhone,  setPrestigePhone]  = useState<string>('');
  const [prestigePickup, setPrestigePickup] = useState<string>('');
  const [prestigeRideId, setPrestigeRideId] = useState<string>('');
  const [prestigeEta,    setPrestigeEta]    = useState<number>(0);

  // Show bell overlay when ride becomes ready
  useEffect(() => {
    if (state.status === 'ready' && !chimeFiredRef.current) {
      setShowBell(true);
    }
  }, [state.status]);

  // Bell tap — plays arrival chime synchronously inside gesture handler
  // so Safari's autoplay policy is guaranteed to be satisfied
  function handleBellTap() {
    if (chimeFiredRef.current) return;
    chimeFiredRef.current = true;
    setShowBell(false);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      ([
        [392, 0],
        [523, 0.18],
        [659, 0.36],
      ] as [number, number][]).forEach(([freq, delay]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.7);
      });

      setTimeout(() => ctx.close(), 2000);
    } catch { /* silent */ }
  }

  // Mid-ride soft hook — show after 10 min of active ride
  useEffect(() => {
    if (state.status !== 'active') return;
    const timer = setTimeout(() => {
      if (!returnHookDismissed) setShowReturnHook(true);
    }, 600000);
    return () => clearTimeout(timer);
  }, [state.status, returnHookDismissed]);

  // 8-second auto-dismiss for the mid-ride return hook
  useEffect(() => {
    if (!showReturnHook) return;
    const timer = setTimeout(() => {
      setShowReturnHook(false);
      setReturnHookDismissed(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [showReturnHook]);

  function mapStatusToRideState(
    status: string,
    showBooking: boolean
  ): "arrival" | "cruise" | "mid-ride" | "pre-dropoff" {
    if (showBooking) return "pre-dropoff";
    if (status === "preparing") return "arrival";
    if (status === "ready") return "arrival";
    if (status === "active") return "cruise";
    if (status === "complete") return "pre-dropoff";
    return "arrival";
  }

  if (exitComplete && state.status === 'complete') {
    return (
      <ThankYouScreen
        guestName={state.guestName}
        onTip={(percent, dollar) => {
          console.log('[tip]', { percent, dollar });
        }}
      />
    );
  }

  const currentRideState = mapStatusToRideState(
    state.status,
    showPreDropoff
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-lux-black flex flex-col items-center justify-center">

      <AnimatePresence>
        {showBell && (
          <motion.div
            key="bell-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={handleBellTap}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 48, height: 48 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#D4AF5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#D4AF5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
              <p style={{ fontSize: 10, letterSpacing: '5px', textTransform: 'uppercase', color: 'rgba(212,175,90,0.6)' }}>
                Tap to begin
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.status === 'complete' && !exitComplete && (
          <ExitMoment
            key="exit-moment"
            chauffeurName={state.chauffeurName || 'Mr. Rodriguez'}
            onDimStarlight={() => setDimmingStarlight(true)}
            onComplete={() => setExitComplete(true)}
          />
        )}
      </AnimatePresence>

      <div style={{ width: '100%', maxWidth: 768, padding: '0 20px' }}>
        <PrestigeTabletFull
          externalRideState={currentRideState}
          externalClientName={state.guestName || ''}
          externalDestination={state.destination || ''}
          externalRideId={prestigeRideId}
          externalPhone={prestigePhone}
          externalPickup={prestigePickup}
          externalOccasion={state.occasion || ''}
          externalEta={prestigeEta}
          hideStartScreen={true}
          hideDevControls={true}
        />
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AmbientBackground
// ─────────────────────────────────────────────────────────

function AmbientBackground({ status }: { status: ExperienceStatus }) {
  const isActive    = status === 'active';
  const isReady     = status === 'ready';
  const isPreparing = status === 'preparing';
  const isComplete  = status === 'complete';

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
// ExitMoment — cinematic sequence when ride completes
// ─────────────────────────────────────────────────────────

function ExitMoment({
  chauffeurName,
  onDimStarlight,
  onComplete,
}: {
  chauffeurName: string;
  onDimStarlight: () => void;
  onComplete: () => void;
}) {
  const [textVisible,    setTextVisible]    = useState(false);
  const exitToneFiredRef = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 1500);
    const t2 = setTimeout(() => onDimStarlight(), 8000);
    const t3 = setTimeout(() => onComplete(), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plays exit tone synchronously on first tap — Safari-safe
  function handleExitTap() {
    if (exitToneFiredRef.current) return;
    exitToneFiredRef.current = true;
    playExitTone();
  }

  return (
    <motion.div
      key="exit-moment"
      className="fixed inset-0 flex items-center justify-center cursor-pointer"
      style={{ background: '#06060A', zIndex: 70 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      onClick={handleExitTap}
      onTouchStart={handleExitTap}
    >
      <AnimatePresence>
        {textVisible && (
          <motion.div
            key="exit-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center gap-6 text-center px-8"
          >
            <p
              style={{
                fontSize:      '10px',
                letterSpacing: '5px',
                textTransform: 'uppercase',
                color:         'rgba(255,255,255,0.50)',
              }}
            >
              PRESTIGE · BY SYNERGY LUX
            </p>
            <h2
              className="font-[family-name:var(--font-cormorant)] font-light"
              style={{
                fontSize:   'clamp(1.75rem, 4vw, 2.25rem)',
                lineHeight: 1.25,
                color:      'rgba(255,255,255,0.90)',
              }}
            >
              Thank you for traveling with us
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(251,191,36,0.60)', letterSpacing: '2px' }}>
              {chauffeurName} · Dallas–Fort Worth
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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

  // Occasion-specific personalized line
  const occasionLine = (() => {
    const occ = (occasion || '').toLowerCase();
    if (occ.includes('wedding')) {
      return { text: 'Wishing you a beautiful celebration', serif: true, color: 'rgba(252,211,77,0.60)', italic: true };
    }
    if (occ.includes('birthday')) {
      return { text: `Happy Birthday${firstName ? `, ${firstName}` : ''}`, serif: true, color: 'rgba(253,230,138,0.70)', italic: true };
    }
    if (occ.includes('anniversary')) {
      return { text: 'Wishing you a wonderful anniversary', serif: true, color: 'rgba(252,211,77,0.60)', italic: true };
    }
    if (occ.includes('corporate') || occ.includes('business')) {
      return { text: 'Your journey is confirmed and on schedule', serif: false, color: 'rgba(255,255,255,0.40)', italic: false };
    }
    return null;
  })();

  // Name breathing animation — entrance then infinite subtle pulse
  const nameControls = useAnimation();
  useEffect(() => {
    if (!firstName) return;
    async function runNameSequence() {
      await nameControls.start({
        opacity: 1, scale: 1, filter: 'blur(0px)',
        transition: { duration: 1.4, delay: 0.4, ease: [0.23, 1, 0.32, 1] },
      });
      nameControls.start({
        scale:   [1.0, 1.015, 1.0],
        opacity: [1.0, 0.85,  1.0],
        transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      });
    }
    runNameSequence();
  }, [nameControls, firstName]);

  // ETA heartbeat — entrance then slow pulse
  const etaControls = useAnimation();
  useEffect(() => {
    async function runEtaSequence() {
      await etaControls.start({
        opacity: 1, scale: 1,
        transition: { duration: 0.9, delay: 0.35, ease: [0.23, 1, 0.32, 1] },
      });
      etaControls.start({
        scale: [1.0, 1.008, 1.0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      });
    }
    runEtaSequence();
  }, [etaControls]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.4 } }}
      className="flex flex-col items-center gap-16 w-full"
      style={{ maxWidth: '900px' }}
    >

      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-10 text-center">

        {/* Brand line */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="uppercase tracking-[6px] text-gold" style={{ fontSize: '13px', opacity: 0.8 }}>
            Prestige
          </p>
          <p className="uppercase tracking-[4px] text-lux-muted/50" style={{ fontSize: '9px' }}>
            by Synergy Lux · Dallas–Fort Worth
          </p>
        </div>

        {/* GREETING — two-line elegant structure */}
        <div className="flex flex-col items-center" style={{ gap: '0.75rem' }}>

          {/* Line 1 — "Welcome to Prestige" */}
          <p
            className="font-[family-name:var(--font-cormorant)] font-light"
            style={{
              fontSize:      'clamp(0.875rem, 1.5vw, 1.125rem)',
              color:         'rgba(255,255,255,0.45)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom:  '0.5rem',
            }}
          >
            Welcome to Prestige
          </p>

          {/* Line 2 — dominant greeting: "Good evening, [Name]" */}
          <p
            className="font-[family-name:var(--font-cormorant)] font-light tracking-wide"
            style={{
              fontSize:      'clamp(2.5rem, 6vw, 5rem)',
              lineHeight:    1.1,
              color:         'rgba(239,239,239,0.60)',
              textShadow:    '0 0 80px rgba(212,175,90,0.25)',
              marginBottom:  'clamp(1rem, 2vw, 2rem)',
            }}
          >
            {greeting},{firstName && (
              <>
                {' '}
                <motion.span
                  initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                  animate={nameControls}
                  style={{ color: '#E8C670', display: 'inline-block' }}
                >
                  {firstName}
                </motion.span>
              </>
            )}
          </p>

        </div>

        {/* Subtitle */}
        <p className="text-lux-muted" style={{ fontSize: '18px', letterSpacing: '1px' }}>
          Your journey to{' '}
          <span style={{ textTransform: 'capitalize' }}>
            {destination || 'your destination'}
          </span>
          {' '}{activeRide ? 'is underway' : 'is prepared'}
        </p>

        {/* Occasion-specific personalized line */}
        {occasionLine && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className={occasionLine.serif ? 'font-[family-name:var(--font-cormorant)]' : ''}
            style={{
              fontSize:    '15px',
              color:       occasionLine.color,
              fontStyle:   occasionLine.italic ? 'italic' : 'normal',
              letterSpacing: occasionLine.serif ? '0.5px' : '1.5px',
              textAlign:   'center',
              marginTop:   '4px',
            }}
          >
            {occasionLine.text}
          </motion.p>
        )}

        {/* Cabin status line — with thin 80px gold rule above */}
        <div className="flex flex-col items-center gap-3">
          <div style={{ width: '80px', borderTop: '1px solid rgba(212,175,90,0.20)', margin: '0 auto' }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(212,175,90,0.50)' }}>
            {temperature}°F · {music ? 'Ambient Music' : 'Quiet Mode'} · Complimentary Wi-Fi
          </p>
        </div>

      </motion.div>

      {/* ── Two-card grid ────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0.25} className="grid grid-cols-2 gap-6 w-full">

        {/* Left card — Chauffeur + ETA */}
        <div
          className="flex flex-col gap-10 backdrop-blur-md"
          style={{
            background:     'rgba(15,15,18,0.88)',
            border:         '1px solid rgba(255,255,255,0.04)',
            borderTop:      '2px solid rgba(201,168,76,0.28)',
            borderRadius:   '24px',
            padding:        '52px',
            boxShadow:      '0 0 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          {/* Chauffeur */}
          <div className="flex flex-col gap-2">
            <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50">
              Chauffeur
            </p>
            <p
              className="font-light leading-none"
              style={{
                fontSize:   '32px',
                color:      '#D4AF5A',
                textShadow: '0 0 30px rgba(212,175,90,0.20)',
                fontWeight: 400,
              }}
            >
              {chauffeurName}
            </p>
          </div>

          {/* ETA */}
          <div className="flex flex-col gap-2 mt-auto">
            <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50">
              Estimated Arrival
            </p>
            <div className="flex items-end gap-3 leading-none">
              <motion.span
                initial={{ opacity: 0, scale: 0.95 }}
                animate={etaControls}
                className="font-[family-name:var(--font-cormorant)] font-light text-gold"
                style={{
                  fontSize:   'clamp(72px, 10vw, 96px)',
                  lineHeight: 1,
                  display:    'inline-block',
                  textShadow: '0 0 40px rgba(212,175,90,0.35), 0 0 80px rgba(212,175,90,0.15)',
                }}
              >
                {eta}
              </motion.span>
              <span className="text-lux-muted/60 pb-2" style={{ fontSize: '18px' }}>
                minutes
              </span>
            </div>
          </div>
        </div>

        {/* Right card — Cabin + Occasion + Route */}
        <div
          className="flex flex-col gap-9 backdrop-blur-md"
          style={{
            background:     'rgba(15,15,18,0.88)',
            border:         '1px solid rgba(255,255,255,0.04)',
            borderTop:      '2px solid rgba(201,168,76,0.28)',
            borderRadius:   '24px',
            padding:        '52px',
            boxShadow:      '0 0 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)',
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
      <motion.div variants={fadeUp} custom={0.45} className="text-center flex flex-col gap-3">
        <p className="text-lux-muted/40 tracking-wide" style={{ fontSize: '15px' }}>
          Everything has been prepared just for you.
        </p>
        <p className="text-lux-muted/40 tracking-wide" style={{ fontSize: '15px' }}>
          Sit back and enjoy the journey.
        </p>
        <p className="text-[10px] tracking-[4px] uppercase text-gold/25 mt-3">
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
      <p className="text-xs text-gray-400 text-center py-2">
        © 2026 Prestige by Synergy Lux · All rights reserved.
      </p>
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
