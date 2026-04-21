'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
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

      // Subscribe to realtime UPDATEs for this specific ride
      channel = supabase
        .channel(`ride-${targetId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${targetId}` },
          (payload) => {
            const row = payload.new as RideRow;

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

  const showMap      = state.status === 'ready' || state.status === 'active';
  const rideIsLive   = state.status === 'ready' || state.status === 'active';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-lux-black flex flex-col">

      {/* Ambient background — always present */}
      <AmbientBackground status={state.status} />

      {/* ── Thank you overlay — complete state or gratuity peek ── */}
      <AnimatePresence>
        {(state.status === 'complete' || showGratuity) && (
          <ThankYouScreen
            guestName={state.guestName}
            onTip={(percent, dollar) => {
              console.log('[tip]', { percent, dollar });
            }}
            onBack={showGratuity && state.status !== 'complete'
              ? () => setShowGratuity(false)
              : undefined
            }
          />
        )}
      </AnimatePresence>

      {/* ── Pre-dropoff conversion screen ─────────────────── */}
      <AnimatePresence>
        {showPreDropoff && (
          <motion.div
            key="pre-dropoff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(6,6,10,0.92)', backdropFilter: 'blur(16px)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.96 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md mx-4"
              style={{
                background:     '#0F0F14',
                border:         '1px solid rgba(201,168,76,0.22)',
                borderTop:      '2px solid rgba(201,168,76,0.45)',
                borderRadius:   '28px',
                padding:        '44px 40px',
                boxShadow:      '0 0 80px rgba(0,0,0,0.8), 0 0 40px rgba(201,168,76,0.06)',
              }}
            >
              <p className="text-[9px] tracking-[5px] uppercase text-gold/50 mb-6">
                Almost There
              </p>
              <h2
                className="font-serif font-light text-lux-white mb-3"
                style={{ fontSize: '34px', lineHeight: 1.15 }}
              >
                Arriving{preDropoffDest ? ` at ${preDropoffDest}` : ' soon'}
              </h2>
              <p
                className="text-gold mb-8"
                style={{ fontSize: '13px', letterSpacing: '0.5px', opacity: 0.75 }}
              >
                ✦ 10% preferred rate when reserved before arrival
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreDropoff(false);
                    const p = new URLSearchParams();
                    if (preDropoffDest) p.set('destination', preDropoffDest);
                    if (preDropoffOcc)  p.set('occasion', preDropoffOcc);
                    router.push(`/aria${p.toString() ? `?${p.toString()}` : ''}`);
                  }}
                  className="w-full py-4 rounded-2xl text-[11px] font-semibold tracking-[1.5px] uppercase transition-all active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF5A, #C9A84C, #B8932E)',
                    color:      '#06060A',
                  }}
                >
                  Book This Same Route
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreDropoff(false);
                    const p = new URLSearchParams({ guest: '1' });
                    if (preDropoffDest) p.set('destination', preDropoffDest);
                    if (preDropoffOcc)  p.set('occasion', preDropoffOcc);
                    router.push(`/?${p.toString()}`);
                  }}
                  className="w-full py-3 rounded-2xl text-[11px] tracking-[1px] uppercase transition-all active:scale-[0.97]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border:     '1px solid rgba(255,255,255,0.08)',
                    color:      'rgba(239,239,239,0.45)',
                  }}
                >
                  Book via Booking Form
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreDropoff(false)}
                  className="w-full py-2 text-[10px] tracking-[1px] uppercase transition-opacity active:opacity-60"
                  style={{ color: 'rgba(201,168,76,0.30)', background: 'transparent', border: 'none' }}
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          </motion.div>
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
        onClick={() => {
          const dest = state.destination;
          const occ  = state.occasion;
          experienceStore.reset();
          const p = new URLSearchParams({ guest: '1' });
          if (dest) p.set('destination', dest);
          if (occ)  p.set('occasion', occ);
          router.push(`/?${p.toString()}`);
        }}
        aria-label="Return to booking"
        className="fixed bottom-5 left-5 z-50 w-8 h-8 rounded-full border border-gold/20 bg-transparent flex items-center justify-center opacity-20 hover:opacity-60 active:opacity-80 transition-opacity duration-300"
      >
        <span className="w-1 h-1 rounded-full bg-gold/50" />
      </button>

      {/* ── Gratuity pill — bottom-left, visible during ready/active ── */}
      <AnimatePresence>
        {rideIsLive && !showGratuity && (
          <motion.button
            key="gratuity-pill"
            type="button"
            onClick={() => setShowGratuity(true)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-6 z-30 transition-colors duration-200"
            style={{
              fontSize:     '9px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color:         'rgba(201,168,76,0.50)',
              background:    'transparent',
              border:        '1px solid rgba(201,168,76,0.25)',
              borderRadius:  '100px',
              padding:       '6px 12px',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.80)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.50)')}
          >
            ✦ Gratuity
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mid-ride return hook ── */}
      <AnimatePresence>
        {showReturnHook && (
          <motion.div
            key="return-hook"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background:     '#111111',
                border:         '1px solid rgba(201,168,76,0.20)',
                borderTop:      '2px solid rgba(201,168,76,0.20)',
                boxShadow:      '0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.05)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-[10px] tracking-[4px] uppercase text-gold/50 mb-2">Prestige</p>
              <p className="text-[17px] font-light text-lux-white mb-4">
                Need a ride later today?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnHook(false);
                    setReturnHookDismissed(true);
                    router.push('/aria');
                  }}
                  className="flex-1 py-3 rounded-xl text-[11px] font-semibold tracking-[1px] uppercase transition-all active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF5A, #C9A84C, #B8932E)',
                    color:      '#06060A',
                  }}
                >
                  Book a Ride
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnHook(false);
                    setReturnHookDismissed(true);
                  }}
                  className="px-4 py-3 rounded-xl text-[11px] tracking-[1px] uppercase transition-all active:scale-[0.97]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border:     '1px solid rgba(255,255,255,0.08)',
                    color:      'rgba(239,239,239,0.45)',
                  }}
                >
                  Not now
                </button>
              </div>
            </div>
          </motion.div>
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

      {/* Canvas particle drift — ready + active only */}
      {showStars && <CanvasStarfield />}

      {/* Starlight — ready + active only */}
      <AnimatePresence>
        {showStars && <StarlightEffect key="stars" />}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CanvasStarfield — 100 drifting particles via requestAnimationFrame
// ─────────────────────────────────────────────────────────

function CanvasStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seeded deterministic random using index so SSR/client match
    const rng = (seed: number) => {
      const x = Math.sin(seed + 1) * 43758.5453123;
      return x - Math.floor(x);
    };

    const particles = Array.from({ length: 100 }, (_, i) => ({
      x:            rng(i * 3)     * window.innerWidth,
      y:            rng(i * 3 + 1) * window.innerHeight,
      size:         rng(i * 3 + 2) * 1.5 + 0.4,
      speedX:       (rng(i * 7)     - 0.5) * 0.12,
      speedY:       (rng(i * 7 + 1) - 0.5) * 0.12,
      baseOpacity:  rng(i * 11)    * 0.22 + 0.04,
      twinkle:      rng(i * 13)    * Math.PI * 2,
      twinkleSpeed: rng(i * 17)    * 0.018 + 0.004,
    }));

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.twinkle += p.twinkleSpeed;
        const alpha = p.baseOpacity * (0.55 + 0.45 * Math.sin(p.twinkle));
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(201,168,76,${alpha.toFixed(3)})`;
        ctx!.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0)              p.x = canvas!.width;
        if (p.x > canvas!.width)  p.x = 0;
        if (p.y < 0)              p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
        opacity:       0.8,
      }}
    />
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

        {/* Cabin status line */}
        <p style={{ fontSize: '12px', letterSpacing: '2.5px', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase' }}>
          {temperature}°F · {music ? 'Ambient Music' : 'Quiet Mode'} · Complimentary Wi-Fi
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
