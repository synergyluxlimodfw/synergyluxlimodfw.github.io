'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Session } from '@/lib/types';

interface OperatorPanelProps {
  onStart: (session: Session) => void;
}

const DEFAULT_SESSION: Session = {
  name:        '',
  occasion:    '',
  destination: '',
  vipNote:     '',
  chauffeur:   'James',
  etaMinutes:  24,
};

export default function OperatorPanel({ onStart }: OperatorPanelProps) {
  const [form, setForm] = useState<Session>(DEFAULT_SESSION);
  const [errors, setErrors] = useState<Partial<Record<keyof Session, string>>>({});

  function set(key: keyof Session, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim())       errs.name       = 'Guest name is required';
    if (!form.chauffeur.trim())  errs.chauffeur  = 'Chauffeur name is required';
    if (!form.etaMinutes)        errs.etaMinutes = 'ETA is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleStart() {
    if (validate()) onStart(form);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-lux-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">Operator Setup</p>
        <h1 className="font-serif-lux text-[42px] font-light text-lux-white leading-tight mb-2">
          Begin the<br />
          <em className="text-gold2">Experience</em>
        </h1>
        <p className="text-[13px] text-lux-muted mb-10">
          Enter guest details to personalise the in-car session.
        </p>

        <div className="space-y-4">
          {/* Guest Name */}
          <Field label="Guest Name *" error={errors.name}>
            <input
              type="text"
              placeholder="e.g. Mr. Smith"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </Field>

          {/* Occasion */}
          <Field label="Occasion">
            <select value={form.occasion} onChange={e => set('occasion', e.target.value)}>
              <option value="">Select occasion (optional)</option>
              <option>Airport Transfer</option>
              <option>Business Travel</option>
              <option>Wedding</option>
              <option>Night Out</option>
              <option>Sporting Event</option>
              <option>Special Occasion</option>
            </select>
          </Field>

          {/* Destination */}
          <Field label="Destination">
            <input
              type="text"
              placeholder="e.g. DFW Airport, Terminal D"
              value={form.destination}
              onChange={e => set('destination', e.target.value)}
            />
          </Field>

          {/* Row: Chauffeur + ETA */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Chauffeur Name *" error={errors.chauffeur}>
              <input
                type="text"
                placeholder="e.g. James"
                value={form.chauffeur}
                onChange={e => set('chauffeur', e.target.value)}
              />
            </Field>
            <Field label="ETA (minutes) *" error={errors.etaMinutes?.toString()}>
              <input
                type="number"
                min={1}
                max={120}
                placeholder="24"
                value={form.etaMinutes}
                onChange={e => set('etaMinutes', parseInt(e.target.value) || 0)}
              />
            </Field>
          </div>

          {/* VIP Note */}
          <Field label="VIP Note">
            <input
              type="text"
              placeholder="e.g. Preferred temperature 72°F, no music"
              value={form.vipNote}
              onChange={e => set('vipNote', e.target.value)}
            />
          </Field>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          className="mt-8 w-full py-5 rounded-2xl text-[11px] font-bold tracking-[3px] uppercase transition-opacity hover:opacity-90"
          style={{ background: '#C9A84C', color: '#06060A' }}
        >
          Start Experience →
        </motion.button>

        <p className="text-center text-[11px] text-lux-muted mt-4">
          Synergy Lux · Dallas–Fort Worth ·{' '}
          <a href="tel:6468791391" className="text-gold">(646) 879-1391</a>
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  label, children, error,
}: {
  label: string; children: React.ReactNode; error?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-[2.5px] uppercase text-lux-muted mb-2">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
