'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Session } from '@/lib/types';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const DEFAULT_CHAUFFEUR = 'Will Rodriguez';
const BASE_ETA   = 24;
const OCCASIONS  = [
  'Airport Transfer',
  'Business Travel',
  'Wedding',
  'Night Out',
  'Sporting Event',
  'Special Occasion',
];
const TEMPS = ['68°F', '70°F', '72°F', '74°F', '76°F'];

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────

interface OperatorPanelProps {
  onStart: (session: Session) => void;
}

export default function OperatorPanel({ onStart }: OperatorPanelProps) {
  // Core inputs
  const [name,        setName]        = useState('');
  const [destination, setDestination] = useState('');
  const [chauffeur,   setChauffeur]   = useState(DEFAULT_CHAUFFEUR);
  const [occasion,    setOccasion]    = useState('');

  // Advanced (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [vipNote,      setVipNote]      = useState('');
  const [temperature,  setTemperature]  = useState('72°F');
  const [musicEnabled, setMusicEnabled] = useState(false);

  // Auto-generated summary
  const [eta, setEta] = useState(BASE_ETA);

  // UI
  const [errors,  setErrors]  = useState<{ name?: string; destination?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mock ETA recalculation whenever destination changes
  useEffect(() => {
    if (!destination.trim()) { setEta(BASE_ETA); return; }
    const t = setTimeout(() => {
      // Deterministic-ish mock so it doesn't flicker on every keystroke
      const seed = destination.trim().length * 3;
      setEta(14 + (seed % 22));
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
    await sleep(1200);
    setLoading(false);
    setSuccess(true);
    await sleep(900);
    onStart({
      name:        name.trim(),
      occasion,
      destination: destination.trim(),
      vipNote:     vipNote.trim(),
      chauffeur:   chauffeur.trim() || DEFAULT_CHAUFFEUR,
      etaMinutes:  eta,
    });
  }

  return (
    <div className="min-h-screen bg-lux-black flex items-center justify-center p-8">
      <AnimatePresence mode="wait">

        {/* ── Success state ─────────────────────────────── */}
        {success && (
          <SuccessState
            key="success"
            name={name}
            destination={destination}
            chauffeur={chauffeur.trim() || DEFAULT_CHAUFFEUR}
            eta={eta}
          />
        )}

        {/* ── Experience Launcher ───────────────────────── */}
        {!success && (
          <motion.div
            key="launcher"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg rounded-3xl border border-lux-border bg-lux-card p-10 shadow-[0_0_120px_rgba(201,168,76,0.06)]"
          >
            {/* ── Header ─────────────────────────────────── */}
            <Header />

            {/* ── Core inputs ────────────────────────────── */}
            <div className="mt-9 space-y-4">
              <InputGroup label="Guest Name" required error={errors.name}>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                  placeholder="e.g. Mr. Smith"
                  className="lux-input"
                />
              </InputGroup>

              <InputGroup label="Destination" required error={errors.destination}>
                <input
                  type="text"
                  value={destination}
                  onChange={e => { setDestination(e.target.value); setErrors(p => ({ ...p, destination: undefined })); }}
                  placeholder="e.g. DFW Terminal D"
                  className="lux-input"
                />
              </InputGroup>

              <InputGroup label="Chauffeur Name">
                <input
                  type="text"
                  value={chauffeur}
                  onChange={e => setChauffeur(e.target.value)}
                  placeholder="Will Rodriguez"
                  className="lux-input"
                />
              </InputGroup>

              <InputGroup label="Occasion">
                <div className="relative">
                  <select
                    value={occasion}
                    onChange={e => setOccasion(e.target.value)}
                    className="lux-input appearance-none pr-10"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">Select occasion (optional)</option>
                    {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lux-muted text-xs">
                    ▾
                  </span>
                </div>
              </InputGroup>
            </div>

            {/* ── Auto-generated summary panel ───────────── */}
            <SummaryPanel
              chauffeur={chauffeur.trim() || DEFAULT_CHAUFFEUR}
              eta={eta}
              temperature={temperature}
              musicEnabled={musicEnabled}
            />

            {/* ── Advanced options ────────────────────────── */}
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-lux-muted hover:text-gold transition-colors duration-200"
              >
                <span
                  className={`text-gold font-light text-base leading-none transition-transform duration-200 ${showAdvanced ? 'rotate-45' : ''}`}
                >
                  +
                </span>
                Personalize Experience
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5 space-y-4">
                      <InputGroup label="VIP Note">
                        <input
                          type="text"
                          value={vipNote}
                          onChange={e => setVipNote(e.target.value)}
                          placeholder="e.g. Prefer silence, no phone calls"
                          className="lux-input"
                        />
                      </InputGroup>

                      <InputGroup label="Cabin Temperature">
                        <div className="relative">
                          <select
                            value={temperature}
                            onChange={e => setTemperature(e.target.value)}
                            className="lux-input appearance-none pr-10"
                            style={{ colorScheme: 'dark' }}
                          >
                            {TEMPS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lux-muted text-xs">
                            ▾
                          </span>
                        </div>
                      </InputGroup>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-[10px] tracking-[2.5px] uppercase text-lux-muted">
                          Ambient Music
                        </span>
                        <Toggle value={musicEnabled} onChange={setMusicEnabled} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Primary CTA ─────────────────────────────── */}
            <CTAButton loading={loading} onClick={handleLaunch} />

            {/* ── Footer ──────────────────────────────────── */}
            <p className="text-center text-[11px] text-lux-muted mt-6 tracking-wide">
              Prestige by Synergy Lux · Dallas–Fort Worth ·{' '}
              <a href="tel:6468791391" className="text-gold hover:text-gold2 transition-colors">
                (646) 879-1391
              </a>
            </p>
            <p className="text-xs text-gray-400 text-center py-2">
              © 2026 Synergy Lux Limo DFW LLC. All rights reserved.
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.45 }}
    >
      <p className="text-[9px] tracking-[5px] uppercase text-gold/50 mb-4">
        Prestige · Operator Console
      </p>
      <h1 className="font-serif text-[44px] font-light text-lux-white leading-[1.0] mb-3">
        Prepare
        <br />
        <em className="text-gold2">Journey</em>
      </h1>
      <p className="text-[12px] text-lux-muted leading-relaxed tracking-wide">
        Confirm guest experience before arrival
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
// InputGroup
// ─────────────────────────────────────────────────────────

function InputGroup({
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
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] tracking-[2.5px] uppercase text-lux-muted mb-2">
        {label}
        {required && <span className="text-gold">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-red-400 mt-1.5"
          >
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
  temperature: string;
  musicEnabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="mt-7 rounded-2xl border border-lux-border bg-lux-card2 p-5 shadow-[inset_0_1px_0_rgba(201,168,76,0.06)]"
    >
      <p className="text-[9px] tracking-[4px] uppercase text-gold/45 mb-4">
        Experience Summary
      </p>

      <div className="space-y-3">
        <SummaryRow label="Chauffeur" value={chauffeur} animateKey={chauffeur} />
        <SummaryRow label="ETA" value={`${eta} minutes`} animateKey={eta} />
        <SummaryRow label="Route" value="Optimized" fixed />
        <SummaryRow
          label="Cabin"
          value={`${temperature} · ${musicEnabled ? 'Ambient Music' : 'Quiet Mode'}`}
          animateKey={`${temperature}-${musicEnabled}`}
        />
      </div>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  animateKey,
  fixed,
}: {
  label: string;
  value: string;
  animateKey?: string | number;
  fixed?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-lux-muted tracking-wide">{label}</span>
      {fixed ? (
        <span className="text-[12px] text-lux-white font-medium tracking-wide">{value}</span>
      ) : (
        <AnimatePresence mode="wait">
          <motion.span
            key={animateKey}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="text-[12px] text-lux-white font-medium tracking-wide"
          >
            {value}
          </motion.span>
        </AnimatePresence>
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
      onClick={() => onChange(!value)}
      className={`relative inline-flex w-10 h-[22px] rounded-full transition-colors duration-300 focus:outline-none ${
        value ? 'bg-gold' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
          value ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// CTAButton
// ─────────────────────────────────────────────────────────

function CTAButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mt-8"
    >
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`
          w-full py-5 rounded-2xl
          text-[11px] font-bold tracking-[0.2em] uppercase
          text-[#06060A]
          bg-gradient-to-r from-[#D4AF5A] via-gold to-[#B8932E]
          shadow-[0_4px_32px_rgba(201,168,76,0.28)]
          hover:shadow-[0_4px_44px_rgba(201,168,76,0.42)]
          hover:brightness-110
          active:scale-[0.98]
          disabled:opacity-70 disabled:cursor-not-allowed
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          flex items-center justify-center gap-3
        `}
      >
        {loading ? (
          <>
            <Spinner />
            Preparing…
          </>
        ) : (
          'Launch Experience'
        )}
      </button>
    </motion.div>
  );
}

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      className="inline-block w-4 h-4 border-2 border-[#06060A]/30 border-t-[#06060A] rounded-full"
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
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg rounded-3xl border border-lux-border bg-lux-card p-12 text-center shadow-[0_0_120px_rgba(201,168,76,0.08)]"
    >
      {/* Checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 18 }}
        className="w-16 h-16 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-8"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          className="text-gold text-2xl leading-none"
        >
          ✓
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <p className="text-[9px] tracking-[5px] uppercase text-gold/50 mb-3">
          Experience Ready
        </p>
        <h2 className="font-serif text-[38px] font-light text-lux-white leading-tight mb-3">
          Journey{' '}
          <em className="text-gold2">Prepared</em>
        </h2>
        <p className="text-[13px] text-lux-muted mb-8 tracking-wide">
          Guest environment prepared successfully
        </p>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-2xl border border-lux-border bg-lux-card2 p-5 text-left space-y-3"
      >
        <SuccessRow label="Guest"      value={name} />
        <SuccessRow label="Chauffeur"  value={chauffeur} />
        <SuccessRow label="ETA"        value={`${eta} minutes`} />
        <SuccessRow label="Destination" value={destination} />
      </motion.div>
    </motion.div>
  );
}

function SuccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-lux-muted tracking-wide">{label}</span>
      <span className="text-[12px] text-lux-white font-medium">{value}</span>
    </div>
  );
}
