'use client';

import { motion } from 'framer-motion';
import { WHY_ITEMS } from '@/lib/services';

interface ScreenWhyProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function ScreenWhy({ onNext, onPrev }: ScreenWhyProps) {
  return (
    <div className="flex flex-col h-full px-8 py-10">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-3">The Difference</p>
        <h2 className="font-serif-lux text-[40px] font-light text-lux-white leading-tight">
          Why Clients Choose <em className="text-gold2">Synergy Lux</em>
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {WHY_ITEMS.map((item, i) => (
          <motion.div
            key={item.num}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 + 0.15 }}
            className="rounded-2xl p-5"
            style={{ background: '#0F0F14', border: '1px solid rgba(201,168,76,0.10)' }}
          >
            <p className="text-[11px] font-semibold text-gold/50 mb-2">{item.num}</p>
            <h3 className="text-[14px] font-medium text-lux-white mb-2">{item.title}</h3>
            <p className="text-[12px] text-lux-muted leading-relaxed">{item.body}</p>
          </motion.div>
        ))}
      </div>

      <Nav onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

function Nav({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between pt-6">
      <button onClick={onPrev} className="text-[11px] text-lux-muted tracking-[2px] uppercase hover:text-lux-white transition-colors">
        ← Back
      </button>
      <ProgressDots active={1} total={4} />
      <button
        onClick={onNext}
        className="text-[11px] tracking-[2.5px] uppercase px-6 py-3 rounded-xl border border-gold/30 text-gold hover:bg-gold/[0.06] transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

export function ProgressDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width:      i === active ? 20 : 6,
            height:     6,
            background: i === active ? '#C9A84C' : 'rgba(201,168,76,0.2)',
          }}
        />
      ))}
    </div>
  );
}
