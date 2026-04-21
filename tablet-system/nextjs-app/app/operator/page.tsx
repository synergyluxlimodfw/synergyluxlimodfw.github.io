'use client';

import { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { experienceStore } from '@/lib/experienceStore';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const DEFAULT_CHAUFFEUR = 'Mr. Rodriguez';
const OCCASIONS = [
  'Airport Transfer',
  'Business Travel',
  'Wedding',
  'Night Out',
  'Sporting Event',
  'Special Occasion',
];

function randomEta() {
  return Math.floor(Math.random() * 21) + 15; // 15–35 min
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  exit:   { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.3, ease: EASE } },
};

const sectionVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function OperatorPage() {
  const router = useRouter();

  // Core inputs
  const [name,        setName]        = useState('');
  const [destination, setDestination] = useState('');
  const [occasion,    setOccasion]    = useState('');
  const [chauffeur,   setChauffeur]   = useState(DEFAULT_CHAUFFEUR);

  // Advanced (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notes,        setNotes]        = useState('');
  const [temperature,  setTemperature]  = useState(72);
  const [musicEnabled, setMusicEnabled] = useState(false);

  // ETA — random on mount, then recalculates from destination
  const [eta, setEta] = useState(randomEta);

  // UI
  const [errors,         setErrors]         = useState<{ name?: string; destination?: string }>({});
  const [loading,        setLoading]        = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [launchedRideId, setLaunchedRideId] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && destination.trim().length > 0;

  // Hydrate store from sessionStorage on mount
  useEffect(() => { experienceStore.hydrate(); }, []);

  // ETA recalculates when destination changes
  useEffect(() => {
    if (!destination.trim()) { setEta(randomEta()); return; }
    const t = setTimeout(() => {
      const seed = destination.trim().length * 7;
      setEta(15 + (seed % 21));
    }, 500);
    return () => clearTimeout(t);
  }, [destination]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!name.trim())        errs.name        = 'Guest name is required';
    if (!destination.trim()) errs.destination = 'Destination is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLaunch() {
    if (!validate() || loading) return;
    setLoading(true);

    const chauffeurName = chauffeur.trim() || DEFAULT_CHAUFFEUR;

    experienceStore.setBasicInfo({
      guestName:     name.trim(),
      destination:   destination.trim(),
      occasion,
      chauffeurName,
    });
    experienceStore.setPreferences({
      temperature,
      music: musicEnabled,
      notes: notes.trim(),
    });
    experienceStore.launchExperience();

    // Await insert so we get the ride ID for the tablet URL
    const { data: ride } = await supabase.from('rides').insert({
      guest_name:  name.trim(),
      destination: destination.trim(),
      occasion:    occasion || null,
      chauffeur:   chauffeurName,
      eta_minutes: eta,
      status:      'preparing',
      vip_note:    notes.trim() || null,
    }).select('id').single();

    const rideId = ride?.id ?? null;
    if (rideId) experienceStore.setRideId(rideId);

    setLaunchedRideId(rideId);
    setLoading(false);
    setSuccess(true);
    // Stay on success screen — operator controls ride from here
  }

  return (
    <div className="min-h-screen bg-lux-black flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-y-auto">

      {/* Ambient glow — Element 1: top-center primary */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-0"
        style={{
          top:          '-120px',
          left:         '50%',
          width:        '600px',
          height:       '600px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(212,175,90,0.05) 0%, transparent 70%)',
          animation:    'ambientPulseCenter 8s ease-in-out infinite',
        }}
      />
      {/* Ambient glow — Element 2: bottom-right secondary */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-0"
        style={{
          bottom:       '-80px',
          right:        '-80px',
          width:        '400px',
          height:       '400px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(232,198,112,0.035) 0%, transparent 70%)',
          animation:    'ambientPulse 8s ease-in-out 4s infinite',
        }}
      />

      <AnimatePresence mode="wait">

        {/* ── Success bridge ──────────────────────────────── */}
        {success && (
          <SuccessState
            key="success"
            name={name}
            destination={destination}
            occasion={occasion}
            chauffeur={chauffeur.trim() || DEFAULT_CHAUFFEUR}
            eta={eta}
            rideId={launchedRideId}
            onReset={() => { setSuccess(false); setLaunchedRideId(null); }}
          />
        )}

        {/* ── Launcher card ───────────────────────────────── */}
        {!success && (
          <motion.div
            key="launcher"
            variants={cardVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative z-10 w-full max-w-lg rounded-3xl border border-lux-border bg-lux-card shadow-[0_0_120px_rgba(201,168,76,0.06)] my-4 sm:my-0"
          >
            {/* Inset top highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent rounded-full" />

            <div className="p-6 sm:p-10">

              {/* Staggered sections */}
              <motion.div variants={sectionVariants} initial="hidden" animate="show">

                {/* ── Header ─────────────────────────────── */}
                <motion.div variants={itemVariants} className="pt-4">
                  <p className="text-[9px] tracking-[5px] uppercase text-gold/50 mb-4">
                    Prestige · Operator Console
                  </p>
                  <h1 className="font-serif text-5xl font-light text-lux-white leading-none mb-3">
                    Prepare
                    <br />
                    <em
                      className="text-gold2"
                      style={{ textShadow: '0 0 40px rgba(212,175,90,0.2)' }}
                    >
                      Journey
                    </em>
                  </h1>
                  <p className="text-[13px] text-lux-muted leading-relaxed mb-8">
                    Confirm guest experience before arrival
                  </p>
                </motion.div>

                {/* ── Core inputs ─────────────────────────── */}
                <motion.div variants={itemVariants} className="mt-9 space-y-4">
                  <LuxInput
                    label="Guest Name"
                    required
                    error={errors.name}
                  >
                    <input
                      type="text"
                      value={name}
                      onChange={e => {
                        setName(e.target.value);
                        setErrors(p => ({ ...p, name: undefined }));
                      }}
                      placeholder="e.g. Marcus or Mr. Smith"
                      className={`lux-input ${errors.name ? 'lux-input-error' : ''}`}
                    />
                  </LuxInput>

                  <LuxInput
                    label="Destination"
                    required
                    error={errors.destination}
                  >
                    <input
                      type="text"
                      value={destination}
                      onChange={e => {
                        setDestination(e.target.value);
                        setErrors(p => ({ ...p, destination: undefined }));
                      }}
                      placeholder="e.g. DFW Terminal D"
                      className={`lux-input ${errors.destination ? 'lux-input-error' : ''}`}
                    />
                  </LuxInput>

                  <LuxInput label="Chauffeur Name">
                    <input
                      type="text"
                      value={chauffeur}
                      onChange={e => setChauffeur(e.target.value)}
                      placeholder="Mr. Rodriguez"
                      className="lux-input"
                    />
                  </LuxInput>

                  <LuxInput label="Occasion">
                    <div className="relative">
                      <select
                        value={occasion}
                        onChange={e => setOccasion(e.target.value)}
                        className="lux-input appearance-none pr-10"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Select occasion (optional)</option>
                        {OCCASIONS.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lux-muted text-xs select-none">
                        ▾
                      </span>
                    </div>
                  </LuxInput>
                </motion.div>

                {/* ── Summary panel ───────────────────────── */}
                <motion.div variants={itemVariants}>
                  <SummaryPanel
                    chauffeur={chauffeur.trim() || DEFAULT_CHAUFFEUR}
                    eta={eta}
                    temperature={temperature}
                    musicEnabled={musicEnabled}
                  />
                </motion.div>

                {/* ── Advanced accordion ──────────────────── */}
                <motion.div variants={itemVariants} className="mt-5">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(v => !v)}
                    className="group flex items-center gap-2.5 text-[10px] tracking-[3px] uppercase text-lux-muted hover:text-gold transition-colors duration-200"
                  >
                    <span
                      className={`
                        inline-flex items-center justify-center
                        w-5 h-5 rounded-full border border-lux-border
                        text-gold text-sm font-light leading-none
                        group-hover:border-gold/40 group-hover:bg-gold/5
                        transition-all duration-200
                        ${showAdvanced ? 'rotate-45' : 'rotate-0'}
                      `}
                    >
                      +
                    </span>
                    Personalize Experience
                  </button>

                  <AnimatePresence initial={false}>
                    {showAdvanced && (
                      <motion.div
                        key="advanced"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.32, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="pt-5 space-y-5">

                          {/* Temperature slider */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] tracking-[2.5px] uppercase text-lux-muted">
                                Cabin Temperature
                              </label>
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={temperature}
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-[13px] font-medium text-gold tabular-nums"
                                >
                                  {temperature}°F
                                </motion.span>
                              </AnimatePresence>
                            </div>
                            <div className="relative py-2">
                              <input
                                type="range"
                                min={65}
                                max={78}
                                step={1}
                                value={temperature}
                                onChange={e => setTemperature(Number(e.target.value))}
                                className="lux-slider w-full"
                                style={{
                                  background: `linear-gradient(to right, #C9A84C ${((temperature - 65) / 13) * 100}%, rgba(201,168,76,0.15) ${((temperature - 65) / 13) * 100}%)`,
                                }}
                              />
                              <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-lux-muted/60">65°F</span>
                                <span className="text-[10px] text-lux-muted/60">78°F</span>
                              </div>
                            </div>
                          </div>

                          {/* Music toggle */}
                          <div className="flex items-center justify-between py-0.5">
                            <div>
                              <p className="text-[10px] tracking-[2.5px] uppercase text-lux-muted">
                                Ambient Music
                              </p>
                              <p className="text-[11px] text-lux-muted/50 mt-0.5">
                                {musicEnabled ? 'Playing soft jazz' : 'Cabin quiet mode'}
                              </p>
                            </div>
                            <Toggle value={musicEnabled} onChange={setMusicEnabled} />
                          </div>

                          {/* Notes */}
                          <LuxInput label="Guest Notes">
                            <input
                              type="text"
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                              placeholder="e.g. Prefer silence, no phone calls"
                              className="lux-input"
                            />
                          </LuxInput>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── CTA ─────────────────────────────────── */}
                <motion.div variants={itemVariants} className="mt-8">
                  {/* Gold divider */}
                  <div style={{
                    width:      '60px',
                    height:     '1px',
                    background: 'linear-gradient(to right, rgba(201,168,76,0.6), rgba(201,168,76,0.1))',
                    margin:     '0 auto 28px',
                  }} />
                  <CTAButton
                    loading={loading}
                    disabled={!canSubmit}
                    onClick={handleLaunch}
                  />

                  <AnimatePresence>
                    {!canSubmit && !loading && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-[11px] text-lux-muted/50 mt-3"
                      >
                        Guest name and destination required
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

              </motion.div>

              {/* Footer */}
              <p className="text-center text-[11px] text-lux-muted/60 mt-7 tracking-wide">
                Prestige by Synergy Lux · Dallas–Fort Worth ·{' '}
                <a
                  href="tel:6468791391"
                  className="text-gold/80 hover:text-gold transition-colors duration-200"
                >
                  (646) 879-1391
                </a>
              </p>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LuxInput
// ─────────────────────────────────────────────────────────

function LuxInput({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-[10px] tracking-[2.5px] uppercase text-lux-muted mb-2"
      >
        {label}
        {required && <span className="text-gold/80">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] text-red-400/90 mt-1.5 flex items-center gap-1"
          >
            <span className="inline-block w-1 h-1 rounded-full bg-red-400/80" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SummaryPanel
// ─────────────────────────────────────────────────────────

function SummaryPanel({
  chauffeur,
  eta,
  temperature,
  musicEnabled,
}: {
  chauffeur: string;
  eta: number;
  temperature: number;
  musicEnabled: boolean;
}) {
  return (
    <div
      className="mt-7 rounded-2xl border border-lux-border bg-lux-card2 p-5 shadow-[inset_0_1px_0_rgba(201,168,76,0.06)]"
      style={{ borderTop: '2px solid rgba(201,168,76,0.25)' }}
    >
      <p className="text-[9px] tracking-[4px] uppercase text-gold/40 mb-4">
        Experience Summary
      </p>
      <div className="space-y-3.5">
        <SummaryRow label="Chauffeur" value={chauffeur} />
        <SummaryRow
          label="ETA"
          valueKey={String(eta)}
          value={`${eta} min`}
          accent="gold"
        />
        <SummaryRow label="Route" value="Optimized" />
        <SummaryRow
          label="Temperature"
          valueKey={String(temperature)}
          value={`${temperature}°F`}
        />
        <SummaryRow
          label="Cabin"
          valueKey={String(musicEnabled)}
          value={musicEnabled ? 'Ambient Music' : 'Quiet Mode'}
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueKey,
  accent,
}: {
  label: string;
  value: string;
  valueKey?: string;
  accent?: 'gold';
}) {
  const isAnimated = valueKey !== undefined;
  const textClass = `text-[13px] font-medium tracking-wide ${
    accent === 'gold' ? 'text-gold' : 'text-lux-white'
  }`;

  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-lux-muted/80 tracking-wide">{label}</span>
      {isAnimated ? (
        <AnimatePresence mode="wait">
          <motion.span
            key={valueKey}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.18 }}
            className={textClass}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span className={textClass}>{value}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`
        relative inline-flex w-11 h-6 rounded-full shrink-0
        transition-colors duration-300 focus:outline-none
        focus-visible:ring-2 focus-visible:ring-gold/50
        ${value ? 'bg-gold' : 'bg-white/10 hover:bg-white/15'}
      `}
    >
      <span
        className={`
          absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm
          transition-transform duration-300
          ${value ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// CTAButton
// ─────────────────────────────────────────────────────────

function CTAButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className="relative w-full py-5 px-8 rounded-2xl overflow-hidden font-serif text-[11px] font-light tracking-[0.25em] uppercase flex items-center justify-center gap-3 transition-shadow duration-300"
      style={{
        background:  'linear-gradient(135deg, #C9A84C 0%, #E8C670 50%, #C9A84C 100%)',
        color:       '#0A0A0A',
        boxShadow:   isDisabled ? 'none' : '0 4px 32px rgba(201,168,76,0.25), 0 0 60px rgba(201,168,76,0.10)',
        opacity:     isDisabled ? 0.4 : 1,
        cursor:      isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Shimmer overlay */}
      {!isDisabled && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
          }}
        />
      )}

      {loading ? (
        <>
          <Spinner />
          Preparing…
        </>
      ) : (
        'Launch Prestige Experience'
      )}
    </motion.button>
  );
}

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
      className="inline-block w-4 h-4 rounded-full border-2 border-[#06060A]/25 border-t-[#06060A]"
    />
  );
}

// ─────────────────────────────────────────────────────────
// SuccessState — Ride Live Control Panel
// ─────────────────────────────────────────────────────────

type RidePhase = 'preparing' | 'ready' | 'active' | 'complete';

function SuccessState({
  name,
  destination,
  occasion,
  chauffeur,
  eta,
  rideId,
  onReset,
}: {
  name: string;
  destination: string;
  occasion: string;
  chauffeur: string;
  eta: number;
  rideId: string | null;
  onReset: () => void;
}) {
  const [phase,           setPhase]           = useState<RidePhase>('preparing');
  const [copying,         setCopying]         = useState(false);
  const [bookingSent,     setBookingSent]      = useState(false);
  const [airportSmsSent,  setAirportSmsSent]  = useState(false);

  const origin    = typeof window !== 'undefined' ? window.location.origin : '';
  const tabletUrl = rideId ? `${origin}/experience?ride=${rideId}` : null;

  async function advanceTo(newPhase: RidePhase) {
    if (!rideId) return;
    setPhase(newPhase);

    const update: Record<string, unknown> = { status: newPhase };
    if (newPhase === 'active')   update.start_time = new Date().toISOString();
    if (newPhase === 'complete') update.end_time   = new Date().toISOString();

    await supabase.from('rides').update(update).eq('id', rideId);

    // When ride ends, fire post-ride SMS
    if (newPhase === 'complete') {
      fetch('/api/sms/post-ride', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rideId }),
      }).catch(err => console.error('[SMS] post-ride fire error:', err));
    }
  }

  async function sendAirportSms() {
    if (!rideId || airportSmsSent) return;
    setAirportSmsSent(true);
    await fetch('/api/sms/airport-return', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rideId }),
    });
  }

  async function showBooking() {
    if (!rideId || bookingSent) return;
    await supabase.from('rides').update({ show_booking: true }).eq('id', rideId);
    setBookingSent(true);
  }

  async function copyUrl() {
    if (!tabletUrl) return;
    await navigator.clipboard.writeText(tabletUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 1800);
  }

  const PHASES: { key: RidePhase; label: string; sub: string; color: string }[] = [
    { key: 'ready',    label: 'Ready — Client Boarding',  sub: 'Show welcome screen', color: '#C9A84C'  },
    { key: 'active',   label: 'En Route — Ride Active',   sub: 'Ride is underway',    color: '#4ADE80'  },
    { key: 'complete', label: 'End Ride — Show Gratuity', sub: 'Show thank-you',      color: '#F97316'  },
  ];

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="w-full max-w-lg rounded-3xl border border-lux-border bg-lux-card shadow-[0_0_120px_rgba(201,168,76,0.08)] my-4 sm:my-0"
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent rounded-full" />

      <div className="p-6 sm:p-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <p className="text-[9px] tracking-[5px] uppercase text-gold/50 mb-1">
              Prestige · Ride Live
            </p>
            <h2 className="font-serif text-[32px] sm:text-[38px] font-light text-lux-white leading-none">
              {name || 'Guest'} <em className="text-gold2">→</em> {destination || '…'}
            </h2>
          </div>
          {/* Live pulse */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-[9px] tracking-[3px] uppercase text-emerald-400/70">Live</span>
          </div>
        </motion.div>

        {/* Tablet URL — prominent */}
        {tabletUrl && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4, ease: EASE }}
            className="rounded-2xl p-4 mb-5"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)' }}
          >
            <p className="text-[9px] tracking-[4px] uppercase text-gold/50 mb-2">
              Tablet URL — open on mounted iPad
            </p>
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-lux-muted/80 flex-1 break-all leading-relaxed">
                {tabletUrl}
              </p>
              <button
                onClick={copyUrl}
                className="flex-shrink-0 rounded-xl px-3 py-2 text-[10px] font-semibold tracking-wide uppercase transition-all active:scale-95"
                style={{
                  background: copying ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.12)',
                  border:     copying ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(201,168,76,0.25)',
                  color:      copying ? '#4ADE80' : '#C9A84C',
                  minHeight:  '44px',
                  minWidth:   '64px',
                }}
              >
                {copying ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Guest summary row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24, duration: 0.4 }}
          className="rounded-2xl border border-lux-border bg-lux-card2 p-4 mb-5"
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Chauffeur', chauffeur],
              ['ETA',       `${eta} min`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[9px] tracking-[3px] uppercase text-lux-muted/50 mb-0.5">{label}</p>
                <p className="text-[13px] text-lux-white font-medium">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phase controls */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASE }}
        >
          <p className="text-[9px] tracking-[4px] uppercase text-lux-muted/40 mb-3">
            Advance Ride Phase
          </p>
          <div className="space-y-2.5">
            {PHASES.map(({ key, label, sub, color }) => {
              const isActive = phase === key;
              const isPast   = PHASES.findIndex(p => p.key === key) < PHASES.findIndex(p => p.key === phase);
              return (
                <button
                  key={key}
                  onClick={() => advanceTo(key)}
                  disabled={isActive || isPast}
                  className="w-full flex items-center justify-between rounded-2xl px-4 transition-all duration-200 active:scale-[0.98] disabled:cursor-default"
                  style={{
                    minHeight:  '56px',
                    background: isActive ? `${color}18` : isPast ? 'rgba(255,255,255,0.02)' : '#141419',
                    border:     `1px solid ${isActive ? `${color}40` : 'rgba(201,168,76,0.10)'}`,
                    opacity:    isPast ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: isActive ? color : (isPast ? color : 'rgba(201,168,76,0.3)') }}
                    />
                    <div className="text-left">
                      <p className="text-[12px] font-semibold tracking-wide" style={{ color: isActive ? color : '#EFEFEF' }}>
                        {label}
                      </p>
                      <p className="text-[10px] text-lux-muted/50">{sub}</p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[9px] tracking-[2px] uppercase font-semibold" style={{ color }}>
                      Active
                    </span>
                  )}
                  {!isActive && !isPast && (
                    <span className="text-[11px] text-lux-muted/30">→</span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Show Booking — operator-controlled trigger */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.4, ease: EASE }}
          className="mt-3"
        >
          <button
            onClick={showBooking}
            disabled={bookingSent || !rideId}
            className="w-full flex items-center justify-between rounded-2xl px-4 transition-all duration-200 active:scale-[0.98] disabled:cursor-default"
            style={{
              minHeight:  '56px',
              background: bookingSent ? 'rgba(201,168,76,0.10)' : '#141419',
              border:     `1px solid ${bookingSent ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.18)'}`,
              opacity:    !rideId ? 0.4 : 1,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: bookingSent ? '#C9A84C' : 'rgba(201,168,76,0.4)' }}
              />
              <div className="text-left">
                <p className="text-[12px] font-semibold tracking-wide" style={{ color: bookingSent ? '#C9A84C' : '#EFEFEF' }}>
                  Show Booking — 5 Min to Arrival
                </p>
                <p className="text-[10px] text-lux-muted/50">Transition tablet to booking screen</p>
              </div>
            </div>
            {bookingSent ? (
              <span className="text-[9px] tracking-[2px] uppercase font-semibold text-gold">Sent</span>
            ) : (
              <span className="text-[11px] text-lux-muted/30">→</span>
            )}
          </button>
        </motion.div>

        {/* Airport return SMS — only when occasion contains "airport" */}
        {destination?.toLowerCase().includes('airport') ||
         (occasion ?? '').toLowerCase().includes('airport') ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43, duration: 0.4, ease: EASE }}
            className="mt-3"
          >
            <button
              onClick={sendAirportSms}
              disabled={airportSmsSent || !rideId}
              className="w-full flex items-center justify-between rounded-2xl px-4 transition-all duration-200 active:scale-[0.98] disabled:cursor-default"
              style={{
                minHeight:  '56px',
                background: airportSmsSent ? 'rgba(201,168,76,0.10)' : '#141419',
                border:     `1px solid ${airportSmsSent ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.18)'}`,
                opacity:    !rideId ? 0.4 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: airportSmsSent ? '#C9A84C' : 'rgba(201,168,76,0.4)' }}
                />
                <div className="text-left">
                  <p className="text-[12px] font-semibold tracking-wide" style={{ color: airportSmsSent ? '#C9A84C' : '#EFEFEF' }}>
                    ✈ Send Return Ride Link
                  </p>
                  <p className="text-[10px] text-lux-muted/50">SMS client the airport return booking link</p>
                </div>
              </div>
              {airportSmsSent ? (
                <span className="text-[9px] tracking-[2px] uppercase font-semibold text-gold">Sent ✓</span>
              ) : (
                <span className="text-[11px] text-lux-muted/30">→</span>
              )}
            </button>
          </motion.div>
        ) : null}

        {/* Reset */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-center"
        >
          <button
            onClick={onReset}
            className="text-[10px] tracking-[3px] uppercase text-lux-muted/40 hover:text-lux-muted transition-colors"
          >
            ← New Ride
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}
