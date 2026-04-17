'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';
import type { RidePhase, ModalType } from '@/lib/types';

interface DriverOverlayProps {
  phase: RidePhase;
  onPhaseChange: (phase: RidePhase) => void;
  onModalOpen: (type: ModalType) => void;
}

const PHASE_LABELS: Record<RidePhase, string> = {
  idle:        'IDLE',
  active:      'ACTIVE',
  midway:      'MIDWAY',
  pre_dropoff: 'PRE DROP-OFF',
  complete:    'COMPLETE',
};

export default function DriverOverlay({ phase, onPhaseChange, onModalOpen }: DriverOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [pressing, setPressing] = useState(false);

  const longPress = useLongPress(() => {
    setVisible(true);
    setPressing(false);
  }, 3000);

  function trigger(newPhase: RidePhase, modal?: ModalType) {
    onPhaseChange(newPhase);
    if (modal) onModalOpen(modal);
    setVisible(false);
  }

  return (
    <>
      {/* Invisible long-press zone — bottom-right corner */}
      <div
        {...longPress}
        onMouseDown={(e) => { setPressing(true);  longPress.onMouseDown(e); }}
        onMouseUp={(e)   => { setPressing(false); longPress.onMouseUp(e);   }}
        onTouchStart={(e) => { setPressing(true);  longPress.onTouchStart(e); }}
        onTouchEnd={(e)   => { setPressing(false); longPress.onTouchEnd(e);   }}
        className="fixed bottom-0 right-0 w-20 h-20 z-40 select-none"
        aria-label="Driver mode (long press)"
      >
        <AnimatePresence>
          {pressing && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gold/40"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Driver panel */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div
              className="rounded-2xl p-5"
              style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.22)', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] tracking-[3px] uppercase text-gold/55">Driver Mode</p>
                  <p className="text-[12px] text-lux-muted mt-0.5">
                    Phase: <span className="text-gold font-medium">{PHASE_LABELS[phase]}</span>
                  </p>
                </div>
                <button onClick={() => setVisible(false)} className="text-lux-muted text-sm hover:text-lux-white transition-colors">
                  ✕
                </button>
              </div>

              {/* Phase buttons */}
              <div className="grid grid-cols-2 gap-2">
                <PhaseBtn
                  label="START"
                  active={phase === 'active'}
                  color="gold"
                  onClick={() => trigger('active')}
                />
                <PhaseBtn
                  label="MIDWAY"
                  active={phase === 'midway'}
                  color="blue"
                  onClick={() => trigger('midway', 'midway')}
                />
                <PhaseBtn
                  label="5 MIN"
                  active={phase === 'pre_dropoff'}
                  color="amber"
                  onClick={() => trigger('pre_dropoff', 'pre_dropoff')}
                />
                <PhaseBtn
                  label="COMPLETE"
                  active={phase === 'complete'}
                  color="green"
                  onClick={() => trigger('complete')}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PhaseBtn({
  label, active, color, onClick,
}: {
  label: string; active: boolean; color: 'gold' | 'blue' | 'amber' | 'green'; onClick: () => void;
}) {
  const colorMap = {
    gold:  { bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.35)',  text: '#C9A84C'  },
    blue:  { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.35)',  text: '#818CF8'  },
    amber: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  text: '#FCD34D'  },
    green: { bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)',  text: '#4ADE80'  },
  };
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className="rounded-xl py-3 text-[10px] font-bold tracking-[2.5px] transition-all duration-200"
      style={{
        background: active ? c.bg : '#141419',
        border: `1px solid ${active ? c.border : 'rgba(201,168,76,0.10)'}`,
        color: active ? c.text : '#666672',
      }}
    >
      {label}
    </button>
  );
}
