'use client';

import { motion } from 'framer-motion';
import { useClock } from '@/hooks/useClock';
import type { Session } from '@/lib/types';

interface ScreenWelcomeProps {
  session: Session;
  onNext: () => void;
}

export default function ScreenWelcome({ session, onNext }: ScreenWelcomeProps) {
  const time = useClock();

  return (
    <div className="flex flex-col h-full px-8 py-10 justify-between">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4 text-[12px] text-lux-muted">
          <span className="flex items-center gap-2">
            <WifiDot />
            WiFi Connected
          </span>
          <span className="text-lux-white font-medium">{time}</span>
        </div>
      </div>

      {/* Center */}
      <div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[10px] tracking-[4px] uppercase text-gold/55 mb-4"
        >
          {session.occasion || 'In-Car Experience'}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif-lux text-[52px] font-light leading-[1.05] text-lux-white mb-6"
        >
          Welcome,{' '}
          <em className="text-gold2 not-italic">{session.name || 'Guest'}</em>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-3"
        >
          <Chip color="gold">Chauffeur: {session.chauffeur}</Chip>
          <Chip color="green">ETA: {session.etaMinutes} min</Chip>
          {session.destination && (
            <Chip color="gold">{session.destination}</Chip>
          )}
          {session.vipNote && (
            <Chip color="gold">✦ {session.vipNote}</Chip>
          )}
        </motion.div>
      </div>

      {/* Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between"
      >
        <p className="text-[11px] text-lux-muted tracking-[2px] uppercase">
          Synergy Lux · Dallas–Fort Worth
        </p>
        <button onClick={onNext} className="btn-outline-gold text-[10px] tracking-[2.5px] uppercase px-6 py-3 rounded-xl border border-gold/30 text-gold hover:bg-gold/[0.06] transition-colors">
          Explore →
        </button>
      </motion.div>

    </div>
  );
}

function Logo() {
  return (
    <p className="text-[12px] font-semibold tracking-[4px] uppercase text-lux-white">
      SYNERGY <span className="text-gold">LUX</span>
    </p>
  );
}

function WifiDot() {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }}
    />
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: 'gold' | 'green' }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-lux-white"
      style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.14)' }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={color === 'green'
          ? { background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }
          : { background: '#C9A84C' }
        }
      />
      {children}
    </span>
  );
}
