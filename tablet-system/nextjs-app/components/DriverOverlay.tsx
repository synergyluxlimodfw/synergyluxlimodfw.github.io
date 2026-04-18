'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';
import { track } from '@/lib/events';
import { experienceStore } from '@/lib/experienceStore';
import type { RidePhase, ModalType } from '@/lib/types';

interface DriverOverlayProps {
  phase: RidePhase;
  onPhaseChange: (phase: RidePhase) => void;
  onModalOpen: (type: ModalType) => void;
  onReset: () => void;
}

const PHASE_LABELS: Record<RidePhase, string> = {
  idle:        'IDLE',
  active:      'ACTIVE',
  midway:      'MIDWAY',
  pre_dropoff: 'PRE DROP-OFF',
  complete:    'COMPLETE',
};

function haptic() {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(40);
  }
}

export default function DriverOverlay({ phase, onPhaseChange, onModalOpen, onReset }: DriverOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [pressing, setPressing] = useState(false);

  const longPress = useLongPress(() => {
    haptic();
    setVisible(true);
    setPressing(false);
  }, 3000);

  function trigger(newPhase: RidePhase, modal?: ModalType) {
    haptic();
    onPhaseChange(newPhase);
    if (modal) onModalOpen(modal);
    // Track event
    if (newPhase === 'active')      track('ride_started');
    if (newPhase === 'midway')      track('midway_prompt');
    if (newPhase === 'pre_dropoff') track('pre_dropoff_prompt');
    if (newPhase === 'complete') { track('ride_completed'); experienceStore.completeRide(); }
    setVisible(false);
  }

  function handleStart() {
    haptic();
    onReset();
    onPhaseChange('active');
    experienceStore.setActive();
    track('ride_started');
    setVisible(false);
  }

  return (
    <>
      {/* Invisible long-press zone — bottom-right corner */}
      <div
        {...longPress}
        onMouseDown={() => { setPressing(true);  longPress.onMouseDown(); }}
        onMouseUp={() =>   { setPressing(false); longPress.onMouseUp();   }}
        onTouchStart={() => { setPressing(true);  longPress.onTouchStart(); }}
        onTouchEnd={() =>   { setPressing(false); longPress.onTouchEnd();   }}
        className="fixed bottom-0 right-0 w-24 h-24 z-40 select-none"
        aria-label="Driver mode (long press)"
      >
        <AnimatePresence>
          {pressing && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-gold/50"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Driver panel */}
      <AnimatePresence>
        {visible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(6,6,10,0.6)', backdropFilter: 'blur(6px)' }}
              onClick={() => setVisible(false)}
            />

            {/* Bottom bar panel */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-5"
              style={{ background: '#0A0A0E', borderTop: '1px solid rgba(201,168,76,0.18)' }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  <p className="text-[10px] tracking-[3px] uppercase text-gold/70">Driver Mode</p>
                  <span
                    className="text-[9px] font-bold tracking-[2px] uppercase rounded-full px-2 py-0.5"
                    style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}
                  >
                    {PHASE_LABELS[phase]}
                  </span>
                </div>
                <button
                  onClick={() => setVisible(false)}
                  className="text-lux-muted text-base hover:text-lux-white transition-colors w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Phase buttons row */}
              <div className="grid grid-cols-4 gap-2.5">
                <PhaseBtn
                  label="START"
                  sub="New Ride"
                  active={phase === 'active'}
                  color="gold"
                  onClick={handleStart}
                />
                <PhaseBtn
                  label="MIDWAY"
                  sub="Show Promo"
                  active={phase === 'midway'}
                  color="blue"
                  onClick={() => trigger('midway', 'midway')}
                />
                <PhaseBtn
                  label="5 MIN OUT"
                  sub="Rebook CTA"
                  active={phase === 'pre_dropoff'}
                  color="amber"
                  onClick={() => trigger('pre_dropoff', 'pre_dropoff')}
                />
                <PhaseBtn
                  label="DONE"
                  sub="End Ride"
                  active={phase === 'complete'}
                  color="green"
                  onClick={() => trigger('complete', 'complete')}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function PhaseBtn({
  label, sub, active, color, onClick,
}: {
  label: string; sub: string; active: boolean; color: 'gold' | 'blue' | 'amber' | 'green'; onClick: () => void;
}) {
  const colorMap = {
    gold:  { bg: 'rgba(201,168,76,0.14)',  border: 'rgba(201,168,76,0.40)',  text: '#C9A84C'  },
    blue:  { bg: 'rgba(99,102,241,0.14)',  border: 'rgba(99,102,241,0.40)',  text: '#818CF8'  },
    amber: { bg: 'rgba(245,158,11,0.14)',  border: 'rgba(245,158,11,0.40)',  text: '#FCD34D'  },
    green: { bg: 'rgba(74,222,128,0.14)',  border: 'rgba(74,222,128,0.40)',  text: '#4ADE80'  },
  };
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 active:scale-95"
      style={{
        minHeight: '72px',
        background: active ? c.bg : '#141419',
        border: `1px solid ${active ? c.border : 'rgba(201,168,76,0.10)'}`,
        color: active ? c.text : '#666672',
      }}
    >
      <span className="text-[11px] font-bold tracking-[2px] uppercase">{label}</span>
      <span className="text-[9px] tracking-wider opacity-60">{sub}</span>
    </button>
  );
}
