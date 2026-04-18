'use client';

import { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { experienceStore } from '@/lib/experienceStore';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const DEFAULT_CHAUFFEUR = 'W. Rodriguez';
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
  const [errors,  setErrors]  = useState<{ name?: string; destination?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

    experienceStore.setBasicInfo({
      guestName:     name.trim(),
      destination:   destination.trim(),
      occasion,
      chauffeurName: chauffeur.trim() || DEFAULT_CHAUFFEUR,
    });
    experienceStore.setPreferences({
      temperature,
      music: musicEnabled,
      notes: notes.trim(),
    });
    experienceStore.launchExperience();

    await sleep(1200);
    setLoading(false);
    setSuccess(true);
    await sleep(600);
    router.push('/experience');
  }

  return (
    <div className="min-h-screen bg-lux-black flex items-center justify-center p-8">

      {/* Ambient glow behind card */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(201,168,76,0.05) 0%, transparent 70%)',
        }}
      />

      <AnimatePresence mode="wait">

        {/* ── Success bridge ──────────────────────────────── */}
        {success && (
          <SuccessState
            key="success"
            name={name}
            destination={destination}
            chauffeur={chauffeur.trim() || DEFAULT_CHAUFFEUR}
            eta={eta}
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
            className="relative z-10 w-full max-w-lg rounded-3xl border border-lux-border bg-lux-card shadow-[0_0_120px_rgba(201,168,76,0.06)]"
          >
            {/* Inset top highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent rounded-full" />

            <div className="p-10">

              {/* Staggered sections */}
              <motion.div variants={sectionVariants} initial="hidden" animate="show">

                {/* ── Header ─────────────────────────────── */}
                <motion.div variants={itemVariants}>
                  <p className="text-[9px] tracking-[5px] uppercase text-gold/50 mb-4">
                    Operator Console
                  </p>
                  <h1 className="font-serif text-[44px] font-light text-lux-white leading-none mb-3">
                    Prepare
                    <br />
                    <em className="text-gold2">Journey</em>
                  </h1>
                  <p className="text-[13px] text-lux-muted leading-relaxed">
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
                      placeholder="W. Rodriguez"
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
                Synergy Lux · Dallas–Fort Worth ·{' '}
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
    <div className="mt-7 rounded-2xl border border-lux-border bg-lux-card2 p-5 shadow-[inset_0_1px_0_rgba(201,168,76,0.06)]">
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative w-full py-[18px] rounded-2xl overflow-hidden
        text-[11px] font-bold tracking-[0.22em] uppercase
        text-[#06060A]
        transition-all duration-300
        flex items-center justify-center gap-3
        ${disabled || loading
          ? 'opacity-40 cursor-not-allowed bg-gradient-to-r from-[#D4AF5A] via-gold to-[#B8932E]'
          : `
            bg-gradient-to-r from-[#D4AF5A] via-gold to-[#B8932E]
            shadow-[0_4px_32px_rgba(201,168,76,0.25)]
            hover:shadow-[0_4px_44px_rgba(201,168,76,0.40)]
            hover:brightness-110 hover:scale-[1.01]
            active:scale-[0.98] active:brightness-95
          `
        }
      `}
    >
      {/* Shimmer on hover — cosmetic */}
      {!disabled && !loading && (
        <span
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
          }}
        />
      )}

      {loading ? (
        <>
          <Spinner />
          Preparing…
        </>
      ) : (
        'Launch Experience'
      )}
    </button>
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
// SuccessState
// ─────────────────────────────────────────────────────────

function SuccessState({
  name,
  destination,
  chauffeur,
  eta,
}: {
  name: string;
  destination: string;
  chauffeur: string;
  eta: number;
}) {
  const rows = [
    ['Guest',       name],
    ['Chauffeur',   chauffeur],
    ['ETA',         `${eta} min`],
    ['Destination', destination],
  ] as const;

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="w-full max-w-lg rounded-3xl border border-lux-border bg-lux-card p-12 text-center shadow-[0_0_120px_rgba(201,168,76,0.08)]"
    >
      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
        className="w-16 h-16 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-8"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.32, type: 'spring', stiffness: 300 }}
          className="text-gold text-[22px] leading-none"
        >
          ✓
        </motion.span>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4, ease: EASE }}
      >
        <p className="text-[9px] tracking-[5px] uppercase text-gold/50 mb-3">
          Experience Ready
        </p>
        <h2 className="font-serif text-[38px] font-light text-lux-white leading-tight mb-2">
          Journey <em className="text-gold2">Prepared</em>
        </h2>
        <p className="text-[13px] text-lux-muted mb-8">
          Transferring to passenger screen…
        </p>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.4, ease: EASE }}
        className="rounded-2xl border border-lux-border bg-lux-card2 p-5 text-left space-y-3.5"
      >
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[11px] text-lux-muted/80">{label}</span>
            <span className="text-[13px] text-lux-white font-medium">{value}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
